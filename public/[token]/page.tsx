"use client";

import { useEffect, useState } from "react";
import { Gauge } from "@/components/Gauge";
import { EvolutionChart } from "@/components/EvolutionChart";
import { OddBadges } from "@/components/OddBadges";
import { NIVEAU_LABELS } from "@/lib/niveaux";

type Valeur = { id: string; valeur: number; date: string; note: string | null; preuveUrl: string | null };
type Indicateur = { id: string; nom: string; cible: number; unite: string | null; odd: number[]; valeurs: Valeur[] };
type Objectif = { id: string; titre: string; niveau: string; parentId: string | null; indicateurs: Indicateur[] };
type Organization = { id: string; name: string; objectifs: Objectif[] };

function latest(ind: Indicateur) {
  if (!ind.valeurs.length) return null;
  return [...ind.valeurs].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!;
}
function pctOf(ind: Indicateur) {
  const l = latest(ind);
  if (!l || !ind.cible) return 0;
  return (l.valeur / ind.cible) * 100;
}

export default function PublicPage({ params }: { params: { token: string } }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/${params.token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setOrg(data.organization);
      })
      .catch((e) => setError(e.message));
  }, [params.token]);

  if (error) return <div className="min-h-screen flex items-center justify-center text-rust bg-bg">{error}</div>;
  if (!org) return <div className="min-h-screen flex items-center justify-center text-inksoft bg-bg font-mono">Chargement…</div>;

  return (
    <main className="min-h-screen bg-bg text-ink px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="font-mono text-xs uppercase tracking-widest text-ochre mb-2">Rapport public — Suivi & Évaluation</div>
        <h1 className="font-serif text-3xl mb-1">{org.name}</h1>
        <p className="text-inksoft text-sm mb-10">
          Vue en lecture seule, partagée pour information et redevabilité. Seules les données validées apparaissent ici.
        </p>

        {org.objectifs.map((obj) => (
          <section key={obj.id} className="mb-10">
            <div className="flex items-center gap-3 border-l-2 border-ochre pl-4 mb-4">
              <span className="text-[10px] uppercase tracking-wide bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-inksoft">
                {NIVEAU_LABELS[obj.niveau as keyof typeof NIVEAU_LABELS] || obj.niveau}
              </span>
              <h2 className="font-serif text-xl">{obj.titre}</h2>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {obj.indicateurs.map((ind) => {
                const l = latest(ind);
                const pct = pctOf(ind);
                return (
                  <div key={ind.id} className="bg-panel border border-white/10 rounded-lg p-4 flex flex-col gap-2.5">
                    <div className="font-semibold text-sm">{ind.nom}</div>
                    {ind.odd.length > 0 && <OddBadges odd={ind.odd} />}
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xl text-teal">{l ? l.valeur : "—"}</span>
                      <span className="font-mono text-xs text-inksoft">/ {ind.cible} {ind.unite}</span>
                    </div>
                    <Gauge pct={pct} />
                    <EvolutionChart valeurs={ind.valeurs} cible={ind.cible} />
                    {l?.preuveUrl && (
                      <a href={l.preuveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal hover:underline">
                        📎 Voir la preuve jointe
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <footer className="text-center text-xs text-inksoft/60 pt-10 border-t border-white/10 mt-10">
          Propulsé par KRÉA.AI — Carnet de Suivi & Évaluation
        </footer>
      </div>
    </main>
  );
}
