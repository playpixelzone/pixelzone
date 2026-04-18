/** Zahlenformatierung wie in game-rework-v2.js (`fmtNumber` / `fmtPps`). */

export function fmtNumber(v: number): string {
  if (!Number.isFinite(v)) return "0";
  if (Math.abs(v) < 10) return v.toFixed(2);
  if (v < 1000) return Math.floor(v).toString();
  if (v < 1_000_000) return `${(v / 1000).toFixed(2)}K`;
  if (v < 1_000_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  return `${(v / 1_000_000_000).toFixed(2)}B`;
}

export function fmtPps(v: number): string {
  if (v < 1) return v.toFixed(2);
  return fmtNumber(v);
}
