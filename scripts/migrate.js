// Applique les fichiers .sql du dossier migrations/, dans l'ordre alphabétique.
// Usage: DATABASE_URL="postgres://..." npm run db:migrate
const fs = require('fs');
const path = require('path');
const { Client } = require('@neondatabase/serverless');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL manquant. Récupère-le depuis ton dashboard Neon (console.neon.tech).');
    process.exit(1);
  }

  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  const client = new Client(url);
  await client.connect();

  for (const file of files) {
    console.log(`-> Application de ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    await client.query(sql);
  }

  console.log('Migrations terminées.');
  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
