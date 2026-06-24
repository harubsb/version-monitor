# version-monitor — RN/Expo バージョン使用期限モニター

React Native + Expo アプリの各種バージョンが **いつまで使えるか（ストア申請期限・サポート状況）** を、
指示したときに調べて `STATUS.md` を更新する監視ツールです。

- **期限・最新版は GitHub Actions で毎日自動更新**（cron）＋手動実行も可
- **現在バージョンの更新はローカルで実行して push**（クラウドからローカルのアプリフォルダは見えないため）
- 入力は **`current-versions.yml`（バージョン番号のみ）** だけ
- 最新版／ストア期限は公開情報（npm / Expo / Google / Apple / Gradle）から自動取得

## 役割分担（重要）

| 処理 | どこで | 頻度 |
|------|--------|------|
| ① 現在バージョンの更新（`current-versions.yml`） | **ローカル**（アプリのコードがある人） | アプリを更新したとき |
| ② 期限の再計算・`STATUS.md` 更新 | **GitHub Actions（クラウド）** | **毎日自動（cron）** ＋手動 |

> クラウドはローカルのアプリフォルダを読めないため、①はローカルで `extract-local.mjs` を実行して
> push する運用です。②は委ねられた `current-versions.yml` を読み、毎日 Web 調査して残り日数・
> 新要件・最新版を反映します。

### チーム運用フロー（メンバー向け）

アプリのバージョンが変わったときだけ、コードがある人が `current-versions.yml` を更新して push します。

1. リポジトリを最新化（GitHub Desktop なら `Fetch/Pull origin`、CLI なら `git pull`）
2. 現在バージョンを抽出（初回のみ `npm install` 済みであること）
   ```bash
   node scripts/extract-local.mjs アプリA=<パス> アプリA_K=<パス> アプリB=<パス>
   ```
   （Claude Code を使うなら「3アプリのパスは〇〇」と伝えれば実行まで代行可）
3. `current-versions.yml` をコミット＆push
   - **GitHub Desktop**: 変更を確認 → Summary 入力 → `Commit to main` → `Push origin`
   - **CLI**: `git add current-versions.yml && git commit -m "update versions" && git push`

   → あとは毎日、クラウドが `STATUS.md` を最新の期限で更新します。

## 監視している項目

バージョン番号のみを扱います（各項目の意味は `STATUS.md` の「項目の意味」にも記載）。

- **Expo SDK / React Native / React**: フレームワーク本体（最新との差・SDK サポート状況）
- **New Architecture**: RN 新基盤。将来必須化見込み（無効はリスク）
- **Android Target SDK**: Google Play 申請必須 API（最重要・期限あり）
- **Android minSdk**: 最低対応 API（参考・端末カバレッジ）
- **Kotlin / Android Gradle Plugin / Gradle**: Android ビルドツールチェーン（Gradle は最新比較）
- **iOS Deployment Target**: 最低対応 iOS（参考）
- **iOS SDK / Xcode**: アップロード必須要件（Apple 期限あり・現在値は手入力）
- **主要ライブラリ**: 公開 OSS の現在/最新・更新種別

## 🔒 プライバシー（最重要・public リポジトリ前提）

このリポジトリと `STATUS.md` には **バージョン番号と期限情報しか入れません**。
**リポジトリ名・アプリ名・フォルダパス・会社情報・個人情報・package.json 全文などは絶対に書かない／出力しない**こと。

- `current-versions.yml` に書くのはバージョン番号だけ。
- 追跡ライブラリは `config/tracked.yml` の **公開 OSS パッケージ名のみ**。社内/private パッケージ名は載せない。
- `scripts/extract-local.mjs` はローカルフォルダを読みますが、書き出すのはバージョン番号だけで、パス等は残しません。

## GitHub Actions セットアップ（初回のみ・管理者が1回だけ実施）

> 期限の毎日自動更新をクラウドで動かすための設定です。**1人がやれば全員に効きます。**
> ワークフロー定義（`.github/workflows/version-check.yml`）はリポジトリに含まれているので、追加でファイルを作る必要はありません。

> ⚠️ **最初の注意：設定する `Settings` は「リポジトリの設定」です。**
> GitHub 右上のアイコン →`Settings` は**アカウント設定**で、ここには Actions の権限設定はありません。
> 必ず **リポジトリ画面**（`Code / Issues / … / Settings` というタブが並ぶ画面）の **一番右の `Settings`** を開いてください。
> 見分け方：左上が「(ユーザー名) Your personal account」＝アカウント設定（誤）、`(ユーザー名) / version-monitor` のタブ内 `Settings`＝リポジトリ設定（正）。

### 手順

1. **書き込み権限を有効化（最重要）**
   リポジトリ設定 → 左メニュー「Code and automation」内の `Actions` → `General` を開く
   （直リンク: `https://github.com/<ユーザー名>/version-monitor/settings/actions`）→
   ページ最下部の **「Workflow permissions」** で **`Read and write permissions`** を選択 → `Save`。
   - これが無いと、ワークフローが `STATUS.md` を自動コミットできず `403` エラーになります。

