// ─── Formato de números incrementales ────────────────────────────────────────
// 1234 → 1.23K · 5.6e9 → 5.60B · a partir de 1e15: aa, ab, ac…

const UNITS = ['', 'K', 'M', 'B', 'T'];

export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) {
    return n < 100 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString();
  }
  const tier = Math.floor(Math.log10(n) / 3);
  const scaled = n / Math.pow(10, tier * 3);
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return scaled.toFixed(digits) + unitFor(tier);
}

function unitFor(tier: number): string {
  if (tier < UNITS.length) return UNITS[tier];
  // tier 5 → aa, 6 → ab … 30 → az, 31 → ba …
  const i = tier - UNITS.length;
  const first = String.fromCharCode(97 + Math.floor(i / 26));
  const second = String.fromCharCode(97 + (i % 26));
  return first + second;
}

/** Formatea segundos como "1h 23m", "4m 05s" o "12s". */
export function fmtTime(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}

/** Porcentaje bonito: 0.25 → "+25%". */
export function fmtPct(x: number): string {
  return `+${Math.round(x * 100)}%`;
}
