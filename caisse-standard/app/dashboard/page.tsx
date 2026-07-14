'use client';

import { useEffect, useState, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import { enqueueSale, flushQueue, getPendingCount } from '@/lib/offlineQueue';

type Article = { id: string; nom: string; prix: number };
type ClientCredit = { id: string; nom: string; solde_du: number };
type Summary = {
  totalVentesJour: number;
  caisseEspecesEstimee: number;
  creditTotalDu: number;
};

const MODES = [
  { value: 'cash', label: 'Espèces' },
  { value: 'momo', label: 'MTN MoMo' },
  { value: 'moov', label: 'Moov Money' },
  { value: 'credit', label: 'Crédit (ardoise)' },
];

export default function DashboardPage() {
  const [libelle, setLibelle] = useState('');
  const [montant, setMontant] = useState('');
  const [modePaiement, setModePaiement] = useState('cash');
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<ClientCredit[]>([]);
  const [clientCreditId, setClientCreditId] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/summary');
      if (res.ok) setSummary(await res.json());
    } catch {}
  }, []);

  const loadArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch {}
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch('/api/credits');
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch {}
  }, []);

  const sync = useCallback(async () => {
    const result = await flushQueue();
    setPending(getPendingCount());
    if (result.sent > 0) loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadSummary();
    loadArticles();
    loadClients();
    setPending(getPendingCount());
    setOnline(navigator.onLine);

    const onOnline = () => { setOnline(true); sync(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const interval = setInterval(sync, 20000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, [loadSummary, loadArticles, loadClients, sync]);

  function pickArticle(article: Article) {
    setLibelle(article.nom);
    setMontant(String(article.prix));
  }

  async function submitSale(e: React.FormEvent) {
    e.preventDefault();
    if (!libelle.trim() || !montant || Number(montant) <= 0) return;
    if (modePaiement === 'credit' && !clientCreditId) {
      setFeedback('Choisis un client pour une vente à crédit.');
      return;
    }

    setSending(true);
    setFeedback('');

    const saleData = {
      libelle: libelle.trim(),
      montant: Number(montant),
      quantite: 1,
      modePaiement,
      clientCreditId: modePaiement === 'credit' ? clientCreditId : null,
    };

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...saleData, clientUuid: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error('offline');
      setFeedback('Vente enregistrée.');
      loadSummary();
    } catch {
      enqueueSale(saleData);
      setPending(getPendingCount());
      setFeedback('Pas de connexion — vente gardée en attente, elle partira automatiquement.');
    } finally {
      setSending(false);
      setLibelle('');
      setMontant('');
      setModePaiement('cash');
      setClientCreditId('');
      setTimeout(() => setFeedback(''), 4000);
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <header className="bg-ink text-paper px-5 pt-6 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-bold text-lg">Vente rapide</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${online ? 'bg-cash/20 text-cash' : 'bg-credit/20 text-credit'}`}>
            {online ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        {summary && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold">{summary.totalVentesJour.toLocaleString('fr-FR')}</p>
              <p className="text-[11px] text-paper/60">Ventes aujourd'hui</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gold">{summary.caisseEspecesEstimee.toLocaleString('fr-FR')}</p>
              <p className="text-[11px] text-paper/60">Espèces en caisse</p>
            </div>
            <div>
              <p className="text-xl font-bold text-credit">{summary.creditTotalDu.toLocaleString('fr-FR')}</p>
              <p className="text-[11px] text-paper/60">Ardoise totale</p>
            </div>
          </div>
        )}
      </header>

      {pending > 0 && (
        <div className="bg-gold/15 text-gold-dark text-sm px-5 py-2 flex items-center justify-between">
          <span>{pending} vente(s) en attente de synchro</span>
          <button onClick={sync} className="underline font-medium">Réessayer</button>
        </div>
      )}

      <section className="px-5 mt-5">
        <form onSubmit={submitSale} className="bg-surface rounded-ticket p-5 shadow-sm border border-line ticket-edge">
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink/70 mb-1">Qu'est-ce qui est vendu ?</label>
            <input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="ex: Riz + sauce, Coupe cheveux, 2 pagnes..."
              className="w-full border border-line rounded-ticket px-4 py-3 text-base bg-paper"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-ink/70 mb-1">Montant (FCFA)</label>
            <input
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              type="number"
              inputMode="numeric"
              placeholder="0"
              className="w-full border border-line rounded-ticket px-4 py-3 text-2xl font-bold bg-paper"
              required
              min={1}
            />
          </div>

          {articles.length > 0 && (
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {articles.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => pickArticle(a)}
                  className="shrink-0 border border-line rounded-ticket px-3 py-2 text-xs bg-paper whitespace-nowrap"
                >
                  {a.nom} · {a.prix.toLocaleString('fr-FR')}
                </button>
              ))}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-ink/70 mb-2">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setModePaiement(m.value)}
                  className={`py-2 rounded-ticket text-sm font-medium border ${
                    modePaiement === m.value ? 'bg-ink text-paper border-ink' : 'border-line text-ink/70'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {modePaiement === 'credit' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink/70 mb-1">Client</label>
              <select
                value={clientCreditId}
                onChange={(e) => setClientCreditId(e.target.value)}
                className="w-full border border-line rounded-ticket px-4 py-3 bg-paper"
                required
              >
                <option value="">Sélectionner...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          )}

          {feedback && <p className="text-sm text-ink/70 mb-3">{feedback}</p>}

          <button
            disabled={sending}
            className="w-full bg-gold text-ink font-bold py-4 rounded-ticket text-lg disabled:opacity-50"
          >
            {sending ? 'Enregistrement...' : 'Enregistrer la vente'}
          </button>
        </form>
      </section>

      <BottomNav />
    </main>
  );
}