2. **Actions タブを開く**
   上部タブ `Actions` を開く。`version-check` が一覧に見えていれば有効です。
   - もし「I understand my workflows, go ahead and enable them」という確認ボタンが出た場合のみ、それを押して有効化（出なければ不要）。

3. **初回実行（動作確認）**
   `Actions` → 左の **`version-check`** をクリック → 右側に出る青い帯
   **「This workflow has a `workflow_dispatch` event trigger.」** の右端 **`Run workflow`**（ドロップダウン）→
   ブランチ `main` のまま 緑の **`Run workflow`** を押す。
   - 数秒〜数分で実行が一覧に出ます（黄●＝実行中 → 緑✓＝成功）。
   - 成功後、`Code` タブ → `STATUS.md` の先頭が **`（手動実行）＋実行時刻`** に変わっていれば OK。
   - （補足）push 直後の `STATUS.md` は `（ローカル実行）` 表記のことがありますが、Actions が一度動けば `（手動実行）`／毎朝は `（自動(毎日)）` に切り替わります。

4. **以降は自動**
   毎日自動（cron, JST 9:00 目安／GitHub 側の都合で多少遅延あり）で `STATUS.md` が更新されます。
   すぐ更新したいときは手順3の `Run workflow` をいつでも押せます。

### うまくいかないとき

| 症状 | 対処 |
|------|------|
| `Settings` に `Actions` が無い | 開いているのが**アカウント設定**。リポジトリ画面のタブ内 `Settings` を開く（上の注意参照） |
| 自動コミットで `403` / `permission denied` | 手順1の `Read and write permissions` が未設定。設定して再実行 |
| `Run workflow` ボタンが出ない | `version-check` を選択してから右側の青帯を確認。ワークフローは `main`（デフォルトブランチ）に必要 |
| スケジュールが止まった | 公開リポジトリは 60 日間コミットが無いと cron 停止。手動 `Run workflow` で再開（通常は毎日コミットされるため起きません） |

---

## 使い方

複数アプリに対応しています。`current-versions.yml` は `apps:` の配列で、各アプリは
**内容を推測できない匿名 label**（例: `アプリA` / `アプリA_K` / `アプリB`）で管理します。

### 1. 現在バージョンを用意する（どちらか）

**A. 手入力**: `current-versions.yml` の各アプリ項目を編集（番号のみ）。

**B. ローカル抽出**: `<ラベル>=<アプリフォルダのパス>` を並べて渡すと自動反映（パスは保存されません）。
```bash
node scripts/extract-local.mjs アプリA=/path/to/app-a アプリA_K=/path/to/app-a-admin アプリB=/path/to/app-b
```
各フォルダの `package.json`（expo / react-native / react / 追跡ライブラリ）、`app.json` の
`expo-build-properties`、`eas.json` の `ANDROID_TARGET_SDK_VERSION` から抽出します。
自動取得できない項目（`xcode` など）は既存値を保持するので、必要に応じて手入力してください。
既存ラベルは上書き更新、新規ラベルは追記されます。

### 2. STATUS.md を更新する

**手元で実行**:
```bash
npm install      # 初回のみ（package-lock.json 生成）
npm run update   # = node scripts/update-status.mjs
```

**GitHub 上**: 毎日自動（cron, JST 9:00 目安）で更新されます。すぐ更新したいときは
**Actions → version-check → Run workflow** で手動実行も可能。`STATUS.md` に差分があれば自動コミットされます。

## ファイル構成

| パス | 役割 |
|------|------|
| `current-versions.yml` | 現在バージョン（番号のみ・唯一の入力） |
| `config/tracked.yml` | 追跡ライブラリのホワイトリスト・しきい値 |
| `config/policy.fallback.yml` | ストア期限のフォールバック定数（手動更新可） |
| `scripts/update-status.mjs` | メイン（調査 → STATUS.md 生成） |
| `scripts/extract-local.mjs` | ローカルフォルダ → current-versions.yml |
| `scripts/sources/*.mjs` | Expo / npm / Google Play / Apple の取得 |
| `scripts/render.mjs` | markdown 生成 |
| `.github/workflows/version-check.yml` | 毎日 cron ＋手動トリガーのワークフロー |
| `STATUS.md` | 生成物（GitHub で確認） |

## フォールバックの更新

Google Play / Apple は公式の綺麗な API が無いため、スクレイプ失敗時は `config/policy.fallback.yml`
の値を使います（`STATUS.md` に「fallback値・要手動確認」と明記）。公式ページを確認したら
`requiredApiLevel` / `requiredXcode` / `deadline` / `lastVerified` を更新してください。

- Google Play Target API: https://developer.android.com/google/play/requirements/target-sdk
- Apple Upcoming Requirements: https://developer.apple.com/news/upcoming-requirements/
