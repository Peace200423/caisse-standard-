# Carnet Suivi & Évaluation — KRÉA.AI

Application multi-associations : cadre logique (Impact/Effet/Extrant/Activité), indicateurs liés
aux ODD, preuves jointes, mode bailleur (lien public en lecture seule), collecte terrain hors-ligne
avec validation hiérarchique, membres à rôles (administrateur / superviseur / agent terrain),
notifications email et export Excel/PDF brandés.

## 1. Prérequis
- Un compte Vercel (déploiement + stockage de fichiers via Vercel Blob)
- Un compte Neon (base de données Postgres — gratuit)
- Un compte Resend (gratuit, pour les emails) — optionnel au démarrage
- Node.js 18+ en local si tu veux tester avant de déployer

## 2. Base de données — Neon
1. Crée un projet sur https://neon.tech
2. Dans l'onglet **Connection Details**, récupère deux chaînes de connexion :
   - la connexion **pooled** (avec `-pooler` dans l'hôte) → variable `DATABASE_URL`
   - la connexion **directe** (sans `-pooler`) → variable `DIRECT_URL`
3. Renseigne ces deux valeurs dans `.env` (local) et dans les variables d'environnement Vercel.

## 3. Installer et pousser le schéma de base de données
```bash
npm install
npx prisma db push
```
Cela crée les tables (`Organization`, `Member`, `Objectif`, `Indicateur`, `ValeurRelevee`).

## 4. Vercel Blob — preuves jointes (photos/documents)
1. Dans ton projet Vercel → **Storage** → **Create** → **Blob**.
2. Le token `BLOB_READ_WRITE_TOKEN` est ajouté automatiquement à ton projet.

## 5. Resend — notifications & récupération de code (optionnel)
1. Crée un compte sur resend.com.
2. Récupère ta clé API → `RESEND_API_KEY`.
3. Sans cette clé, l'application fonctionne normalement : les emails sont simplement désactivés
   (le lien de réinitialisation de code s'affiche alors dans les logs serveur).

## 6. Déploiement sur Vercel
1. Pousse ce projet sur un repo GitHub.
2. Vercel → **Add New Project** → importe le repo.
3. Ajoute toutes les variables du fichier `.env.example`.
4. Déploie. `prisma generate` s'exécute automatiquement avant le build (`postinstall`).
5. Exécute `npx prisma db push` une fois avec les vraies variables de production si ce n'est pas
   déjà fait (étape 3).

## 7. Rôles et accès
- **Administrateur** : accès complet, gère les membres, active le mode bailleur, valide les données.
- **Superviseur** : modifie la structure (objectifs/indicateurs) et valide les données soumises par
  les agents terrain, mais ne gère pas les membres.
- **Agent terrain** : accès à `/terrain` uniquement, saisit des relevés qui passent en statut
  "en attente" jusqu'à validation par un administrateur ou superviseur.

Chaque membre a son propre email + code d'accès personnel (plus de code partagé unique).
La récupération de code oublié se fait par email via `/forgot`.

## 8. Ce qui est déjà fonctionnel
- Création d'association + invitation de membres avec rôles distincts
- Cadre logique complet (Impact → Effet → Extrant → Activité) avec rattachement hiérarchique
- Indicateurs liés aux ODD (badges visuels)
- Graphiques d'évolution, jauges de progression
- Preuves jointes (photo/PDF) via Vercel Blob, sur chaque relevé
- File de validation : un agent soumet, un administrateur/superviseur valide ou rejette
- Collecte terrain hors-ligne (`/terrain`) : file d'attente locale, synchronisation automatique
  au retour du réseau
- Mode bailleur : lien public en lecture seule, données validées uniquement
- Export Excel et PDF brandés KRÉA.AI
- Partage WhatsApp de l'avancement
- Notifications email automatiques (Resend) aux administrateurs/superviseurs
- Tests unitaires (Vitest) + CI GitHub Actions (typecheck, tests, build)

## 9. Limites connues à améliorer avant un vrai lancement public
- Pas de suppression/modification de rôle après création d'un membre (il faut le retirer et le
  recréer).
- Le lien "mode bailleur" est un secret par obscurité (token long et aléatoire) : pas de mot de
  passe additionnel sur cette page publique.
- La file d'attente hors-ligne de `/terrain` est stockée dans le `localStorage` du navigateur :
  si l'agent change d'appareil avant synchronisation, les données en attente restent sur l'ancien
  appareil.
- Pas de page de gestion fine des ODD par objectif (seulement par indicateur).

## 10. Pour aller plus loin
- Ajouter un vrai Service Worker pour un cache d'application complet (PWA installable) sur `/terrain`.
- Ajouter une page d'audit/historique des validations/rejets par indicateur.
- Ajouter la possibilité de changer le rôle d'un membre sans le supprimer.
