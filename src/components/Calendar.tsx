"use client";
import { useMemo, useRef, useState } from "react";
import type { Store } from "@/lib/store";
import { Inst, addDays, day0, fmtT, instances, moveInst, pad, sameDay, textOn, toggleTask, weekStart } from "@/lib/cal";
type View = "day" | "week" | "month";
export default function Calendar({ s, filter, open }: { s: Store; filter: string | null; open: (i: Inst | null, d: Date) => void }) {
  const st = s.settings, [v, setV] = useState<View | null>(null), view = v ?? st.view;
  const [cur, setCur] = useState(() => new Date()), drag = useRef<Inst | null>(null);
  const days = useMemo(() => {
    if (view === "day") return [day0(cur)];
    const first = view === "week" ? cur : new Date(cur.getFullYear(), cur.getMonth(), 1), a = weekStart(first, st.weekStart);
    return Array.from({ length: view === "week" ? 7 : 42 }, (_, i) => addDays(a, i));
  }, [view, cur, st.weekStart]);
  const list = useMemo(() => instances(s.events, s.tasks, s.cats, days[0], new Date(+addDays(days[days.length - 1], 1) - 1), st.showTasks).filter(i => !filter || i.catId === filter), [s.events, s.tasks, s.cats, days, st.showTasks, filter]);
  const step = (n: number) => setCur(view === "day" ? addDays(cur, n) : view === "week" ? addDays(cur, 7 * n) : new Date(cur.getFullYear(), cur.getMonth() + n, 1));
  const title = view === "day" ? cur.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : view === "week" ? `${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
    : cur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const drop = (d: Date, h?: number) => (e: React.DragEvent) => {
    e.preventDefault(); const i = drag.current; drag.current = null; if (!i) return;
    moveInst(s, i, new Date(d.getFullYear(), d.getMonth(), d.getDate(), h ?? i.start.getHours(), h != null ? 0 : i.start.getMinutes()));
  };
  const chip = (i: Inst) => (
    <div key={i.key} draggable onDragStart={e => { drag.current = i; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", i.key); }}
      onClick={e => { e.stopPropagation(); open(i, i.start); }} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && open(i, i.start)}
      className="flex cursor-grab items-center gap-1 truncate rounded px-1.5 py-0.5 text-xs" style={{ background: i.color, color: textOn(i.color), opacity: i.done ? 0.55 : 1 }}>
      {i.task && <input type="checkbox" aria-label="Terminer" checked={!!i.done} onClick={e => e.stopPropagation()} onChange={() => toggleTask(s, i)} />}
      {!i.allDay && <b>{fmtT(i.start, st.hour12)}</b>}<span className={`truncate ${i.done ? "line-through" : ""}`}>{i.title}</span>
    </div>);
  const at = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9);
  const over = (e: React.DragEvent) => e.preventDefault();
  const today = new Date();
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="btn2" aria-label="Précédent" onClick={() => step(-1)}>‹</button>
        <button className="btn2" onClick={() => setCur(new Date())}>Aujourd'hui</button>
        <button className="btn2" aria-label="Suivant" onClick={() => step(1)}>›</button>
        <h2 className="mx-2 text-lg font-semibold capitalize">{title}</h2>
        <div className="ml-auto flex gap-1">{(["day", "week", "month"] as const).map(k => <button key={k} onClick={() => setV(k)} className={`chip ${view === k ? "bg-tide text-white" : ""}`}>{{ day: "Jour", week: "Semaine", month: "Mois" }[k]}</button>)}</div>
        <button className="btn" onClick={() => open(null, at(cur))}>Nouveau</button>
      </div>
      {view === "month" && <div className="overflow-x-auto"><div className="grid min-w-[640px] grid-cols-7 gap-px rounded-lg border border-line bg-[var(--line)]">
        {days.slice(0, 7).map(d => <div key={d.getDay()} className="bg-card p-1 text-center text-xs text-slate2">{d.toLocaleDateString("fr-FR", { weekday: "short" })}</div>)}
        {days.map(d => { const it = list.filter(i => sameDay(i.start, d)); return (
          <div key={+d} onDragOver={over} onDrop={drop(d)} onClick={() => open(null, at(d))} className={`min-h-24 space-y-0.5 bg-card p-1 ${d.getMonth() !== cur.getMonth() ? "opacity-50" : ""}`}>
            <div className={`mb-1 text-xs ${sameDay(d, today) ? "inline-block rounded-full bg-tide px-1.5 text-white" : "text-slate2"}`}>{d.getDate()}</div>
            {it.slice(0, 3).map(chip)}{it.length > 3 && <button className="text-xs text-slate2 underline" onClick={e => { e.stopPropagation(); setCur(d); setV("day"); }}>+{it.length - 3} autres</button>}
          </div>); })}
      </div></div>}
      {view === "week" && <div className="overflow-x-auto"><div className="grid min-w-[700px] grid-cols-7 gap-px rounded-lg border border-line bg-[var(--line)]">
        {days.map(d => <div key={+d} onDragOver={over} onDrop={drop(d)} onClick={() => open(null, at(d))} className="min-h-72 space-y-1 bg-card p-1.5">
          <div className={`mb-1 text-sm ${sameDay(d, today) ? "font-semibold text-tide" : "text-slate2"}`}>{d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</div>
          {list.filter(i => sameDay(i.start, d)).map(chip)}</div>)}
      </div></div>}
      {view === "day" && <div className="rounded-lg border border-line bg-card">
        <div onDragOver={over} onDrop={drop(days[0])} className="min-h-10 space-y-1 border-b border-line p-1.5"><span className="text-xs text-slate2">Toute la journée</span>{list.filter(i => i.allDay).map(chip)}</div>
        {Array.from({ length: 24 }, (_, h) => <div key={h} onDragOver={over} onDrop={drop(days[0], h)} onClick={() => open(null, new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), h))} className="flex min-h-12 gap-2 border-b border-line p-1 last:border-0">
          <span className="w-14 shrink-0 text-xs text-slate2">{fmtT(new Date(2000, 0, 1, h), st.hour12)}</span>
          <div className="flex-1 space-y-1">{list.filter(i => !i.allDay && i.start.getHours() === h).map(chip)}</div></div>)}
      </div>}
      <p className="mt-2 text-xs text-slate2">Glissez un élément sur un autre jour{view === "day" ? " ou une autre heure" : ""} pour le déplacer. Sur téléphone, appuyez sur l'élément pour changer sa date.</p>
    </section>
  );
}
