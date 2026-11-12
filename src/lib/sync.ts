import { supabase } from "./supabase";
export type Task = { id: string; title: string; done: boolean; priority: number; updated_at: string; completed_at?: string | null; category_id?: string | null; due_at?: string | null; recurrence?: string | null };
export type Row = Record<string, any>;
// Sans "table", une opération concerne "tasks" (compatible avec les anciennes files hors connexion)
type Op = { kind: "upsert"; row: Row; table?: string } | { kind: "delete"; id: string; table?: string; pk?: string };
const QK = "df:queue";
const ck = (t = "tasks") => (t === "tasks" ? "df:tasks" : "df:cache:" + t);
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
export const loadCache = (t = "tasks"): any[] => read<any[]>(ck(t), []);
export const saveCache = (rows: Row[], t = "tasks") => localStorage.setItem(ck(t), JSON.stringify(rows));
export const queueLength = () => read<Op[]>(QK, []).length;
// 1) la modification est d'abord sauvegardée localement, 2) puis envoyée quand le réseau le permet
export function enqueue(op: Op) { localStorage.setItem(QK, JSON.stringify([...read<Op[]>(QK, []), op])); }
let running: Promise<boolean> | null = null;
export function flush(): Promise<boolean> { // rejoue tant que la file n'est pas vide (opérations ajoutées pendant l'envoi)
  return (running ??= (async () => { let ok = true; do { ok = await run(); } while (ok && queueLength() > 0); return ok; })().finally(() => { running = null; }));
}
async function run(): Promise<boolean> {
  let q = read<Op[]>(QK, []);
  while (q.length) {
    const op = q[0], table = op.table || "tasks";
    const send = (row?: Row) => op.kind === "upsert"
      ? supabase.from(table).upsert(row ?? op.row)
      : supabase.from(table).delete().eq(op.pk || "id", op.id);
    let { error } = await send();
    // catégorie supprimée ailleurs : on réessaie sans elle ; doublon d'occurrence : on abandonne cette opération
    if (error?.code === "23503" && op.kind === "upsert" && op.row.category_id) ({ error } = await send({ ...op.row, category_id: null }));
    if (error && error.code !== "23505" && error.code !== "23503") return false; // erreur réseau : la file est conservée
    q = q.slice(1); localStorage.setItem(QK, JSON.stringify(q));
  }
  return true;
}
