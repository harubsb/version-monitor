// npm registry から各パッケージの最新版（dist-tags.latest）を取得する。
// 公式 JSON（高信頼）。スコープ付きパッケージ（@scope/name）にも対応。

const REGISTRY = 'https://registry.npmjs.org/';

// abbreviated metadata を使い転送量を抑える
const ACCEPT = 'application/vnd.npm.install-v1+json';

function toUrl(pkg) {
  // スコープ付きは "/" を "%2F" にエンコード（"@" はそのまま）
  return REGISTRY + pkg.replace('/', '%2F');
}

export async function fetchNpmLatest(pkg) {
  const res = await fetch(toUrl(pkg), { headers: { accept: ACCEPT } });
  if (!res.ok) throw new Error(`npm HTTP ${res.status} for ${pkg}`);
  const data = await res.json();
  return data['dist-tags']?.latest ?? null;
}

// 複数パッケージをまとめて取得（失敗したものは null）
export async function fetchNpmLatestMany(pkgs) {
  const entries = await Promise.all(
    pkgs.map(async (pkg) => {
      try {
        return [pkg, await fetchNpmLatest(pkg)];
      } catch {
        return [pkg, null];
      }
    }),
  );
  return Object.fromEntries(entries);
}
