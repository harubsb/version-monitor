# 📱 バージョン使用期限ステータス
最終更新: **2026-07-06 12:53 JST**（自動(毎日)） ／ 自動更新: 毎日 JST 9:00 頃

## ストア要件・最新版（共通・自動取得）
- Android Target SDK 必須: API 35（期限 2025-08-31）
- Apple ビルド要件: Xcode 26 / iOS 18 SDK（期限 2026-04-28）
- 最新: Expo SDK 57 / React Native 0.86.0 / React 19.2.3 / Gradle 9.6.1

## ⚠️ 要対応サマリー（期限あり・対応が必要な項目のみ）
> [!CAUTION]
> 申請・ビルドができなくなる可能性がある項目です。**赤字の行＝要対応**。早めの更新を。

```diff
- アプリB / Android Target SDK: 現在 33 → 必須 API 35 / 期限 2025-08-31 / 超過309日（申請不可の可能性）
```

要確認（現在値が未設定で判定できない・期限あり）:
- ❓ アプリA / iOS SDK / Xcode（期限 2026-04-28）… `current-versions.yml` に現在値を入れると残り日数を判定します
- ❓ アプリA_K / iOS SDK / Xcode（期限 2026-04-28）… `current-versions.yml` に現在値を入れると残り日数を判定します
- ❓ アプリB / iOS SDK / Xcode（期限 2026-04-28）… `current-versions.yml` に現在値を入れると残り日数を判定します

## アプリA
| 項目 | 現在 | 推奨(最新) | 使用期限 | 状態 |
|------|------|-----------|----------|------|
| Expo SDK | 52 | 57 | サポート中（最新まで 5 世代遅れ） | 🔴 |
| React Native | 0.76.6 | 0.86.0 | — | 🟡 |
| React | 18.3.1 | 19.2.3 | — | 🟡 |
| New Architecture | 無効 | 有効 | 将来必須化の見込み（要計画） | 🟡 |
| Android Target SDK | 35 | 35 | 対応済み | 🟢 |
| Android minSdk | 24 | — | 参考（低いほど対応端末が広い） | ℹ️ |
| Kotlin | 1.9.24 | — | 参考（ビルドツールチェーン） | ℹ️ |
| Android Gradle Plugin | —（Expo管理/未固定） | — | 参考（ビルドツールチェーン） | ⚪ |
| Gradle | 8.10.2 | 9.6.1 | — | 🟡 |
| iOS Deployment Target | 15.1 | — | 参考（低いほど対応端末が広い） | ℹ️ |
| iOS SDK / Xcode | — | Xcode 26 / iOS 18 SDK | 未設定（期限 2026-04-28）要確認 | ⚪ |

ライブラリ更新状況:
| パッケージ | 現在 | 最新 | 種別 |
|------|------|------|------|
| @react-navigation/native | 6.0.6 | 7.3.7 | major |
| @react-navigation/bottom-tabs | 6.0.9 | 7.18.7 | major |
| react-native-safe-area-context | 4.12.0 | 5.8.0 | major |
| react-native-screens | 4.4.0 | 4.25.2 | minor |

## アプリA_K
| 項目 | 現在 | 推奨(最新) | 使用期限 | 状態 |
|------|------|-----------|----------|------|
| Expo SDK | 53 | 57 | サポート中（最新まで 4 世代遅れ） | 🔴 |
| React Native | 0.79.2 | 0.86.0 | — | 🟡 |
| React | 19.0.0 | 19.2.3 | — | 🟡 |
| New Architecture | 有効 | 有効 | 対応済み | 🟢 |
| Android Target SDK | 35 | 35 | 対応済み | 🟢 |
| Android minSdk | — | — | 参考（低いほど対応端末が広い） | ⚪ |
| Kotlin | — | — | 参考（ビルドツールチェーン） | ⚪ |
| Android Gradle Plugin | —（Expo管理/未固定） | — | 参考（ビルドツールチェーン） | ⚪ |
| Gradle | — | 9.6.1 | ネイティブ未コミット/未設定 | ⚪ |
| iOS Deployment Target | — | — | 参考（低いほど対応端末が広い） | ⚪ |
| iOS SDK / Xcode | — | Xcode 26 / iOS 18 SDK | 未設定（期限 2026-04-28）要確認 | ⚪ |

