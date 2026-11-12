"use client";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Store } from "@/lib/store";
const Row = ({ l, children }: { l: string; children: React.ReactNode }) => <label className="flex items-center justify-between gap-4 py-3"><span>{l}</span><span className="w-48">{children}</span></label>;
export default function Settings({ s, session }: { s: Store; session: Session }) {
  const st = s.settings, m = session.user.user_metadata || {}, [msg, setMsg] = useState("");
  const notif = async (on: boolean) => {
    if (on && typeof Notification !== "undefined" && (await Notification.requestPermission()) !== "granted") return setMsg("Notifications refusées : autorisez-les dans les réglages du navigateur ou de l'appareil.");
    if (on && typeof Notification === "undefined") return setMsg("Ce navigateur ne gère pas les notifications. Sur iPhone, installez d'abord DayFlow sur l'écran d'accueil.");
    setMsg(""); s.saveSettings({ notif: on });
  };
  return (
    <section className="max-w-xl divide-y divide-line">
      <div className="flex items-center gap-4 pb-4">
        {m.avatar_url && <img src={m.avatar_url} alt="" className="h-14 w-14 rounded-full" referrerPolicy="no-referrer" />}
        <div><div className="font-semibold">{st.displayName || m.full_name || "Mon profil"}</div><div className="text-sm text-slate2">{session.user.email}</div></div>
      </div>
      <Row l="Nom affiché"><input className="inp" defaultValue={st.displayName} placeholder={m.full_name} onBlur={e => e.target.value !== st.displayName && s.saveSettings({ displayName: e.target.value.trim() })} /></Row>
      <Row l="Thème"><select className="inp" value={st.theme} onChange={e => s.saveSettings({ theme: e.target.value as any })}><option value="system">Automatique</option><option value="light">Clair</option><option value="dark">Sombre</option></select></Row>
      <Row l="Format horaire"><select className="inp" value={st.hour12 ? "12" : "24"} onChange={e => s.saveSettings({ hour12: e.target.value === "12" })}><option value="24">24 heures</option><option value="12">12 heures</option></select></Row>
      <Row l="Premier jour de la semaine"><select className="inp" value={st.weekStart} onChange={e => s.saveSettings({ weekStart: +e.target.value as any })}><option value={1}>Lundi</option><option value={0}>Dimanche</option><option value={6}>Samedi</option></select></Row>
      <Row l="Vue du calendrier par défaut"><select className="inp" value={st.view} onChange={e => s.saveSettings({ view: e.target.value as any })}><option value="day">Jour</option><option value="week">Semaine</option><option value="month">Mois</option></select></Row>
      <Row l="Durée d'un nouvel événement"><select className="inp" value={st.duration} onChange={e => s.saveSettings({ duration: +e.target.value })}>{[15, 30, 60, 90, 120].map(n => <option key={n} value={n}>{n} min</option>)}</select></Row>
      <Row l="Afficher les tâches dans le calendrier"><input type="checkbox" checked={st.showTasks} onChange={e => s.saveSettings({ showTasks: e.target.checked })} /></Row>
      <Row l="Rappels de notification"><input type="checkbox" checked={st.notif} onChange={e => notif(e.target.checked)} /></Row>
      {st.notif && <Row l="Prévenir avant"><select className="inp" value={st.notifMin} onChange={e => s.saveSettings({ notifMin: +e.target.value })}>{[0, 5, 10, 30, 60].map(n => <option key={n} value={n}>{n ? `${n} min` : "À l'heure"}</option>)}</select></Row>}
      {msg && <p className="py-3 text-sm text-red-600">{msg}</p>}
      <p className="py-3 text-xs text-slate2">Les rappels s'affichent quand DayFlow est ouvert ou en arrière-plan. Ces réglages sont enregistrés dans votre compte et suivent tous vos appareils.</p>
      <div className="pt-4"><button className="btn2" onClick={() => supabase.auth.signOut()}>Se déconnecter</button></div>
    </section>
  );
}
