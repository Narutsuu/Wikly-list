import type { Task } from "./sync";
import { Rule, occurrences, parse, stringify } from "./recur";
import type { Store } from "./store";
export type Cat = { id: string; name: string; color: string; updated_at: string };
export type Ev = { id: string; title: string; starts_at: string; ends_at: string | null; recurrence: string | null; category_id: string | null; color: string | null; all_day: boolean; exdates: string[] | null; series_id: string | null; original_start: string | null; description: string | null; updated_at: string };
export type Inst = { key: string; title: string; start: Date; end: Date; allDay: boolean; color: string; catId: string | null; ev?: Ev; task?: Task; occ?: Date; done?: boolean };
export type Form = { kind: "event" | "task"; title: string; date: string; start: string; end: string; allDay: boolean; catId: string; color: string; rec: Rule | null; notes: string; prio: number };
export const COLOR = "#1E6FD9";
export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const mk = (date: string, time: string) => { const [y, m, d] = date.split("-").map(Number), [h, i] = time.split(":").map(Number); return new Date(y, m - 1, d, h, i); };
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes());
export const day0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
export const weekStart = (d: Date, ws: number) => addDays(day0(d), -((d.getDay() - ws + 7) % 7));
export const fmtT = (d: Date, h12: boolean) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: h12 });
export const textOn = (c: string) => { const n = parseInt(c.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.65 ? "#10202B" : "#fff"; };

export function instances(evs: Ev[], tasks: Task[], cats: Cat[], from: Date, to: Date, showTasks: boolean): Inst[] {
  const col = (c: string | null | undefined, own?: string | null) => own || cats.find(x => x.id === c)?.color || COLOR;
  const out: Inst[] = [];
  for (const e of evs) {
    const s = new Date(e.starts_at), dur = e.ends_at ? +new Date(e.ends_at) - +s : 3600000, r = parse(e.recurrence);
    const list = r ? occurrences(s, r, from, to, e.exdates || []) : (s <= to && +s + dur >= +from ? [s] : []);
    for (const st of list) out.push({ key: e.id + "@" + st.toISOString(), title: e.title, start: st, end: new Date(+st + dur), allDay: e.all_day, color: col(e.category_id, e.color), catId: e.category_id, ev: e, occ: r ? st : undefined });
  }
  if (showTasks) for (const t of tasks) {
    if (!t.due_at) continue;
    const s = new Date(t.due_at), r = parse(t.recurrence);
    for (const st of r ? occurrences(s, r, from, to) : (s >= from && s <= to ? [s] : [])) out.push({ ...taskInst(t), key: t.id + "@" + st.toISOString(), start: st, end: st, allDay: st.getHours() === 0 && st.getMinutes() === 0, color: col(t.category_id), occ: r ? st : undefined });
  }
  return out.sort((a, b) => +a.start - +b.start);
}
export const taskInst = (t: Task): Inst => { const s = t.due_at ? new Date(t.due_at) : new Date(); return { key: t.id, title: t.title, start: s, end: s, allDay: !!t.due_at && s.getHours() === 0 && s.getMinutes() === 0, color: COLOR, catId: t.category_id ?? null, task: t, occ: parse(t.recurrence) && t.due_at ? s : undefined, done: t.done }; };
export function toForm(i: Inst | null, date: Date, dur = 60): Form {
  const s = i ? i.start : date, e = i ? i.end : new Date(+date + dur * 60000);
  return { kind: i?.task ? "task" : "event", title: i?.title || "", date: ymd(s), start: hm(s), end: hm(e), allDay: i ? i.allDay : false, catId: i?.catId || "", color: i?.ev?.color || "", rec: parse((i?.ev ?? i?.task)?.recurrence), notes: i?.ev?.description || "", prio: i?.task?.priority ?? 2 };
}
export function saveForm(s: Store, inst: Inst | null, f: Form, scope: "occ" | "all") {
  const st = mk(f.date, f.allDay ? "00:00" : f.start);
  let en = mk(f.date, f.allDay ? "23:59" : f.end); if (en <= st) en = new Date(+st + 3600000);
  const rec = stringify(f.rec), id = () => crypto.randomUUID();
  if (f.kind === "task") {
    const t = inst?.task, due = t?.due_at && inst?.occ ? new Date(+new Date(t.due_at) + (+st - +inst.occ)) : st; // série : on décale toute la série
    s.upsert("tasks", { ...(t || { id: id(), done: false }), title: f.title, priority: f.prio, due_at: due.toISOString(), recurrence: rec, category_id: f.catId || null });
    return;
  }
  const c = { title: f.title, all_day: f.allDay, category_id: f.catId || null, color: f.color || null, description: f.notes || null };
  const ev = inst?.ev;
  if (!ev) return s.upsert("events", { id: id(), ...c, starts_at: st.toISOString(), ends_at: en.toISOString(), recurrence: rec, exdates: [], series_id: null, original_start: null });
  if (ev.recurrence && inst?.occ && scope === "occ") { // une seule occurrence : exception dans la série + événement de remplacement
    s.upsert("events", { ...ev, exdates: [...(ev.exdates || []), inst.occ.toISOString()] });
    return s.upsert("events", { id: id(), ...c, starts_at: st.toISOString(), ends_at: en.toISOString(), recurrence: null, exdates: [], series_id: ev.id, original_start: inst.occ.toISOString() });
  }
  if (ev.recurrence && inst?.occ) { // toute la série
    const d = +st - +inst.occ, ms = new Date(+new Date(ev.starts_at) + d);
    return s.upsert("events", { ...ev, ...c, starts_at: ms.toISOString(), ends_at: new Date(+ms + (+en - +st)).toISOString(), recurrence: rec, exdates: (ev.exdates || []).map(x => new Date(+new Date(x) + d).toISOString()) });
  }
  s.upsert("events", { ...ev, ...c, starts_at: st.toISOString(), ends_at: en.toISOString(), recurrence: rec });
}
export function deleteInst(s: Store, i: Inst, scope: "occ" | "all") {
  if (i.task) return s.remove("tasks", i.task.id);
  const ev = i.ev!;
  if (ev.recurrence && i.occ && scope === "occ") return s.upsert("events", { ...ev, exdates: [...(ev.exdates || []), i.occ.toISOString()] });
  s.remove("events", ev.id);
}
export function moveInst(s: Store, i: Inst, to: Date) {
  const f = toForm(i, i.start); f.date = ymd(to); if (!i.allDay) { const d = +i.end - +i.start; f.start = hm(to); f.end = hm(new Date(+to + d)); }
  saveForm(s, i, f, "occ");
}
export function toggleTask(s: Store, i: Inst) {
  const t = i.task!, r = parse(t.recurrence), now = new Date().toISOString();
  if (r && t.due_at) { // tâche récurrente : on passe à l'occurrence suivante au lieu de la clore
    const next = occurrences(new Date(t.due_at), r, new Date(+i.start + 60000), new Date(+i.start + 800 * 864e5))[0];
    if (next) return s.upsert("tasks", { ...t, due_at: next.toISOString(), completed_at: now });
  }
  s.upsert("tasks", { ...t, done: !t.done, completed_at: t.done ? null : now });
}
