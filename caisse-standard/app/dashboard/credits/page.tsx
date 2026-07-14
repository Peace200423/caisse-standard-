'use client';

import { useEffect, useState, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';

type ClientCredit = { id: string; nom: string; telephone: string | null; solde_du: string };

export default function CreditsPage() {
  const [clients, setClients] = useState<ClientCredit[]>([]);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [remboursements, setRemboursements] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/credits');
    const data = await res.json();
    setClients(data.clients || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    await fetch('/api/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, telephone }),
    });
    setNom('');
    setTelephone('');
    setShowAdd(false);
    load();
  }

  async function rembourser(clientId: string) {
    const montant = Number(remboursements[clientId]);
    if (!montant || montant <= 0) return;
    await fetch('/api/credits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, montant }),
    });
    setRemboursements((prev) => ({ ...prev, [clientId]: '' }));
    load();
  }

  const totalDu = clients.reduce((acc, c) => acc + Number(c.solde_du), 0);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <header className="bg-ink text-paper px-5 pt-6 pb-5">
        <h1 className="font-bold text-lg mb-1">Ardoise clients</h1>
        <p className="text-sm text-paper/60">Total dû : <span className="text-credit font-bold">{totalDu.toLocaleString('fr-FR')} F</span></p>
      </header>

      <section className="px-5 mt-4">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full border border-dashed border-line rounded-ticket py-3 text-sm text-ink/60 mb-4"
          >
            + Ajouter un client
          </button>
        ) : (
          <form onSubmit={addClient} className="bg-surface rounded-ticket p-4 border border-line mb-4 space-y-3">
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom du client"
              className="w-full border border-line rounded-ticket px-3 py-2 bg-paper"
              required
            />
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Téléphone (optionnel)"
              className="w-full border border-line rounded-ticket px-3 py-2 bg-paper"
            />
            <div className="flex gap-2">
              <button className="flex-1 bg-gold text-ink font-semibold py-2 rounded-ticket">Ajouter</button>
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-line rounded-ticket py-2">Annuler</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {clients.length === 0 && (
            <p className="text-sm text-ink/50 text-center mt-6">Aucun client à crédit enregistré.</p>
          )}
          {clients.map((c) => (
            <div key={c.id} className="bg-surface rounded-ticket p-4 border border-line">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm">{c.nom}</p>
                  {c.telephone && <p className="text-xs text-ink/50">{c.telephone}</p>}
                </div>
                <p className="font-bold text-credit">{Number(c.solde_du).toLocaleString('fr-FR')} F</p>
              </div>
              {Number(c.solde_du) > 0 && (
                <div className="flex gap-2">
                  <input
                    value={remboursements[c.id] || ''}
                    onChange={(e) => setRemboursements((prev) => ({ ...prev, [c.id]: e.target.value }))}
                    type="number"
                    inputMode="numeric"
                    placeholder="Montant remboursé"
                    className="flex-1 border border-line rounded-ticket px-3 py-2 text-sm bg-paper"
                  />
                  <button
                    onClick={() => rembourser(c.id)}
                    className="bg-cash/10 text-cash font-medium px-4 rounded-ticket text-sm"
                  >
                    Encaisser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
