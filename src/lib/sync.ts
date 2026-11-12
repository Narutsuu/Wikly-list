import { supabase } from "./supabase";
export type Task = { id: string; title: string; done: boolean; priority: number; updated_at: string; completed_at?: string | null };
type Op = { kind: "upsert"; row: Task } | { kind: "delete"; id: string };
const QK = "df:queue", CK = "df:tasks";
const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
export const loadCache = () => read<Task[]>(CK, []);
export const saveCache = (t: Task[]) => localStorage.setItem(CK, JSON.stringify(t));
export const queueLength = () => read<Op[]>(QK, []).length;
// 1) la modification est d'abord sauvegardée localement, 2) puis envoyée quand le réseau le permet
export function enqueue(op: Op) { localStorage.setItem(QK, JSON.stringify([...read<Op[]>(QK, []), op])); }
export async function flush(): Promise<boolean> {
  let q = read<Op[]>(QK, []);
  while (q.length) {
    const op = q[0];
    const { error } = op.kind === "upsert"
      ? await supabase.from("tasks").upsert(op.row)
      : await supabase.from("tasks").delete().eq("id", op.id);
    if (error) return false;               // on garde la file, nouvel essai au retour du réseau
    q = q.slice(1); localStorage.setItem(QK, JSON.stringify(q));
  }
  return true;
}
