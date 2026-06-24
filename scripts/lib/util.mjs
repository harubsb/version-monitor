// 日付・残り日数・バージョン比較などの共通ユーティリティ。

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

// "August 31, 2025" → "2025-08-31"（解析不可なら null）
export function parseLongDate(text) {
  const m = /\b([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\b/.exec(text);
  if (!m) return null;
  const mon = MONTHS[m[1].toLowerCase()];
  if (!mon) return null;
  const day = String(Number(m[2])).padStart(2, '0');
  return `${m[3]}-${String(mon).padStart(2, '0')}-${day}`;
}

// "YYYY-MM-DD" を UTC 正午で Date 化（タイムゾーンずれ防止）
export function toDate(ymd) {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
}

// 期限までの残り日数（today も "YYYY-MM-DD"）。負なら超過。
export function daysUntil(deadlineYmd, todayYmd) {
  const d = toDate(deadlineYmd);
  const t = toDate(todayYmd);
  if (!d || !t) return null;
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}

// 残り日数 → 表示文字列
export function deadlineLabel(days) {
  if (days == null) return '不明';
  if (days < 0) return `超過(${Math.abs(days)}日前)`;
  if (days === 0) return '本日';
  return `${days}日後`;
}

// しきい値 → ステータス絵文字
export function statusEmoji(days, { warningDays, criticalDays }) {
  if (days == null) return '⚪';
  if (days < 0) return '⚫';
  if (days < criticalDays) return '🔴';
  if (days < warningDays) return '🟡';
  return '🟢';
}

// 現在のバージョン JST の "YYYY-MM-DD"（実行日）
export function todayYmd(date = new Date()) {
  // Asia/Tokyo (UTC+9) 基準で日付を決める
  const jst = new Date(date.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

// "3.5.23" → [3,5,23]
function parts(v) {
  return String(v).replace(/^[^\d]*/, '').split('.').map((n) => parseInt(n, 10) || 0);
}

// current と latest を比較して更新種別を返す（major/minor/patch/up-to-date/unknown）
export function diffKind(current, latest) {
  if (!current || !latest) return 'unknown';
  const c = parts(current);
  const l = parts(latest);
  if (c[0] !== l[0]) return c[0] < l[0] ? 'major' : 'up-to-date';
  if ((c[1] || 0) !== (l[1] || 0)) return (c[1] || 0) < (l[1] || 0) ? 'minor' : 'up-to-date';
  if ((c[2] || 0) !== (l[2] || 0)) return (c[2] || 0) < (l[2] || 0) ? 'patch' : 'up-to-date';
  return 'up-to-date';
}
