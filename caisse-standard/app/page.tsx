'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccueilPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Connexion
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');

  // Inscription
  const [nomCommerce, setNomCommerce] = useState('');
  const [telephone, setTelephone] = useState('');
  const [nomPatron, setNomPatron] = useState('');
  const [newPin, setNewPin] = useState('');
  const [codeGenere, setCodeGenere] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Connexion impossible.');
        return;
      }
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomCommerce, telephone, nomPatron, pin: newPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Inscription impossible.');
        return;
      }
      setCodeGenere(data.tenantCode);
    } finally {
      setLoading(false);
    }
  }

  if (codeGenere) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-paper">
        <div className="max-w-sm w-full bg-surface rounded-ticket p-8 text-center shadow-sm border border-line">
          <p className="text-sm text-ink/60 mb-2">Ton commerce est enregistré</p>
          <p className="text-sm mb-1 text-ink/70">Ton code d'accès :</p>
          <p className="text-4xl font-bold tracking-widest text-gold-dark mb-6">{codeGenere}</p>
          <p className="text-xs text-ink/50 mb-6">
            Note ce code quelque part — c'est lui, avec ton PIN, qui te permet de te connecter.
            30 jours d'essai gratuit ont démarré.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-ink text-paper font-semibold py-3 rounded-ticket"
          >
            Entrer dans ma caisse
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-paper">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink">Caisse Standard</h1>
          <p className="text-sm text-ink/60 mt-1">Ta caisse, tes ventes, tout de suite claires.</p>
        </div>

        <div className="flex bg-line/50 rounded-ticket p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-ticket text-sm font-medium ${mode === 'connexion' ? 'bg-surface shadow-sm' : 'text-ink/50'}`}
            onClick={() => { setMode('connexion'); setError(''); }}
          >
            J'ai déjà un compte
          </button>
          <button
            className={`flex-1 py-2 rounded-ticket text-sm font-medium ${mode === 'inscription' ? 'bg-surface shadow-sm' : 'text-ink/50'}`}
            onClick={() => { setMode('inscription'); setError(''); }}
          >
            Nouveau commerce
          </button>
        </div>

        {error && (
          <div className="bg-credit/10 border border-credit/30 text-credit text-sm rounded-ticket p-3 mb-4">
            {error}
          </div>
        )}

        {mode === 'connexion' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Code commerce</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ex: BTQ4821"
                className="w-full border border-line rounded-ticket px-4 py-3 text-lg tracking-wider uppercase bg-surface"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">PIN</label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                type="password"
                inputMode="numeric"
                placeholder="••••"
                className="w-full border border-line rounded-ticket px-4 py-3 text-lg bg-surface"
                required
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-gold text-ink font-semibold py-3 rounded-ticket disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Entrer'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Nom du commerce</label>
              <input
                value={nomCommerce}
                onChange={(e) => setNomCommerce(e.target.value)}
                placeholder="ex: Boutique Stéphanie"
                className="w-full border border-line rounded-ticket px-4 py-3 bg-surface"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Téléphone</label>
              <input
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="ex: 97 00 00 00"
                className="w-full border border-line rounded-ticket px-4 py-3 bg-surface"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Ton nom (patron)</label>
              <input
                value={nomPatron}
                onChange={(e) => setNomPatron(e.target.value)}
                className="w-full border border-line rounded-ticket px-4 py-3 bg-surface"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">Choisis un PIN (4 chiffres min.)</label>
              <input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                type="password"
                inputMode="numeric"
                className="w-full border border-line rounded-ticket px-4 py-3 bg-surface"
                required
                minLength={4}
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-gold text-ink font-semibold py-3 rounded-ticket disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon compte — 30 jours gratuits'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
