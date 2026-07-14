'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';

type Vente = {
  id: string;
  libelle: string;
  montant: string;
  mode_paiement: string;
  vendeur_nom: string | null;
  created_at: string;
};

const MODE_LABELS: Record<string, string> = {
  cash: 'Espèces',
  momo: 'MTN MoMo',
  moov: 'Moov Money',
  credit: 'Crédit',
};

export default function HistoriquePage() {
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales?limit=100')
      .then((r) => r.json())
      .then((data) => setVentes(data.ventes || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <header className="bg-ink text-paper px-5 pt-6 pb-5">
        <h1 className="font-bold text-lg">Historique des ventes</h1>
      </header>

      <section className="px-5 mt-4 space-y-2">
        {loading && <p className="text-sm text-ink/50">Chargement...</p>}
        {!loading && ventes.length === 0 && (
          <p className="text-sm text-ink/50 text-center mt-10">Aucune vente enregistrée pour l'instant.</p>
        )}
        {ventes.map((v) => (
          <div key={v.id} className="bg-surface rounded-ticket px-4 py-3 border border-line flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{v.libelle}</p>
              <p className="text-xs text-ink/50">
                {new Date(v.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                {' · '}{MODE_LABELS[v.mode_paiement] || v.mode_paiement}
                {v.vendeur_nom ? ` · ${v.vendeur_nom}` : ''}
              </p>
            </div>
            <p className="font-bold text-gold-dark">{Number(v.montant).toLocaleString('fr-FR')}</p>
          </div>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
