// Google Play の Target API レベル要件と期限をベストエフォートで取得する。
// 公式 API が無いため公式ページを HTML スクレイプし、失敗時は policy.fallback.yml を使う。
import * as cheerio from 'cheerio';
import { parseLongDate } from '../lib/util.mjs';

const URL = 'https://developer.android.com/google/play/requirements/target-sdk';

// 戻り値: { requiredApiLevel, deadline, source, scraped(bool), note }
export async function fetchAndroidRequirement(fallback) {
  const fb = {
    requiredApiLevel: fallback?.requiredApiLevel ?? null,
    deadline: fallback?.deadline ?? null,
    source: fallback?.source ?? URL,
    scraped: false,
    note: 'fallback値（要手動確認）',
  };

  try {
    const res = await fetch(URL, { headers: { 'accept': 'text/html', 'user-agent': 'version-monitor' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = $('main').text() || $('body').text() || '';

    // "API level NN" を全て拾い、最大値を「最新の要求 API レベル」とみなす
    const apiLevels = [...text.matchAll(/API level\s+(\d{2,3})/gi)].map((m) => Number(m[1]));
    const requiredApiLevel = apiLevels.length ? Math.max(...apiLevels) : null;

    // 最大 API レベルの記述周辺にある日付（"Month DD, YYYY"）を採用
    let deadline = null;
    if (requiredApiLevel != null) {
      const idx = text.search(new RegExp(`API level\\s+${requiredApiLevel}`, 'i'));
      const window = idx >= 0 ? text.slice(idx, idx + 400) : text;
      deadline = parseLongDate(window) || parseLongDate(text);
    }

    if (requiredApiLevel != null && requiredApiLevel >= (fallback?.requiredApiLevel ?? 0) && deadline) {
      return { requiredApiLevel, deadline, source: URL, scraped: true, note: 'スクレイプ成功' };
    }
    return { ...fb, note: 'スクレイプ解析が不十分なため fallback 値を使用（要手動確認）' };
  } catch (e) {
    return { ...fb, note: `スクレイプ失敗(${e.message}) → fallback 値を使用（要手動確認）` };
  }
}
