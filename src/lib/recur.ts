export type Rule = { freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"; interval: number; byday: number[]; until: string };
const D = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export function parse(s?: string | null): Rule | null {
  if (!s) return null;
  const m: Record<string, string> = {}; s.split(";").forEach(p => { const [k, v] = p.split("="); m[k] = v; });
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(m.FREQ)) return null;
  const u = m.UNTIL;
  return { freq: m.FREQ as Rule["freq"], interval: Math.max(1, +(m.INTERVAL || 1)),
    byday: (m.BYDAY || "").split(",").filter(Boolean).map(x => D.indexOf(x)).filter(i => i >= 0),
    until: u ? `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}` : "" };
}
export function stringify(r: Rule | null): string | null {
  if (!r) return null;
  return [`FREQ=${r.freq}`, r.interval > 1 && `INTERVAL=${r.interval}`, r.freq === "WEEKLY" && r.byday.length && `BYDAY=${r.byday.map(i => D[i]).join(",")}`,
    r.until && `UNTIL=${r.until.replace(/-/g, "")}`].filter(Boolean).join(";");
}
// Dates (heure locale) d'une série comprises entre from et to, sans les exceptions (ex) => aucun doublon possible
export function occurrences(start: Date, r: Rule, from: Date, to: Date, ex: string[] = []): Date[] {
  const out: Date[] = [], exs = new Set(ex.map(x => +new Date(x)));
  const until = r.until ? new Date(+r.until.slice(0, 4), +r.until.slice(5, 7) - 1, +r.until.slice(8, 10), 23, 59, 59) : null;
  const limit = until && until < to ? until : to;
  const base = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const i0 = Math.max(0, Math.floor((+from - +start) / 864e5) - 1);
  for (let i = i0; i < i0 + 8000; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, start.getHours(), start.getMinutes());
    if (d > limit) break;
    const diff = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - base) / 864e5);
    let ok: boolean;
    if (r.freq === "DAILY") ok = diff % r.interval === 0;
    else if (r.freq === "WEEKLY") ok = (r.byday.length ? r.byday : [start.getDay()]).includes(d.getDay()) && Math.floor((diff + start.getDay()) / 7) % r.interval === 0;
    else if (r.freq === "MONTHLY") ok = d.getDate() === start.getDate() && ((d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth()) % r.interval === 0;
    else ok = d.getDate() === start.getDate() && d.getMonth() === start.getMonth() && (d.getFullYear() - start.getFullYear()) % r.interval === 0;
    if (ok && d >= from && !exs.has(+d)) out.push(d);
  }
  return out;
}
