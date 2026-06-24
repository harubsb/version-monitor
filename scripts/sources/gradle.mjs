// Gradle の最新安定版を取得する。公式 JSON（高信頼）。
const URL = 'https://services.gradle.org/versions/current';

export async function fetchLatestGradle() {
  try {
    const res = await fetch(URL, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { latest: data.version ?? null, source: URL };
  } catch (e) {
    return { latest: null, source: URL, error: e.message };
  }
}
