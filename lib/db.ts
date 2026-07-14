import { neon } from '@neondatabase/serverless';

// Une seule connexion HTTP serverless, réutilisée par toutes les routes API.
// DATABASE_URL doit être défini dans les variables d'environnement Vercel.
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL non défini — les appels DB échoueront.');
}

export const sql = neon(process.env.DATABASE_URL || '');
