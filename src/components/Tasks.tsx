"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Store } from "@/lib/store";
import { Inst, addDays, day0, fmtT, instances, sameDay, taskInst, toggleTask } from "@/lib/cal";
export function CheckBtn({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.82 }} onClick={e => { e.stopPropagation(); onClick(); }} aria-label={label} aria-pressed={on}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-tide bg-tide" : "border-line"}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12l5 5 9-10" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.2 }} />
      </svg>
    </motion.button>);
}
export default function Tasks({ s, filter, open, notify }: { s: Store; filter: string | null; open: (i: Inst | null, d: Date) => void; notify: (m: string) => void }) {
  const [day, setDay] = useState(() => day0(new Date())), [title, setTitle] = useState("");
  const keep = (i: Inst) => !filter || i.catId === filter;
  const dated = instances([], s.tasks, s.cats, day, new Date(+addDays(day, 1) - 1), true, s.doneIds).filter(keep);
  const undated = s.tasks.filter(t => !t.due_at).map(taskInst).filter(keep);
  const all = [...dated, ...undated], done = all.filter(i => i.done).length, pct = all.length ? (done / all.length) * 100 : 0;
  const rows = [...all.filter(i => !i.done), ...all.filter(i => i.done)];
  const add = () => {
    const t = title.trim(); if (!t) return;
    s.upsert("tasks", { id: crypto.randomUUID(), title: t, done: false, priority: 2, category_id: filter, due_at: day.toISOString() }); // même enregistrement dans la liste et le calendrier
    setTitle(""); notify("Tâche ajoutée");
  };
  const del = (i: Inst) => { if (!i.task || (i.occ && !confirm("Supprimer toute la série ?"))) return; s.remove("tasks", i.task.id); notify("Tâche supprimée"); };
  return (
    <section className="max-w-xl">
      <div className="mb-4 flex items-center gap-2">
        <button className="btn2 w-10 !px-0" aria-label="Jour précédent" onClick={() => setDay(addDays(day, -1))}>‹</button>
        <h2 className="flex-1 text-center text-lg font-semibold capitalize">{sameDay(day, new Date()) ? "Aujourd'hui" : day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</h2>
        <button className="btn2 w-10 !px-0" aria-label="Jour suivant" onClick={() => setDay(addDays(day, 1))}>›</button>
        {!sameDay(day, new Date()) && <button className="btn2" onClick={() => setDay(day0(new Date()))}>Aujourd'hui</button>}
      </div>
      <div className="mb-5"><div className="mb-1 flex justify-between text-sm text-slate2"><span>{done} sur {all.length} terminée(s)</span><span>{Math.round(pct)} %</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-line"><motion.div className="h-full rounded-full bg-tide" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} /></div></div>
      <form className="mb-4 flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nouvelle tâche pour ce jour, ex. Terminer mon montage" className="inp min-w-0 flex-1" />
        <button className="btn">Ajouter</button>
      </form>
      {rows.length === 0 && <p className="py-6 text-center text-slate2">Rien de prévu ce jour. Ajoutez une tâche ci-dessus.</p>}
      <ul className="divide-y divide-line">
        <AnimatePresence initial={false}>{rows.map(i => { const c = s.cats.find(x => x.id === i.catId); return (
          <motion.li key={i.key} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="flex items-center gap-3 py-3">
            <CheckBtn on={!!i.done} onClick={() => toggleTask(s, i)} label={`Terminer ${i.title}`} />
            <button className="min-w-0 flex-1 text-left" onClick={() => open(i, i.start)}>
              <div className={`truncate transition-colors ${i.done ? "text-slate2 line-through" : ""}`}>{i.title}{i.task?.priority === 1 && <b className="ml-2 text-xs text-red-400">Haute</b>}</div>
              <div className="flex items-center gap-2 text-xs text-slate2">
                {!i.allDay && <span>{fmtT(i.start, s.settings.hour12)}</span>}{c && <><i className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</>}
                {i.occ && <span>Répétée</span>}{!i.task?.due_at && <span>Sans date</span>}
              </div>
            </button>
            <button className="min-h-10 px-2 text-sm text-slate2 underline" onClick={() => del(i)}>Supprimer</button>
          </motion.li>); })}</AnimatePresence>
      </ul>
    </section>
  );
}
