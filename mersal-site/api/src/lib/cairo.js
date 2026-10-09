// Egypt time (Africa/Cairo, UTC+2 or +3 in summer). Reference numbers, the admin "from / to" filters and the
// console's dates are Cairo calendar days; timestamps are stored in UTC (ISO strings).
"use strict";

const TZ = "Africa/Cairo";
const isDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !isNaN(Date.parse(s + "T00:00:00Z"));

// Today's date in Egypt as YYYY-MM-DD; +/- days
function cairoDay(offsetDays = 0, now = new Date()) {
  const d = new Date(now.getTime() + offsetDays * 864e5);
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
  catch { return d.toISOString().slice(0, 10); }
}

// Minutes Cairo is ahead of UTC at the instant ms (120 or 180)
const PARTS = (() => { try { return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }); } catch { return null; } })();
function offsetMinutes(ms) {
  if (!PARTS) return 120;
  const p = {}; for (const x of PARTS.formatToParts(new Date(ms))) p[x.type] = +x.value;
  return Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 60000);
}

// UTC instant (ms) where the Cairo day "YYYY-MM-DD" starts. Two passes so the DST switch days come out right
// (Egypt moves its clocks at midnight, so the spring day starts at 01:00 local).
function dayStartUtc(day) {
  const base = Date.parse(day + "T00:00:00Z");
  let t = base - offsetMinutes(base) * 60e3;
  t = base - offsetMinutes(t) * 60e3;
  return t;
}

// Filter bounds for Cairo days: { from: ms | null, to: ms | null } with `to` exclusive (the start of the next day).
function range(from, to) {
  const next = (d) => new Date(Date.parse(d + "T00:00:00Z") + 864e5).toISOString().slice(0, 10);
  return { from: isDay(from) ? dayStartUtc(from) : null, to: isDay(to) ? dayStartUtc(next(to)) : null };
}
// Is the ISO timestamp inside range(from, to)?
function inRange(iso, r) {
  if (r.from == null && r.to == null) return true;
  const t = Date.parse(iso || "");
  if (isNaN(t)) return false;
  return (r.from == null || t >= r.from) && (r.to == null || t < r.to);
}

module.exports = { TZ, cairoDay, offsetMinutes, dayStartUtc, range, inRange, isDay };
