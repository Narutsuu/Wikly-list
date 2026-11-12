"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Task, enqueue, flush, loadCache, queueLength, saveCache } from "@/lib/sync";

type Sync = "synced" | "pending" | "offline";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [sync, setSync] = useState<Sync>("synced");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const ok = await flush();
    if (ok) {
      const { data, error } = await supabase.from("tasks").select("*").order("updated_at", { ascending: false });
      if (!error && data) { setTasks(data as Task[]); saveCache(data as Task[]); }
    }
    setSync(!navigator.onLine ? "offline" : ok && queueLength() === 0 ? "synced" : "pending");
  }, []);

  useEffect(() => {
    if (!session) return;
    setTasks(loadCache()); refresh();
    const ch = supabase.channel("tasks").on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, p => {
      setTasks(prev => {
        const next = p.eventType === "DELETE" ? prev.filter(t => t.id !== (p.old as Task).id)
          : [p.new as Task, ...prev.filter(t => t.id !== (p.new as Task).id)];
        saveCache(next); return next;
      });
    }).subscribe();
    const on = () => refresh(), off = () => setSync("offline");
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { supabase.removeChannel(ch); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [session, refresh]);

  const commit = (next: Task[], op: Parameters<typeof enqueue>[0]) => {
    setTasks(next); saveCache(next); enqueue(op); setSync("pending"); refresh();
  };
  const add = () => {
    const t = title.trim(); if (!t) return;
    const row: Task = { id: crypto.randomUUID(), title: t, done: false, priority: 2, updated_at: new Date().toISOString() };
    setTitle(""); commit([row, ...tasks], { kind: "upsert", row });
  };
  const toggle = (t: Task) => {
    const now = new Date().toISOString();
    const row = { ...t, done: !t.done, completed_at: t.done ? null : now, updated_at: now };
    commit(tasks.map(x => (x.id === t.id ? row : x)), { kind: "upsert", row });
  };
  const remove = (t: Task) => commit(tasks.filter(x => x.id !== t.id), { kind: "delete", id: t.id });

  if (!ready) return null;
  if (!session) return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-5xl font-semibold tracking-tight">DayFlow</h1>
      <p className="text-slate2">Vos tâches et événements, au même endroit sur tous vos appareils.</p>
      <button className="rounded-lg bg-ink px-4 py-3 font-medium text-white"
        onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin } })}>
        Continuer avec Google
      </button>
    </main>
  );

  const label = { synced: "Synchronisé", pending: "Synchronisation en attente", offline: "Hors connexion" }[sync];
  const open = tasks.filter(t => !t.done), done = tasks.filter(t => t.done);
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">DayFlow</h1>
        <div className="flex items-center gap-4 text-sm">
          <span role="status" className="flex items-center gap-2 text-slate2">
            <i className={`h-2 w-2 rounded-full ${sync === "synced" ? "bg-emerald-600" : sync === "pending" ? "bg-amber-500" : "bg-slate2"}`} />{label}
          </span>
          <button className="underline" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
        </div>
      </header>
      <form className="mb-6 flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nouvelle tâche, ex. Terminer mon montage"
          className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-white px-3 py-3" />
        <button className="rounded-lg bg-tide px-4 font-medium text-white">Ajouter</button>
      </form>
      {tasks.length === 0 && <p className="text-slate2">Aucune tâche. Ajoutez la première ci-dessus.</p>}
      <ul className="divide-y divide-ink/10">
        {[...open, ...done].map(t => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <input type="checkbox" checked={t.done} onChange={() => toggle(t)} className="h-5 w-5 accent-[#1E6FD9]" aria-label={`Terminer ${t.title}`} />
            <span className={`flex-1 ${t.done ? "text-slate2 line-through" : ""}`}>{t.title}</span>
            <button className="text-sm text-slate2 underline" onClick={() => remove(t)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
