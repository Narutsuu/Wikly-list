"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Task, enqueue, flush, loadCache, queueLength, saveCache } from "./sync";
import type { Cat, Ev } from "./cal";
export type Sync = "synced" | "pending" | "offline";
export type Settings = { displayName: string; theme: "system" | "light" | "dark"; hour12: boolean; weekStart: 0 | 1 | 6; view: "day" | "week" | "month"; duration: number; showTasks: boolean; notif: boolean; notifMin: number };
export const DEFAULTS: Settings = { displayName: "", theme: "dark", hour12: false, weekStart: 1, view: "month", duration: 60, showTasks: true, notif: false, notifMin: 10 };
const T = ["tasks", "events", "categories", "task_done"] as const; type TN = (typeof T)[number];
type D = { tasks: Task[]; events: Ev[]; categories: Cat[]; task_done: { id: string; task_id: string; day: string; updated_at: string }[] };

export function useStore(session: Session | null) {
  const uid = session?.user.id;
  const [d, setD] = useState<D>({ tasks: [], events: [], categories: [], task_done: [] });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [sync, setSync] = useState<Sync>("synced");
  const put = useCallback((t: TN, fn: (r: any[]) => any[]) => setD(p => { const n = fn(p[t]); saveCache(n, t); return { ...p, [t]: n }; }), []);
  const applySettings = (data: Partial<Settings>) => { const n = { ...DEFAULTS, ...data }; setSettings(n); localStorage.setItem("df:settings", JSON.stringify(n)); };

  const refresh = useCallback(async () => {
    const ok = await flush();
    if (ok) {
      for (const t of T) { const { data, error } = await supabase.from(t).select("*"); if (!error && data && queueLength() === 0) put(t, () => data); } // jamais d'écrasement pendant qu'une modification est en attente
      const { data: s } = await supabase.from("settings").select("data").maybeSingle();
      if (s?.data) applySettings(s.data);
    }
    setLoading(false);
    setSync(!navigator.onLine ? "offline" : ok && queueLength() === 0 ? "synced" : "pending");
  }, [put]);

  useEffect(() => {
    if (!uid) return;
    for (const t of T) put(t, () => loadCache(t));
    try { applySettings(JSON.parse(localStorage.getItem("df:settings") || "{}")); } catch {}
    refresh();
    const ch: any = supabase.channel("df");
    for (const t of [...T, "settings"]) ch.on("postgres_changes", { event: "*", schema: "public", table: t }, (p: any) => {
      if (t === "settings") { if (p.new?.data) applySettings(p.new.data); return; }
      put(t as TN, rows => {
        if (p.eventType === "DELETE") return rows.filter(x => x.id !== p.old.id);
        const cur = rows.find(x => x.id === p.new.id);
        if (cur && cur.updated_at > p.new.updated_at) return rows; // la version locale est plus récente
        return [p.new, ...rows.filter(x => x.id !== p.new.id)];
      });
    });
    ch.subscribe();
    const on = () => refresh(), off = () => setSync("offline"), vis = () => document.visibilityState === "visible" && refresh();
    window.addEventListener("online", on); window.addEventListener("offline", off); document.addEventListener("visibilitychange", vis);
    return () => { supabase.removeChannel(ch); window.removeEventListener("online", on); window.removeEventListener("offline", off); document.removeEventListener("visibilitychange", vis); };
  }, [uid, refresh, put]);

  const upsert = (t: TN, row: Record<string, any>) => {
    const r: Record<string, any> = { ...row, updated_at: new Date().toISOString() };
    put(t, rows => [r, ...rows.filter(x => x.id !== r.id)]); enqueue({ kind: "upsert", table: t, row: r }); setSync("pending"); refresh();
  };
  const remove = (t: TN, id: string) => {
    put(t, rows => rows.filter(x => x.id !== id && x.series_id !== id)); enqueue({ kind: "delete", table: t, id }); setSync("pending"); refresh();
  };
  const saveSettings = (patch: Partial<Settings>) => {
    const n = { ...settings, ...patch }; applySettings(n);
    enqueue({ kind: "upsert", table: "settings", row: { user_id: uid, data: n, updated_at: new Date().toISOString() } }); setSync("pending"); refresh();
  };
  return { loading, doneIds: new Set(d.task_done.map(x => x.id)), tasks: d.tasks, events: d.events, cats: d.categories, settings, sync, upsert, remove, saveSettings };
}
export type Store = ReturnType<typeof useStore>;
