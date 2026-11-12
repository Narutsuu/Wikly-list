"use client";
import { useState } from "react";
import type { Store } from "@/lib/store";
import { Form, Inst, COLOR, deleteInst, saveForm, toForm } from "@/lib/cal";
import type { Rule } from "@/lib/recur";
export type Ed = { inst: Inst | null; date: Date; kind?: "event" | "task" };
const WD = ["D", "L", "M", "M", "J", "V", "S"], WN = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export default function Editor({ s, ed, onClose }: { s: Store; ed: Ed; onClose: () => void }) {
  const [f, setF] = useState<Form>(() => ({ ...toForm(ed.inst, ed.date, s.settings.duration), ...(!ed.inst && ed.kind ? { kind: ed.kind } : {}) }));
  const [scope, setScope] = useState<"occ" | "all">("occ");
  const set = (p: Partial<Form>) => setF(x => ({ ...x, ...p }));
  const isTask = f.kind === "task", r = f.rec;
  const occ = !!ed.inst && !ed.inst.task && !!ed.inst.occ;
  const setR = (p: Partial<Rule>) => r && set({ rec: { ...r, ...p } });
  const catColor = s.cats.find(c => c.id === f.catId)?.color || COLOR;
  const save = () => { if (!f.title.trim()) return; saveForm(s, ed.inst, { ...f, title: f.title.trim() }, scope); onClose(); };
  const del = () => {
    const serie = ed.inst!.task ? !!r : occ && scope === "all";
    if (confirm(serie ? "Supprimer toute la série ?" : "Supprimer cet élément ?")) { deleteInst(s, ed.inst!, scope); onClose(); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <form onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); save(); }} className="max-h-[92vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-2xl bg-card p-5 md:rounded-2xl">
        {!ed.inst && <div className="flex gap-2">{(["event", "task"] as const).map(k => <button type="button" key={k} onClick={() => set({ kind: k })} className={`chip ${f.kind === k ? "bg-tide text-white" : ""}`}>{k === "event" ? "Événement" : "Tâche"}</button>)}</div>}
        <input autoFocus className="inp" placeholder={isTask ? "Titre de la tâche" : "Titre de l'événement"} value={f.title} onChange={e => set({ title: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="inp" value={f.date} onChange={e => set({ date: e.target.value })} required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allDay} onChange={e => set({ allDay: e.target.checked })} />{isTask ? "Sans heure" : "Journée entière"}</label>
          {!f.allDay && <input type="time" className="inp" value={f.start} onChange={e => set({ start: e.target.value })} required />}
          {!f.allDay && !isTask && <input type="time" className="inp" value={f.end} onChange={e => set({ end: e.target.value })} required />}
        </div>
        <select className="inp" value={f.catId} onChange={e => set({ catId: e.target.value })}>
          <option value="">Sans catégorie</option>{s.cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {isTask
          ? <select className="inp" value={f.prio} onChange={e => set({ prio: +e.target.value })}><option value={1}>Priorité haute</option><option value={2}>Priorité normale</option><option value={3}>Priorité basse</option></select>
          : <div className="flex items-center gap-3 text-sm"><input type="color" aria-label="Couleur" value={f.color || catColor} onChange={e => set({ color: e.target.value })} />{f.color ? <button type="button" className="underline" onClick={() => set({ color: "" })}>Utiliser la couleur de la catégorie</button> : <span className="text-slate2">Couleur de la catégorie</span>}</div>}
        <div className="space-y-2 rounded-lg border border-line p-3">
          <select className="inp" value={r?.freq || ""} onChange={e => set({ rec: e.target.value ? { freq: e.target.value as Rule["freq"], interval: 1, byday: e.target.value === "WEEKLY" ? [new Date(f.date + "T00:00").getDay()] : [], until: "" } : null })}>
            <option value="">Ne se répète pas</option><option value="DAILY">Tous les jours</option><option value="WEEKLY">Chaque semaine</option><option value="MONTHLY">Chaque mois</option><option value="YEARLY">Chaque année</option>
          </select>
          {r && <>
            <label className="flex items-center gap-2 text-sm">Tous les <input type="number" min={1} max={99} className="inp !w-20" value={r.interval} onChange={e => setR({ interval: Math.max(1, +e.target.value || 1) })} /> {({ DAILY: "jour(s)", WEEKLY: "semaine(s)", MONTHLY: "mois", YEARLY: "an(s)" } as Record<string, string>)[r.freq]}</label>
            {r.freq === "WEEKLY" && <div className="flex gap-1" role="group" aria-label="Jours">{[1, 2, 3, 4, 5, 6, 0].map(d => <button type="button" key={d} aria-label={WN[d]} aria-pressed={r.byday.includes(d)} onClick={() => setR({ byday: r.byday.includes(d) ? r.byday.filter(x => x !== d) : [...r.byday, d] })} className={`h-9 w-9 rounded-full border border-line text-sm ${r.byday.includes(d) ? "bg-tide text-white" : ""}`}>{WD[d]}</button>)}</div>}
            <label className="flex items-center gap-2 text-sm">Jusqu'au <input type="date" className="inp" value={r.until} onChange={e => setR({ until: e.target.value })} /></label>
          </>}
        </div>
        {!isTask && <textarea className="inp" rows={2} placeholder="Notes" value={f.notes} onChange={e => set({ notes: e.target.value })} />}
        {occ && <div className="flex gap-4 text-sm"><label><input type="radio" checked={scope === "occ"} onChange={() => setScope("occ")} /> Cette occurrence</label><label><input type="radio" checked={scope === "all"} onChange={() => setScope("all")} /> Toute la série</label></div>}
        {ed.inst?.task && r && <p className="text-sm text-slate2">Les modifications s'appliquent à toute la série.</p>}
        <div className="flex gap-2"><button className="btn">Enregistrer</button><button type="button" className="btn2" onClick={onClose}>Annuler</button>{ed.inst && <button type="button" className="btn2 ml-auto text-red-600" onClick={del}>Supprimer</button>}</div>
      </form>
    </div>
  );
}
