"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { fmtT, instances } from "@/lib/cal";
import Logo from "@/components/Logo";
import Calendar from "@/components/Calendar";
import Tasks from "@/components/Tasks";
import Categories from "@/components/Categories";
import Settings from "@/components/Settings";
import Editor, { Ed } from "@/components/Editor";

const TABS = [["cal", "Calendrier"], ["tasks", "Tâches"], ["cats", "Catégories"], ["set", "Paramètres"]] as const;
export default function Home() {
  const [session, setSession] = useState<Session | null>(null), [ready, setReady] = useState(false);
  const s = useStore(session), [tab, setTab] = useState<(typeof TABS)[number][0]>("cal");
  const [filter, setFilter] = useState<string | null>(null), [ed, setEd] = useState<Ed | null>(null), [toast, setToast] = useState(""), seen = useRef(new Set<string>()), tm = useRef<any>(null);
  const st = s.settings;
  const notify = useCallback((m: string) => { setToast(m); clearTimeout(tm.current); tm.current = setTimeout(() => setToast(""), 2200); }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, x) => setSession(x));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { // thème sombre (par défaut) ou clair
    const mq = matchMedia("(prefers-color-scheme: dark)"), apply = () => document.documentElement.classList.toggle("dark", st.theme === "dark" || (st.theme === "system" && mq.matches));
    apply(); mq.addEventListener("change", apply); return () => mq.removeEventListener("change", apply);
  }, [st.theme]);
  useEffect(() => { // rappels
    if (!session || !st.notif || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const tick = () => {
      const now = new Date(), end = new Date(+now + st.notifMin * 60000);
      instances(s.events, s.tasks, s.cats, now, end, true, s.doneIds).forEach(i => {
        if (i.allDay || i.done || seen.current.has(i.key)) return; seen.current.add(i.key);
        navigator.serviceWorker?.ready.then(r => r.showNotification(i.title, { body: fmtT(i.start, st.hour12), icon: "/icon-192.png" }));
      });
    };
    tick(); const id = setInterval(tick, 30000); return () => clearInterval(id);
  }, [session, st.notif, st.notifMin, st.hour12, s.events, s.tasks, s.cats, s.doneIds]);

  if (!ready) return null;
  if (!session) return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <Logo size={64} text={false} />
      <h1 className="text-5xl font-semibold tracking-tight">DayFlow</h1>
      <p className="text-slate2">Votre agenda et vos tâches, synchronisés sur tous vos appareils. Première visite ? Votre compte est créé automatiquement à la connexion.</p>
      <button className="btn py-3" onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin } })}>Continuer avec Google</button>
    </main>
  );
  const label = ({ synced: "Synchronisé", pending: "Synchronisation en cours", offline: "Hors connexion" } as Record<string, string>)[s.sync];
  const at9 = new Date(new Date().setHours(9, 0, 0, 0));
  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Logo />
          <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-card py-2 md:static md:z-auto md:justify-start md:gap-2 md:border-0 md:bg-transparent md:py-0" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
            {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} aria-current={tab === k} className={`min-h-10 rounded-lg px-3 text-sm transition ${tab === k ? "bg-tide text-white" : "hover:bg-tide/10"}`}>{l}</button>)}
          </nav>
          <span role="status" className="flex items-center gap-2 text-sm text-slate2">
            <i className={`h-2 w-2 rounded-full ${s.sync === "synced" ? "bg-emerald-500" : s.sync === "pending" ? "animate-pulse bg-amber-400" : "bg-slate2"}`} />{label}
          </span>
        </header>
        {(tab === "cal" || tab === "tasks") && s.cats.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
            <button className={`chip ${!filter ? "bg-tide text-white" : ""}`} onClick={() => setFilter(null)}>Toutes</button>
            {s.cats.map(c => <button key={c.id} onClick={() => setFilter(filter === c.id ? null : c.id)} className={`chip flex items-center gap-1.5 ${filter === c.id ? "bg-tide text-white" : ""}`}><i className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}</button>)}
          </div>)}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {s.loading && !s.tasks.length && !s.events.length ? <p className="animate-pulse py-10 text-center text-slate2">Chargement de vos données…</p> : <>
            {tab === "cal" && <Calendar s={s} filter={filter} open={(inst, date) => setEd({ inst, date })} />}
            {tab === "tasks" && <Tasks s={s} filter={filter} open={(inst, date) => setEd({ inst, date })} notify={notify} />}
            {tab === "cats" && <Categories s={s} />}
            {tab === "set" && <Settings s={s} session={session} />}
          </>}
        </motion.div>
        {(tab === "cal" || tab === "tasks") && <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.92 }} onClick={() => setEd({ inst: null, date: at9, kind: tab === "tasks" ? "task" : "event" })}
          aria-label={tab === "tasks" ? "Ajouter une tâche" : "Nouvel événement"} className="btn fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full !p-0 text-3xl shadow-lg md:bottom-6 md:right-6">+</motion.button>}
        <AnimatePresence>{ed && <Editor key="editor" s={s} ed={ed} onClose={() => setEd(null)} notify={notify} />}</AnimatePresence>
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center md:bottom-6"><AnimatePresence>{toast && <motion.div role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-full bg-tide px-4 py-2 text-sm text-white shadow-lg">{toast}</motion.div>}</AnimatePresence></div>
      </div>
    </MotionConfig>
  );
}
