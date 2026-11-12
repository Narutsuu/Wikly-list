"use client";
import { useState } from "react";
import type { Store } from "@/lib/store";
import { Inst, taskInst, toggleTask } from "@/lib/cal";
export default function Tasks({ s, filter, open }: { s: Store; filter: string | null; open: (i: Inst | null, d: Date) => void }) {
  const [title, setTitle] = useState("");
  const add = () => { const t = title.trim(); if (!t) return; s.upsert("tasks", { id: crypto.randomUUID(), title: t, done: false, priority: 2, category_id: filter }); setTitle(""); };
  const rows = s.tasks.filter(t => !filter || t.category_id === filter);
  return (
    <section className="max-w-xl">
      <form className="mb-6 flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nouvelle tâche, ex. Terminer mon montage" className="inp min-w-0 flex-1" />
        <button className="btn">Ajouter</button>
      </form>
      {rows.length === 0 && <p className="text-slate2">Aucune tâche. Ajoutez la première ci-dessus.</p>}
      <ul className="divide-y divide-line">
        {[...rows.filter(t => !t.done), ...rows.filter(t => t.done)].map(t => { const c = s.cats.find(x => x.id === t.category_id); return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <input type="checkbox" checked={t.done} onChange={() => toggleTask(s, taskInst(t))} className="h-5 w-5 accent-[#1E6FD9]" aria-label={`Terminer ${t.title}`} />
            <div className={`min-w-0 flex-1 ${t.done ? "text-slate2 line-through" : ""}`}>
              <div className="truncate">{t.title}{t.priority === 1 && <b className="ml-2 text-xs text-red-600">Haute</b>}</div>
              <div className="flex items-center gap-2 text-xs text-slate2">
                {c && <><i className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</>}
                {t.due_at && <span>{new Date(t.due_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}{t.recurrence && <span>Répétée</span>}
              </div>
            </div>
            <button className="text-sm underline" onClick={() => open(taskInst(t), new Date())}>Modifier</button>
            <button className="text-sm text-slate2 underline" onClick={() => s.remove("tasks", t.id)}>Supprimer</button>
          </li>); })}
      </ul>
    </section>
  );
}
