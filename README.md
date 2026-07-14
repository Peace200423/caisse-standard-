# Caisse Standard

Caisse générique pour boutiques, restaurants, salons et commerces au Bénin.
Vente rapide sans catalogue obligatoire, ardoise clients, suivi Espèces / MTN MoMo / Moov Money, mode hors-ligne.

## 1. Créer la base de données (Neon)

1. Va sur https://console.neon.tech et crée un compte / un projet.
2. Copie la **connection string** (elle ressemble à `postgres://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`).
3. En local, applique le schéma :

```bash
npm install
DATABASE_URL="ta-connection-string" npm run db:migrate
```

Ça crée toutes les tables (`tenants`, `users`, `articles`, `ventes`, `clients_credit`, `mouvements_caisse`).

## 2. Déployer sur Vercel

1. Pousse ce dossier sur un repo GitHub.
2. Sur https://vercel.com, "Add New Project" → importe le repo.
3. Dans les **Environment Variables**, ajoute :
   - `DATABASE_URL` — la même connection string Neon
   - `JWT_SECRET` — une longue chaîne aléatoire (ex: génère avec `openssl rand -hex 32`)
   - `ADMIN_SECRET` — le mot de passe de ton panneau admin (`/admin`)
4. Déploie.

## 3. Utilisation

- `/` — inscription d'un nouveau commerce (30 jours d'essai auto) ou connexion (code + PIN)
- `/dashboard` — écran de vente rapide + résumé du jour
- `/dashboard/ventes` — historique
- `/dashboard/credits` — gestion de l'ardoise
- `/admin` — TON panneau (protégé par `ADMIN_SECRET`) pour activer/suspendre les abonnements après réception d'un paiement Mobile Money manuel

## 4. Cycle d'abonnement (phase manuelle)

1. Le client s'inscrit → statut `essai`, 30 jours gratuits.
2. Avant l'échéance, tu lui envoies un lien de paiement FedaPay ou Kkiapay par WhatsApp.
3. Une fois le paiement reçu sur ton compte, va sur `/admin`, trouve le commerce, clique "Activer 1 mois".
4. Le statut passe à `actif` et `abonnement_fin` avance d'un mois. S'il ne paie pas, tu cliques "Suspendre" — le commerce ne peut plus se connecter tant qu'il n'est pas réactivé.

Quand tu auras plus de clients, on pourra automatiser cette étape avec l'API Kkiapay (1,9% par transaction, moins cher que FedaPay à 2,9%) pour générer les liens et activer automatiquement à la confirmation du paiement.

## 5. Mode hors-ligne

Chaque vente créée sans connexion est gardée dans le navigateur (localStorage) avec un identifiant unique. Dès que la connexion revient (ou toutes les 20 secondes en tâche de fond), l'appli renvoie les ventes en attente au serveur. Le serveur ignore les doublons grâce à cet identifiant — aucun risque de compter une vente deux fois.

## 6. Prochaines étapes suggérées

- Rapport hebdo automatique par WhatsApp (nécessite l'API WhatsApp Business ou un envoi via un numéro dédié)
- Alerte stock bas pour les articles catalogués
- Export CSV/Excel de l'historique des ventes
- Icônes PWA réelles (actuellement `public/manifest.json` a une liste d'icônes vide) pour permettre "Ajouter à l'écran d'accueil" avec un vrai logo
