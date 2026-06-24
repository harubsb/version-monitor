// 受け取った model（バージョン番号と期限情報のみ）から STATUS.md 用の markdown を生成する。
// ★ここでは model にある値しか出力しない（実アプリ名・パス等の混入を防ぐ固定テンプレート）。
//   label は呼び出し側で匿名化済み（アプリA など）。

export function renderStatus(model) {
  const L = [];
  L.push(`# 📱 バージョン使用期限ステータス`);
  L.push(`最終更新: **${model.generatedAt}**（${model.trigger}） ／ 自動更新: 毎日 JST 9:00 頃`);
  L.push('');

  // 共通のストア要件・最新版
  L.push('## ストア要件・最新版（共通・自動取得）');
  L.push(`- Android Target SDK 必須: API ${model.store.androidReq ?? '不明'}（期限 ${model.store.androidDeadline ?? '不明'}）`);
  L.push(`- Apple ビルド要件: Xcode ${model.store.appleXcode ?? '不明'} / iOS ${model.store.appleIosSdk ?? '不明'} SDK（期限 ${model.store.appleDeadline ?? '不明'}）`);
  L.push(`- 最新: Expo SDK ${model.store.latestExpo ?? '不明'} / React Native ${model.store.latestRn ?? '不明'} / React ${model.store.latestReact ?? '不明'} / Gradle ${model.store.latestGradle ?? '不明'}`);
  L.push('');

  // 要対応サマリー（期限あり・未対応のみ）。GitHub では diff ブロックの「-」行が赤字表示される。
  L.push('## ⚠️ 要対応サマリー（期限あり・対応が必要な項目のみ）');
  if (model.actions && model.actions.length) {
    L.push('> [!CAUTION]');
    L.push('> 申請・ビルドができなくなる可能性がある項目です。**赤字の行＝要対応**。早めの更新を。');
    L.push('');
    L.push('```diff');
    for (const a of model.actions) {
      const remain =
        a.days == null
          ? '期限不明'
          : a.days < 0
            ? `超過${Math.abs(a.days)}日（申請不可の可能性）`
            : a.days === 0
              ? '本日まで'
              : `あと${a.days}日`;
      L.push(`- ${a.label} / ${a.item}: 現在 ${a.current} → 必須 ${a.required} / 期限 ${a.deadline ?? '不明'} / ${remain}`);
    }
    L.push('```');
  } else {
    L.push('```diff');
    L.push('+ 期限到来前に対応が必要な項目はありません');
    L.push('```');
  }
  L.push('');
  if (model.checks && model.checks.length) {
    L.push('要確認（現在値が未設定で判定できない・期限あり）:');
    for (const c of model.checks) {
      L.push(`- ❓ ${c.label} / ${c.item}（期限 ${c.deadline ?? '不明'}）… \`current-versions.yml\` に現在値を入れると残り日数を判定します`);
    }
    L.push('');
  }

  // アプリごとのセクション
  for (const app of model.apps) {
    L.push(`## ${app.label}`);
    L.push('| 項目 | 現在 | 推奨(最新) | 使用期限 | 状態 |');
    L.push('|------|------|-----------|----------|------|');
    for (const r of app.rows) {
      L.push(`| ${r.item} | ${r.current} | ${r.recommended} | ${r.deadlineText} | ${r.status} |`);
    }
    L.push('');
    if (app.libraries.length) {
      L.push('ライブラリ更新状況:');
      L.push('| パッケージ | 現在 | 最新 | 種別 |');
      L.push('|------|------|------|------|');
      for (const l of app.libraries) {
        L.push(`| ${l.name} | ${l.current} | ${l.latest} | ${l.kind} |`);
      }
      L.push('');
    }
  }

  L.push('## 凡例');
  L.push('🟢 余裕 / 🟡 警告 / 🔴 危険 / ⚫ 期限超過 / ⚪ 未設定・不明 / ℹ️ 参考情報（良し悪しの判定なし）');
  L.push('');
  L.push('## 項目の意味');
  L.push('- **Expo SDK**: Expo のメジャー版。古いと EAS Build/OTA 更新の対象外になりやすい（最新まで何世代遅れかを表示）');
  L.push('- **React Native / React**: フレームワーク本体。Expo SDK に対応する版が推奨');
  L.push('- **New Architecture**: RN の新基盤(Fabric/TurboModules)。将来必須化見込みで、無効のままだといずれビルド不可リスク');
  L.push('- **Android Target SDK**: Google Play 申請に必須の API レベル。未達だと更新申請ができない（最重要・期限あり）');
  L.push('- **Android minSdk**: 最低対応 API。低いほど対応端末が広い（参考）');
  L.push('- **Kotlin / Android Gradle Plugin / Gradle**: Android ビルドツールチェーン。Gradle のみ最新版と比較、他は参考');
  L.push('- **iOS Deployment Target**: 最低対応 iOS。低いほど対応端末が広い（参考）');
  L.push('- **iOS SDK / Xcode**: アップロードに必須の Xcode/iOS SDK（Apple 期限あり）。現在値はリポジトリから取れないため手入力');
  L.push('- **ライブラリ**: 主要な公開 OSS の現在/最新と更新種別(major/minor/patch)');
  L.push('');
  L.push('## 補足 / 自動取得の信頼性');
  for (const n of model.notes) L.push(`- ${n}`);
  L.push('');
  L.push('---');
  L.push(
    '> このファイルは `current-versions.yml` のバージョン番号のみを入力に、公開情報（npm / Expo / Google / Apple）から自動生成しています。実アプリ名・会社/個人情報・パス・リポジトリ名は含みません（ラベルは匿名）。',
  );
  L.push('');
  return L.join('\n');
}
