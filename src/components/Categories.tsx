"use client";
import { useState } from "react";
import type { Store } from "@/lib/store";
import { COLOR } from "@/lib/cal";
export default function Categories({ s }: { s: Store }) {
  const [name, setName] = useState(""), [color, setColor] = useState(COLOR);
  const count = (id: string) => s.tasks.filter(t => t.category_id === id).length + s.events.filter(e => e.category_id === id).length;
  return (
    <section className="max-w-xl">
      <h2 className="mb-4 text-xl font-semibold">Catégories</h2>
      <form className="mb-6 flex gap-2" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; s.upsert("categories", { id: crypto.randomUUID(), name: name.trim(), color }); setName(""); }}>
        <input type="color" aria-label="Couleur" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-12 shrink-0" />
        <input className="inp" placeholder="Nouvelle catégorie, ex. Montage" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn">Créer</button>
      </form>
      {s.cats.length === 0 && <p className="text-slate2">Aucune catégorie. Créez-en une pour classer vos tâches et événements.</p>}
      <ul className="divide-y divide-line">
        {[...s.cats].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
          <li key={c.id} className="flex items-center gap-3 py-3">
            <input type="color" aria-label={`Couleur de ${c.name}`} value={c.color} onChange={e => s.upsert("categories", { ...c, color: e.target.value })} className="h-9 w-10 shrink-0" />
            <input className="inp" aria-label="Nom" defaultValue={c.name} key={c.updated_at} onBlur={e => { const n = e.target.value.trim(); if (n && n !== c.name) s.upsert("categories", { ...c, name: n }); }} />
            <span className="w-24 shrink-0 text-sm text-slate2">{count(c.id)} élément(s)</span>
            <button className="text-sm text-red-600 underline" onClick={() => confirm(`Supprimer « ${c.name} » ? Les éléments associés seront conservés sans catégorie.`) && s.remove("categories", c.id)}>Supprimer</button>
          </li>))}
      </ul>
    </section>
  );
}
