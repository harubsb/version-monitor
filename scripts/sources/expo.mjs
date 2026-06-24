// Expo versions API から SDK→RN/React の対応関係・最新SDK・deprecated 判定を取得する。
// 公式 JSON API（高信頼）: https://api.expo.dev/v2/versions/latest

const EXPO_VERSIONS_URL = 'https://api.expo.dev/v2/versions/latest';

const majorOf = (key) => parseInt(String(key).split('.')[0], 10);

export async function fetchExpo() {
  const res = await fetch(EXPO_VERSIONS_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Expo API HTTP ${res.status}`);
  const body = await res.json();
  // レスポンスは { data: { sdkVersions: {...} } } でラップされている（旧形式の素の sdkVersions にも対応）
  const sdkVersions = body?.data?.sdkVersions || body?.sdkVersions || {};

  const majors = Object.keys(sdkVersions)
    .map((k) => majorOf(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  const latestMajor = majors.length ? majors[majors.length - 1] : null;

  const findByMajor = (major) => {
    const hit = Object.entries(sdkVersions).find(([k]) => majorOf(k) === Number(major));
    return hit ? hit[1] : null;
  };

  const latestInfo = latestMajor != null ? findByMajor(latestMajor) : null;

  return {
    source: EXPO_VERSIONS_URL,
    latestSdk: latestMajor,
    latestRn: latestInfo?.facebookReactNativeVersion ?? null,
    latestReact: latestInfo?.facebookReactVersion ?? null,
    // 指定 SDK メジャーに対応する RN/React と deprecated 状態
    infoForSdk(major) {
      const v = findByMajor(major);
      if (!v) return null;
      return {
        rn: v.facebookReactNativeVersion ?? null,
        react: v.facebookReactVersion ?? null,
        isDeprecated: Boolean(v.isDeprecated),
      };
    },
  };
}
