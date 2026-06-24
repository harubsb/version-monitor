// Apple のアップロード要件（Xcode / iOS SDK と期限）をベストエフォートで取得する。
// 公式 API が無いため公式ニュースページを HTML スクレイプし、失敗時は policy.fallback.yml を使う。
import * as cheerio from 'cheerio';
import { parseLongDate } from '../lib/util.mjs';

const URL = 'https://developer.apple.com/news/upcoming-requirements/';

// 戻り値: { requiredXcode, requiredIosSdk, deadline, source, scraped(bool), note }
export async function fetchAppleRequirement(fallback) {
  const fb = {
    requiredXcode: fallback?.requiredXcode ?? null,
    requiredIosSdk: fallback?.requiredIosSdk ?? null,
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

    // "Xcode NN" / "iOS NN SDK" の最大値を最新要件とみなす
    const xcodes = [...text.matchAll(/Xcode\s+(\d{1,2})/gi)].map((m) => Number(m[1]));
    const iosSdks = [...text.matchAll(/iOS\s+(\d{1,2})\s+SDK/gi)].map((m) => Number(m[1]));
    const requiredXcode = xcodes.length ? Math.max(...xcodes) : null;
    const requiredIosSdk = iosSdks.length ? Math.max(...iosSdks) : null;

    // 最新 Xcode の記述周辺の日付を採用
    let deadline = null;
    if (requiredXcode != null) {
      const idx = text.search(new RegExp(`Xcode\\s+${requiredXcode}`, 'i'));
      const window = idx >= 0 ? text.slice(Math.max(0, idx - 200), idx + 300) : text;
      deadline = parseLongDate(window) || parseLongDate(text);
    }

    const okXcode = requiredXcode != null && requiredXcode >= (fallback?.requiredXcode ?? 0);
    if (okXcode && deadline) {
      return {
        requiredXcode,
        requiredIosSdk: requiredIosSdk ?? fallback?.requiredIosSdk ?? null,
        deadline,
        source: URL,
        scraped: true,
        note: 'スクレイプ成功',
      };
    }
    return { ...fb, note: 'スクレイプ解析が不十分なため fallback 値を使用（要手動確認）' };
  } catch (e) {
    return { ...fb, note: `スクレイプ失敗(${e.message}) → fallback 値を使用（要手動確認）` };
  }
}
