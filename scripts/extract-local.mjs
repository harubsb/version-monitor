// ローカルのアプリフォルダから「バージョン番号のみ」を抽出し current-versions.yml を更新する。
// 使い方: node scripts/extract-local.mjs <ラベル>=<アプリフォルダのパス> [<ラベル>=<パス> ...]
//   例: node scripts/extract-local.mjs アプリA=/home/me/app-a アプリB=/home/me/app-b
//
// ★重要: 抽出してファイルに書き込むのはバージョン番号と匿名ラベルだけ。
//   フォルダパス・実アプリ名・リポジトリ名・package.json 全文などは一切書き込まない／コミットしない。
//   パスは引数として受け取るのみで、出力ファイルには残さない。既存の他アプリ定義は維持する。
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('使い方: node scripts/extract-local.mjs <ラベル>=<アプリフォルダのパス> [<ラベル>=<パス> ...]');
  process.exit(1);
}

const clean = (v) => (v == null ? '' : String(v).replace(/^[\^~>=<\s]+/, '').trim());
const majorOf = (v) => (clean(v).split('.')[0] || '');
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// 追跡ライブラリのホワイトリスト
const tracked = yaml.load(readFileSync(join(ROOT, 'config/tracked.yml'), 'utf8')) || {};
const whitelist = tracked.libraries || [];

// 既存の current-versions.yml を読み込み（apps を維持）
let doc = { apps: [] };
try {
  doc = yaml.load(readFileSync(join(ROOT, 'current-versions.yml'), 'utf8')) || { apps: [] };
} catch {
  /* 初回など */
}
if (!Array.isArray(doc.apps)) doc.apps = [];

