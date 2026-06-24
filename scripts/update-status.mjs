// メイン処理: current-versions.yml（複数アプリ）を読み、公開情報から最新版・ストア期限を
// 調査し、STATUS.md を生成する。GitHub Actions（workflow_dispatch）からもローカルからも実行可能。
//
// ★出力に入れるのはバージョン番号と期限情報だけ（ホワイトリスト方式）。label は匿名表記。
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import yaml from 'js-yaml';

import { fetchExpo } from './sources/expo.mjs';
import { fetchNpmLatestMany } from './sources/npm.mjs';
import { fetchAndroidRequirement } from './sources/android.mjs';
import { fetchAppleRequirement } from './sources/apple.mjs';
import { fetchLatestGradle } from './sources/gradle.mjs';
import { renderStatus } from './render.mjs';
import { daysUntil, deadlineLabel, statusEmoji, todayYmd, diffKind } from './lib/util.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const loadYaml = (rel) => yaml.load(readFileSync(join(ROOT, rel), 'utf8')) || {};
const orDash = (v) => (v == null || v === '' ? '—' : String(v));

// 1アプリ分のサマリー行とライブラリ行を組み立てる（ctx は共通の調査結果）
function buildApp(app, ctx) {
  const { expo, android, apple, gradle, thresholds, today, npmLatest, trackedLibs } = ctx;
  const rows = [];

  // Expo SDK（deprecated 判定。強制期限は無し）
  {
    const cur = app.expoSdk;
    const info = cur ? expo.infoForSdk(cur) : null;
    let status = '⚪';
    let deadlineText = '—';
    if (!cur) {
      deadlineText = '未設定';
    } else if (info?.isDeprecated) {
      status = '🔴';
      deadlineText = 'サポート終了(deprecated)';
    } else if (expo.latestSdk != null && Number(cur) < expo.latestSdk) {
      const behind = expo.latestSdk - Number(cur);
      status = behind >= 4 ? '🔴' : '🟡';
      deadlineText = `サポート中（最新まで ${behind} 世代遅れ）`;
    } else {
      status = '🟢';
      deadlineText = 'サポート中（最新）';
    }
    rows.push({ item: 'Expo SDK', current: orDash(cur), recommended: orDash(expo.latestSdk), deadlineText, status });
  }

  // React Native（0.x 系のため未更新は 🟡）
  {
    const cur = app.reactNative;
    const rec = expo.latestRn;
    const kind = diffKind(cur, rec);
    const status = !cur ? '⚪' : kind === 'up-to-date' ? '🟢' : '🟡';
    rows.push({ item: 'React Native', current: orDash(cur), recommended: orDash(rec), deadlineText: '—', status });
  }

  // React
  {
    const cur = app.react;
    const rec = expo.latestReact;
    const kind = diffKind(cur, rec);
    const status = !cur ? '⚪' : kind === 'up-to-date' ? '🟢' : '🟡';
    rows.push({ item: 'React', current: orDash(cur), recommended: orDash(rec), deadlineText: '—', status });
  }

  // New Architecture（RN の将来必須要件。無効は将来のビルド不可リスク）
  {
    const v = app.newArch;
    let status = '⚪';
    let current = '—';
    let deadlineText = '—';
    if (v === 'true') {
      status = '🟢';
      current = '有効';
      deadlineText = '対応済み';
    } else if (v === 'false') {
      status = '🟡';
      current = '無効';
      deadlineText = '将来必須化の見込み（要計画）';
    }
    rows.push({ item: 'New Architecture', current, recommended: '有効', deadlineText, status });
  }

  // Android Target SDK（ストア申請期限あり）
  {
    const cur = app.androidTargetSdk;
    const req = android.requiredApiLevel;
    let status = '⚪';
    let deadlineText = '—';
    if (!cur) {
      deadlineText = req != null ? `未設定（必須API${req} / 期限 ${orDash(android.deadline)}）要確認` : '未設定';
    } else if (req != null && Number(cur) >= req) {
      status = '🟢';
      deadlineText = '対応済み';
    } else if (req != null) {
      const days = daysUntil(android.deadline, today);
      status = statusEmoji(days, thresholds);
      deadlineText = `${orDash(android.deadline)} (${deadlineLabel(days)})`;
    }
    rows.push({ item: 'Android Target SDK', current: orDash(cur), recommended: orDash(req), deadlineText, status });
  }

  // Android minSdk（最低対応API。参考情報＝端末カバレッジ。低いほど広い）
  {
    const cur = app.minSdkVersion;
    rows.push({ item: 'Android minSdk', current: orDash(cur), recommended: '—', deadlineText: '参考（低いほど対応端末が広い）', status: cur ? 'ℹ️' : '⚪' });
  }

  // Kotlin（Android ビルドツールチェーン。参考情報）
  {
    const cur = app.kotlin;
    rows.push({ item: 'Kotlin', current: orDash(cur), recommended: '—', deadlineText: '参考（ビルドツールチェーン）', status: cur ? 'ℹ️' : '⚪' });
  }

  // AGP（Android Gradle Plugin。参考情報。Expo 管理だと未固定のことがある）
  {
    const cur = app.agp;
    rows.push({ item: 'Android Gradle Plugin', current: cur ? cur : '—（Expo管理/未固定）', recommended: '—', deadlineText: '参考（ビルドツールチェーン）', status: cur ? 'ℹ️' : '⚪' });
  }

  // Gradle（最新安定版との比較。強制期限なし。空欄はマネージド等で未コミット）
  {
    const cur = app.gradle;
    const rec = gradle.latest;
    const kind = diffKind(cur, rec);
    const status = !cur ? '⚪' : kind === 'up-to-date' ? '🟢' : kind === 'major' ? '🟡' : '🟢';
    const deadlineText = !cur ? 'ネイティブ未コミット/未設定' : '—';
    rows.push({ item: 'Gradle', current: orDash(cur), recommended: orDash(rec), deadlineText, status });
  }

  // iOS Deployment Target（最低対応iOS。参考情報＝端末カバレッジ）
  {
    const cur = app.iosDeploymentTarget;
    rows.push({ item: 'iOS Deployment Target', current: orDash(cur), recommended: '—', deadlineText: '参考（低いほど対応端末が広い）', status: cur ? 'ℹ️' : '⚪' });
  }

  // iOS SDK / Xcode（ビルド要件。Apple のアップロード期限あり。current はリポジトリから取得不可＝手入力）
  {
    const cur = app.xcode;
    const req = apple.requiredXcode;
    const recommended = `Xcode ${orDash(apple.requiredXcode)} / iOS ${orDash(apple.requiredIosSdk)} SDK`;
    let status = '⚪';
    let deadlineText = '—';
    if (!cur) {
      deadlineText = apple.deadline ? `未設定（期限 ${apple.deadline}）要確認` : '未設定';
    } else if (req != null && Number(cur) >= req) {
      status = '🟢';
      deadlineText = '対応済み';
    } else if (req != null) {
      const days = daysUntil(apple.deadline, today);
      status = statusEmoji(days, thresholds);
      deadlineText = `${orDash(apple.deadline)} (${deadlineLabel(days)})`;
    }
    rows.push({ item: 'iOS SDK / Xcode', current: cur ? `Xcode ${cur}` : '—', recommended, deadlineText, status });
  }

  // ライブラリ（ホワイトリストのうち、このアプリが使っているもの）
  const appLibs = app.libraries || {};
  const libraries = trackedLibs
    .filter((name) => appLibs[name])
    .map((name) => ({
      name,
      current: orDash(appLibs[name]),
      latest: orDash(npmLatest[name]),
      kind: diffKind(appLibs[name], npmLatest[name]),
    }));

  return { label: app.label || '(無名)', rows, libraries };
}

