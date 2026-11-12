# DayFlow (Next.js + Supabase PWA)

## Démarrage
1. `npm install` puis copier `.env.example` en `.env.local` et renseigner l'URL + la clé anon Supabase.
2. Supabase → SQL Editor : exécuter `supabase/schema.sql` (tables, RLS, Realtime, conflits).
3. Supabase → Authentication → Providers → Google : activer, coller Client ID/Secret (Google Cloud Console, écran de consentement + client OAuth « Web »). URI de redirection autorisée : `https://<projet>.supabase.co/auth/v1/callback`. Supabase → URL Configuration : ajouter votre domaine Vercel et `http://localhost:3000`.
4. Ajouter `public/icon-192.png` et `public/icon-512.png` (obligatoires pour l'installation PWA).
5. `npm run dev`, puis déploiement : importer le dépôt dans Vercel, ajouter les 2 variables d'environnement, domaine perso dans Settings → Domains (HTTPS automatique).

## Installation
Windows : Chrome/Edge → icône « Installer » dans la barre d'adresse. Android : Chrome → « Installer l'application ». iOS : Safari → Partager → « Sur l'écran d'accueil » (Web Push seulement une fois installée, iOS 16.4+).

## Reste à faire (non inclus dans cette première version)
- Événements, catégories, récurrences, paramètres : tables et RLS prêtes, interface à écrire en suivant `src/lib/sync.ts`.
- Google Calendar : second consentement OAuth distinct, scope `calendar.events` (ou `calendar.readonly`), jetons gérés côté serveur (route API Next.js), jamais dans le frontend.
- Web Push : clés VAPID + table d'abonnements + envoi côté serveur (le handler `push` existe dans `public/sw.js`).