// 1フォルダから匿名のバージョン情報のみを抽出
function extractFrom(appDir) {
  if (!existsSync(join(appDir, 'package.json'))) {
    throw new Error(`package.json が見つかりません: (パスは伏せます)`);
  }
  const pkg = readJson(join(appDir, 'package.json'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

  let androidTargetSdk = '';
  let iosDeploymentTarget = '';
  let minSdkVersion = '';
  let kotlin = '';
  let agp = '';
  let newArch = '';
  // (1) app.json / app.config.json の expo-build-properties / newArchEnabled
  for (const f of ['app.json', 'app.config.json']) {
    const p = join(appDir, f);
    if (!existsSync(p)) continue;
    try {
      const cfg = readJson(p);
      const expoCfg = cfg.expo || cfg;
      if (typeof expoCfg.newArchEnabled === 'boolean') newArch = String(expoCfg.newArchEnabled);
      for (const pl of expoCfg.plugins || []) {
        if (Array.isArray(pl) && pl[0] === 'expo-build-properties' && pl[1]) {
          if (pl[1].android?.targetSdkVersion != null) androidTargetSdk = String(pl[1].android.targetSdkVersion);
          if (pl[1].android?.minSdkVersion != null) minSdkVersion = String(pl[1].android.minSdkVersion);
          if (pl[1].ios?.deploymentTarget != null) iosDeploymentTarget = String(pl[1].ios.deploymentTarget);
        }
      }
    } catch {
      /* 解析できない場合は空のまま */
    }
    break;
  }
  // (2) eas.json の build.*.android.env.ANDROID_TARGET_SDK_VERSION（production を優先）
  if (!androidTargetSdk && existsSync(join(appDir, 'eas.json'))) {
    try {
      const builds = (readJson(join(appDir, 'eas.json')).build) || {};
      const prod = builds.production?.android?.env?.ANDROID_TARGET_SDK_VERSION;
      const anyV = Object.values(builds)
        .map((p) => p?.android?.env?.ANDROID_TARGET_SDK_VERSION)
        .find(Boolean);
      if (prod || anyV) androidTargetSdk = String(prod || anyV);
    } catch {
      /* skip */
    }
  }

  // (3) android/build.gradle（コミット済みネイティブ）があれば最優先で上書き
  let gradle = '';
  const gradleBuild = join(appDir, 'android', 'build.gradle');
  if (existsSync(gradleBuild)) {
    try {
      const txt = readFileSync(gradleBuild, 'utf8');
      const mt = /targetSdkVersion\s*=?\s*(\d+)/.exec(txt);
      if (mt) androidTargetSdk = mt[1];
      const mm = /minSdkVersion\s*=?\s*(\d+)/.exec(txt);
      if (mm) minSdkVersion = mm[1];
      const mk = /kotlinVersion\s*=\s*["']([\d.]+)["']/.exec(txt);
      if (mk) kotlin = mk[1];
      const ma = /com\.android\.tools\.build:gradle:([\d.]+)/.exec(txt); // バージョン指定がある場合のみ
      if (ma) agp = ma[1];
    } catch {
      /* skip */
    }
  }
  // Gradle バージョンは gradle-wrapper.properties の distributionUrl から
  const wrapper = join(appDir, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');
  if (existsSync(wrapper)) {
    try {
      const m = /gradle-([\d.]+)-/.exec(readFileSync(wrapper, 'utf8'));
      if (m) gradle = m[1];
    } catch {
      /* skip */
    }
  }
  // New Architecture は android/gradle.properties を優先（無ければ app.json の値を維持）
  const gradleProps = join(appDir, 'android', 'gradle.properties');
  if (existsSync(gradleProps)) {
    try {
      const m = /^[ \t]*newArchEnabled[ \t]*=[ \t]*(true|false)/m.exec(readFileSync(gradleProps, 'utf8'));
      if (m) newArch = m[1];
    } catch {
      /* skip */
    }
  }
  // iOS Deployment Target は ios/Podfile の最初の非コメント platform 行から
  const podfile = join(appDir, 'ios', 'Podfile');
  if (!iosDeploymentTarget && existsSync(podfile)) {
    try {
      for (const line of readFileSync(podfile, 'utf8').split('\n')) {
        if (/^\s*#/.test(line)) continue; // コメント行は無視
        if (/platform\s+:ios/.test(line)) {
          const nums = [...line.matchAll(/['"](\d+\.\d+(?:\.\d+)?)['"]/g)].map((x) => x[1]);
          if (nums.length) iosDeploymentTarget = nums[nums.length - 1]; // 末尾の数値（フォールバック既定値）
          break;
        }
      }
    } catch {
      /* skip */
    }
  }

  const libraries = {};
  for (const name of whitelist) {
    if (deps[name]) libraries[name] = clean(deps[name]);
  }

  return {
    expoSdk: majorOf(deps.expo),
    reactNative: clean(deps['react-native']),
    react: clean(deps.react),
    newArch,
    androidTargetSdk,
    minSdkVersion,
    kotlin,
    agp,
    gradle,
    iosDeploymentTarget,
    xcode: '', // ビルドに使う Xcode はリポジトリからは確実に取得不可（手入力）
    libraries,
  };
}

const summary = [];
for (const arg of args) {
  const eq = arg.indexOf('=');
  if (eq < 0) {
    console.error(`引数の形式が不正です（<ラベル>=<パス> で指定）: ${arg}`);
    process.exit(1);
  }
  const label = arg.slice(0, eq).trim();
  const appDir = arg.slice(eq + 1).trim();

  const extracted = extractFrom(appDir);
  const existing = doc.apps.find((a) => a.label === label);
  const entry = { label, ...extracted };
  // 自動取得できなかった項目（androidTargetSdk / iosDeploymentTarget / xcode）は既存値を保持
  for (const k of ['newArch', 'androidTargetSdk', 'minSdkVersion', 'kotlin', 'agp', 'gradle', 'iosDeploymentTarget', 'xcode']) {
    if (!entry[k] && existing?.[k]) entry[k] = existing[k];
  }
  if (existing) Object.assign(existing, entry);
  else doc.apps.push(entry);

  summary.push(`${label}: expoSdk=${entry.expoSdk || '(空)'}, RN=${entry.reactNative || '(空)'}, libs=${Object.keys(entry.libraries).length}`);
}

const header = `# 現在のアプリのバージョン（番号のみ）。これがこのツールの唯一の入力です。
# ★バージョン番号以外（実アプリ名・リポジトリ名・パス・会社情報など）は書かないこと。label は匿名表記。
# 自動生成: node scripts/extract-local.mjs <ラベル>=<パス> ...（パスは保存されません）

`;
writeFileSync(
  join(ROOT, 'current-versions.yml'),
  header + yaml.dump({ apps: doc.apps }, { lineWidth: 120, quotingType: '"', forceQuotes: true }),
  'utf8',
);

console.log('current-versions.yml を更新しました（バージョン番号のみ・パスは非保存）。');
for (const s of summary) console.log(' -', s);
console.log('※ androidTargetSdk / xcode は自動取得できない場合があります。必要に応じて手入力してください。');