async function main() {
  const current = loadYaml('current-versions.yml');
  const tracked = loadYaml('config/tracked.yml');
  const fallback = loadYaml('config/policy.fallback.yml');
  const thresholds = tracked.thresholds || { warningDays: 90, criticalDays: 30 };
  const today = todayYmd();

  const apps = Array.isArray(current.apps) ? current.apps : [];
  if (apps.length === 0) {
    throw new Error('current-versions.yml に apps が定義されていません。');
  }
  const trackedLibs = tracked.libraries || [];

  // 共通の調査（1回だけ）。失敗は各 source 内で fallback 化。
  const [expo, android, apple, gradle, npmLatest] = await Promise.all([
    fetchExpo().catch((e) => ({ error: e.message, latestSdk: null, latestRn: null, latestReact: null, infoForSdk: () => null, source: 'expo' })),
    fetchAndroidRequirement(fallback.android),
    fetchAppleRequirement(fallback.apple),
    fetchLatestGradle(),
    fetchNpmLatestMany(trackedLibs),
  ]);

  const ctx = { expo, android, apple, gradle, thresholds, today, npmLatest, trackedLibs };
  const appModels = apps.map((app) => buildApp(app, ctx));

  const store = {
    androidReq: android.requiredApiLevel,
    androidDeadline: android.deadline,
    appleXcode: apple.requiredXcode,
    appleIosSdk: apple.requiredIosSdk,
    appleDeadline: apple.deadline,
    latestExpo: expo.latestSdk,
    latestRn: expo.latestRn,
    latestReact: expo.latestReact,
    latestGradle: gradle.latest,
  };

  const notes = [
    `Android 期限: ${android.note} / source: ${android.source}`,
    `Apple 期限: ${apple.note} / source: ${apple.source}`,
    `最新版（Expo SDK / RN / React / ライブラリ）: ${expo.error ? `Expo APIエラー(${expo.error})` : 'Expo API + npm registry'}`,
    `Gradle 最新版: ${gradle.error ? `取得失敗(${gradle.error})` : gradle.source}`,
  ];

  const model = { updatedAt: today, store, apps: appModels, notes };
  writeFileSync(join(ROOT, 'STATUS.md'), renderStatus(model), 'utf8');
  console.log(`STATUS.md updated (${today}). apps=${appModels.length}`);
}

main().catch((e) => {
  console.error('update-status failed:', e.message);
  process.exit(1);
});
