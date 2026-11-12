# DayFlow (Next.js + Supabase PWA)

## Démarrage
1. `npm install` puis copier `.env.example` en `.env.local` et renseigner l'URL + la clé anon Supabase.
2. Supabase → SQL Editor : exécuter `supabase/schema.sql` si ce n'est pas déjà fait, puis `supabase/migrations/002_calendar.sql` (ajoute catégorie, couleur, journée entière, exceptions de série à `events` ; rien n'est recréé).
3. Supabase → Authentication → Providers → Google : activer, coller Client ID/Secret (Google Cloud Console, écran de consentement + client OAuth « Web »). URI de redirection autorisée : `https://<projet>.supabase.co/auth/v1/callback`. Supabase → URL Configuration : ajouter votre domaine Vercel et `http://localhost:3000`.
4. Ajouter `public/icon-192.png` et `public/icon-512.png` (obligatoires pour l'installation PWA).
5. `npm run dev`, puis déploiement : importer le dépôt dans Vercel, ajouter les 2 variables d'environnement, domaine perso dans Settings → Domains (HTTPS automatique).

## Installation
Windows : Chrome/Edge → icône « Installer » dans la barre d'adresse. Android : Chrome → « Installer l'application ». iOS : Safari → Partager → « Sur l'écran d'accueil » (Web Push seulement une fois installée, iOS 16.4+).

## Calendrier
100 % interne : événements, tâches, catégories, récurrences et paramètres sont stockés dans Supabase (RLS par utilisateur). Google ne sert qu'à la connexion (Supabase Auth). Aucune API ni aucun scope Google Calendar n'est utilisé. Le glisser-déposer fonctionne à la souris ; au doigt, modifiez la date dans le formulaire.

## Reste à faire
- Web Push serveur (notifications application fermée) : clés VAPID + table d'abonnements + envoi côté serveur. Les rappels actuels s'affichent tant que l'appli est ouverte ou en arrière-plan.