ライブラリ更新状況:
| パッケージ | 現在 | 最新 | 種別 |
|------|------|------|------|
| @react-navigation/native | 7.0.13 | 7.3.7 | minor |
| @react-navigation/bottom-tabs | 7.1.3 | 7.18.7 | minor |
| react-native-safe-area-context | 5.4.0 | 5.8.0 | minor |
| react-native-screens | 4.10.0 | 4.25.2 | minor |
| react-native-reanimated | 3.17.4 | 4.5.1 | major |
| react-native-gesture-handler | 2.24.0 | 3.0.2 | major |

## アプリB
| 項目 | 現在 | 推奨(最新) | 使用期限 | 状態 |
|------|------|-----------|----------|------|
| Expo SDK | 48 | 57 | サポート中（最新まで 9 世代遅れ） | 🔴 |
| React Native | 0.71.6 | 0.86.0 | — | 🟡 |
| React | 18.2.0 | 19.2.3 | — | 🟡 |
| New Architecture | 無効 | 有効 | 将来必須化の見込み（要計画） | 🟡 |
| Android Target SDK | 33 | 35 | 2025-08-31 (超過(309日前)) | ⚫ |
| Android minSdk | 21 | — | 参考（低いほど対応端末が広い） | ℹ️ |
| Kotlin | 1.6.0 | — | 参考（ビルドツールチェーン） | ℹ️ |
| Android Gradle Plugin | 7.3.1 | — | 参考（ビルドツールチェーン） | ℹ️ |
| Gradle | 7.5.1 | 9.6.1 | — | 🟡 |
| iOS Deployment Target | 13.0 | — | 参考（低いほど対応端末が広い） | ℹ️ |
| iOS SDK / Xcode | — | Xcode 26 / iOS 18 SDK | 未設定（期限 2026-04-28）要確認 | ⚪ |

ライブラリ更新状況:
| パッケージ | 現在 | 最新 | 種別 |
|------|------|------|------|
| @react-navigation/native | 6.0.6 | 7.3.7 | major |
| @react-navigation/bottom-tabs | 6.0.9 | 7.18.7 | major |
| react-native-safe-area-context | 4.5.0 | 5.8.0 | major |
| react-native-screens | 3.20.0 | 4.25.2 | major |
| react-native-reanimated | 3.4.2 | 4.5.1 | major |
| react-native-gesture-handler | 2.12.1 | 3.0.2 | major |

## 凡例
🟢 余裕 / 🟡 警告 / 🔴 危険 / ⚫ 期限超過 / ⚪ 未設定・不明 / ℹ️ 参考情報（良し悪しの判定なし）

## 項目の意味
- **Expo SDK**: Expo のメジャー版。古いと EAS Build/OTA 更新の対象外になりやすい（最新まで何世代遅れかを表示）
- **React Native / React**: フレームワーク本体。Expo SDK に対応する版が推奨
- **New Architecture**: RN の新基盤(Fabric/TurboModules)。将来必須化見込みで、無効のままだといずれビルド不可リスク
- **Android Target SDK**: Google Play 申請に必須の API レベル。未達だと更新申請ができない（最重要・期限あり）
- **Android minSdk**: 最低対応 API。低いほど対応端末が広い（参考）
- **Kotlin / Android Gradle Plugin / Gradle**: Android ビルドツールチェーン。Gradle のみ最新版と比較、他は参考
- **iOS Deployment Target**: 最低対応 iOS。低いほど対応端末が広い（参考）
- **iOS SDK / Xcode**: アップロードに必須の Xcode/iOS SDK（Apple 期限あり）。現在値はリポジトリから取れないため手入力
- **ライブラリ**: 主要な公開 OSS の現在/最新と更新種別(major/minor/patch)

## 補足 / 自動取得の信頼性
- Android 期限: スクレイプ解析が不十分なため fallback 値を使用（要手動確認） / source: https://developer.android.com/google/play/requirements/target-sdk
- Apple 期限: スクレイプ成功 / source: https://developer.apple.com/news/upcoming-requirements/
- 最新版（Expo SDK / RN / React / ライブラリ）: Expo API + npm registry
- Gradle 最新版: https://services.gradle.org/versions/current

---
> このファイルは `current-versions.yml` のバージョン番号のみを入力に、公開情報（npm / Expo / Google / Apple）から自動生成しています。実アプリ名・会社/個人情報・パス・リポジトリ名は含みません（ラベルは匿名）。
