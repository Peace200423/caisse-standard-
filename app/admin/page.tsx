'use client';

import { useState } from 'react';

type Tenant = {
  id: string;
  code: string;
  nom: string;
  telephone: string | null;
  statut: string;
  essai_fin: string | null;
  abonnement_fin: string | null;
  created_at: string;
};

const STATUT_COLORS: Record<string, string> = {
  actif: 'bg-cash/15 text-cash',
  essai: 'bg-gold/15 text-gold-dark',
  suspendu: 'bg-credit/15 text-credit',
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [connected, setConnected] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState('');

  async function loadTenants(key: string) {
    setError('');
    const res = await fetch('/api/admin/tenants', { headers: { 'x-admin-key': key } });
    if (!res.ok) {
      setError('Clé admin incorrecte.');
      setConnected(false);
      return;
    }
    const data = await res.json();
    setTenants(data.tenants || []);
    setConnected(true);
  }

  async function updateStatut(tenantId: string, statut: string, moisPayes = 1) {
    await fetch('/api/admin/tenants', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ tenantId, statut, moisPayes }),
    });
    loadTenants(adminKey);
  }

  if (!connected) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="max-w-sm w-full">
          <h1 className="text-xl font-bold mb-4">Accès admin</h1>
          {error && <p className="text-sm text-credit mb-3">{error}</p>}
          <input
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            type="password"
            placeholder="Clé admin"
            className="w-full border border-line rounded-ticket px-4 py-3 bg-surface mb-3"
          />
          <button
            onClick={() => loadTenants(adminKey)}
            className="w-full bg-ink text-paper font-semibold py-3 rounded-ticket"
          >
            Entrer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper p-5">
      <h1 className="text-xl font-bold mb-4">Commerces ({tenants.length})</h1>
      <div className="space-y-3">
        {tenants.map((t) => (
          <div key={t.id} className="bg-surface border border-line rounded-ticket p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold">{t.nom}</p>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUT_COLORS[t.statut] || ''}`}>
                {t.statut}
              </span>
            </div>
            <p className="text-xs text-ink/50 mb-3">
              Code {t.code} · {t.telephone || 'sans téléphone'} · inscrit le {new Date(t.created_at).toLocaleDateString('fr-FR')}
            </p>
            {t.abonnement_fin && (
              <p className="text-xs text-ink/50 mb-3">Abonnement jusqu'au {new Date(t.abonnement_fin).toLocaleDateString('fr-FR')}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => updateStatut(t.id, 'actif', 1)}
                className="flex-1 bg-cash/10 text-cash text-sm font-medium py-2 rounded-ticket"
              >
                Activer 1 mois
              </button>
              <button
                onClick={() => updateStatut(t.id, 'suspendu')}
                className="flex-1 bg-credit/10 text-credit text-sm font-medium py-2 rounded-ticket"
              >
                Suspendre
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
