"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gauge } from "@/components/Gauge";
import { EvolutionChart } from "@/components/EvolutionChart";
import { WhatsAppShare } from "@/components/WhatsAppShare";
import { OddBadges } from "@/components/OddBadges";
import { ODD_LIST } from "@/lib/odd";
import { NIVEAU_LABELS, NIVEAU_ORDRE } from "@/lib/niveaux";

type Role = "admin" | "superviseur" | "agent";
type Valeur = { id: string; valeur: number; date: string; note: string | null; preuveUrl: string | null; statut: string; soumisPar: string };
type Indicateur = { id: string; nom: string; cible: number; unite: string | null; odd: number[]; valeurs: Valeur[] };
type Objectif = { id: string; titre: string; niveau: string; parentId: string | null; indicateurs: Indicateur[] };
type Organization = { id: string; name: string; slug: string; publicShareEnabled: boolean; publicShareToken: string | null; objectifs: Objectif[] };
type Member = { id: string; nom: string; email: string; role: Role; createdAt: string };

function latest(ind: Indicateur) {
  const valides = ind.valeurs.filter((v) => v.statut !== "rejete");
  if (!valides.length) return null;
  return [...valides].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!;
}
function pctOf(ind: Indicateur) {
  const l = latest(ind);
  if (!l || !ind.cible) return 0;
  return (l.valeur / ind.cible) * 100;
}

export default function DashboardPage() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState<Role>("admin");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [openHist, setOpenHist] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"objectifs" | "validation" | "membres" | "partage">("objectifs");
  const [modal, setModal] = useState<null | { type: "objectif" } | { type: "indicateur"; objectifId: string } | { type: "valeur"; indicateurId: string }>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/objectifs");
    if (res.ok) {
      const data = await res.json();
      setOrg(data.organization);
      setRole(data.role);
    }
    const mRes = await fetch("/api/members");
    if (mRes.ok) {
      const mData = await mRes.json();
      setMembers(mData.members);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-inksoft font-mono">Chargement…</div>;
  if (!org) return <div className="min-h-screen flex items-center justify-center text-rust">Espace introuvable.</div>;

  const totalInd = org.objectifs.reduce((s, o) => s + o.indicateurs.length, 0);
  const avgPct = totalInd
    ? Math.round(org.objectifs.reduce((s, o) => s + o.indicateurs.reduce((s2, i) => s2 + Math.min(pctOf(i), 100), 0), 0) / totalInd)
    : 0;
  const enAttente = org.objectifs.flatMap((o) => o.indicateurs.flatMap((i) => i.valeurs.filter((v) => v.statut === "en_attente").map((v) => ({ ...v, indicateurNom: i.nom }))));

  const resumeText = org.objectifs
    .map((o) => `• ${o.titre} : ${o.indicateurs.map((i) => { const l = latest(i); return `${i.nom} ${l ? l.valeur : "—"}/${i.cible}`; }).join(", ")}`)
    .join("\n");

  const objectifsParNiveau = NIVEAU_ORDRE.map((niveau) => ({
    niveau,
    items: org.objectifs.filter((o) => o.niveau === niveau),
  }));

  return (
    <main className="min-h-screen bg-bg text-ink px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-wrap justify-between items-end gap-6 border-b border-white/10 pb-6 mb-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-ochre mb-2 flex items-center gap-2">
              Carnet Suivi & Évaluation
              <span className="text-[10px] normal-case bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-inksoft">
                {role === "admin" ? "Administrateur" : "Superviseur"}
              </span>
            </div>
            <h1 className="font-serif text-3xl">{org.name}</h1>
          </div>
          <div className="flex gap-3 items-center">
            <div className="bg-panel border border-white/10 rounded-lg px-4 py-2 text-center">
              <div className="font-mono text-xl text-teal">{org.objectifs.length}</div>
              <div className="text-[10px] uppercase text-inksoft">Objectifs</div>
            </div>
            <div className="bg-panel border border-white/10 rounded-lg px-4 py-2 text-center">
              <div className="font-mono text-xl text-teal">{totalInd}</div>
              <div className="text-[10px] uppercase text-inksoft">Indicateurs</div>
            </div>
            <div className="bg-panel border border-white/10 rounded-lg px-4 py-2 text-center">
              <div className="font-mono text-xl text-teal">{avgPct}%</div>
              <div className="text-[10px] uppercase text-inksoft">Progression</div>
            </div>
            <button onClick={logout} className="text-xs text-inksoft hover:text-rust ml-2">Déconnexion</button>
          </div>
        </header>

        <div className="flex gap-2 mb-8 text-sm border-b border-white/10">
          {[
            { id: "objectifs", label: "Objectifs" },
            { id: "validation", label: `Validation${enAttente.length ? ` (${enAttente.length})` : ""}` },
            { id: "membres", label: "Membres" },
            { id: "partage", label: "Partage & export" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-3 py-2 border-b-2 -mb-px ${tab === t.id ? "border-teal text-teal" : "border-transparent text-inksoft"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "objectifs" && (
          <>
            {objectifsParNiveau.map(({ niveau, items }) => (
              items.length > 0 && (
                <div key={niveau} className="mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-ochre mb-3">
                    {NIVEAU_LABELS[niveau as keyof typeof NIVEAU_LABELS]}
                  </div>
                  {items.map((obj) => (
                    <section key={obj.id} className="mb-10">
                      <div className="flex items-center gap-3 border-l-2 border-ochre pl-4 mb-4">
                        <div className="flex-1">
                          <h2 className="font-serif text-xl">{obj.titre}</h2>
                          {obj.parentId && (
                            <div className="text-[11px] text-inksoft">
                              ↳ rattaché à : {org.objectifs.find((o) => o.id === obj.parentId)?.titre}
                            </div>
                          )}
                        </div>
                        <button onClick={async () => { if (!confirm("Supprimer cet objectif ?")) return; await fetch(`/api/objectifs/${obj.id}`, { method: "DELETE" }); load(); }} className="text-inksoft hover:text-rust text-sm">🗑</button>
                      </div>

                      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                        {obj.indicateurs.map((ind) => {
                          const l = latest(ind);
                          const pct = pctOf(ind);
                          const pending = ind.valeurs.filter((v) => v.statut === "en_attente").length;
                          return (
                            <div key={ind.id} className="bg-panel border border-white/10 rounded-lg p-4 flex flex-col gap-2.5">
                              <div className="flex justify-between items-start gap-2">
                                <div className="font-semibold text-sm">{ind.nom}</div>
                                <button onClick={async () => { if (!confirm("Supprimer cet indicateur ?")) return; await fetch(`/api/indicateurs/${ind.id}`, { method: "DELETE" }); load(); }} className="text-inksoft hover:text-rust text-xs">🗑</button>
                              </div>
                              <OddBadges odd={ind.odd} />
                              <div className="flex items-baseline gap-2">
                                <span className="font-mono text-xl text-teal">{l ? l.valeur : "—"}</span>
                                <span className="font-mono text-xs text-inksoft">/ {ind.cible} {ind.unite}</span>
                                {pending > 0 && <span className="text-[10px] text-ochre ml-auto">{pending} en attente</span>}
                              </div>
                              <Gauge pct={pct} />
                              <div className="flex justify-between text-xs">
                                <button onClick={() => setOpenHist((s) => ({ ...s, [ind.id]: !s[ind.id] }))} className="text-teal hover:underline">Évolution</button>
                                <button onClick={() => setModal({ type: "valeur", indicateurId: ind.id })} className="text-teal hover:underline">+ Mettre à jour</button>
                              </div>
                              {openHist[ind.id] && <EvolutionChart valeurs={ind.valeurs} cible={ind.cible} />}
                              {l?.preuveUrl && <a href={l.preuveUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal hover:underline">📎 Preuve jointe</a>}
                            </div>
                          );
                        })}
                        <button onClick={() => setModal({ type: "indicateur", objectifId: obj.id })} className="border border-dashed border-white/15 rounded-lg min-h-[96px] text-inksoft hover:text-teal hover:border-teal transition text-sm">+ Ajouter un indicateur</button>
                      </div>
                    </section>
                  ))}
                </div>
              )
            ))}
            <button onClick={() => setModal({ type: "objectif" })} className="w-full border border-dashed border-white/15 rounded-lg py-4 text-inksoft hover:text-teal hover:border-teal transition text-sm">+ Ajouter un objectif</button>
          </>
        )}

        {tab === "validation" && (
          <div className="space-y-3">
            {enAttente.length === 0 && <p className="text-inksoft text-sm">Aucune donnée en attente de validation.</p>}
            {enAttente.map((v: any) => (
              <div key={v.id} className="bg-panel border border-white/10 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-sm">{v.indicateurNom}</div>
                  <div className="text-xs text-inksoft">Valeur : {v.valeur} — {new Date(v.date).toLocaleDateString("fr-FR")} {v.note && `— ${v.note}`}</div>
                  {v.preuveUrl && <a href={v.preuveUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal hover:underline">📎 Voir la preuve</a>}
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { await fetch(`/api/valeurs/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "valide" }) }); load(); }} className="text-xs px-3 py-1.5 rounded-md bg-teal text-[#0E1A14] font-semibold">Valider</button>
                  <button onClick={async () => { await fetch(`/api/valeurs/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut: "rejete" }) }); load(); }} className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-rust hover:text-rust">Rejeter</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "membres" && <MembresPanel members={members} role={role} onChange={load} />}

        {tab === "partage" && <PartagePanel org={org} resumeText={resumeText} onChange={load} />}
      </div>

      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal.type === "objectif" && <ObjectifForm objectifs={org.objectifs} onDone={() => { setModal(null); load(); }} />}
          {modal.type === "indicateur" && <IndicateurForm objectifId={modal.objectifId} onDone={() => { setModal(null); load(); }} />}
          {modal.type === "valeur" && <ValeurForm indicateurId={modal.indicateurId} onDone={() => { setModal(null); load(); }} />}
        </Modal>
      )}
    </main>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50" onClick={onClose}>
      <div className="bg-paper text-[#20281F] rounded-xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ObjectifForm({ objectifs, onDone }: { objectifs: Objectif[]; onDone: () => void }) {
  const [titre, setTitre] = useState("");
  const [niveau, setNiveau] = useState("EXTRANT");
  const [parentId, setParentId] = useState("");
  return (
    <div>
      <h3 className="font-serif text-lg mb-4">Nouvel objectif</h3>
      <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Intitulé" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <label className="block text-xs uppercase text-[#5A6656] mb-1">Niveau du cadre logique</label>
      <select value={niveau} onChange={(e) => setNiveau(e.target.value)} className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3">
        {NIVEAU_ORDRE.map((n) => <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>)}
      </select>
      <label className="block text-xs uppercase text-[#5A6656] mb-1">Rattaché à (optionnel)</label>
      <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-4">
        <option value="">Aucun</option>
        {objectifs.map((o) => <option key={o.id} value={o.id}>{o.titre}</option>)}
      </select>
      <button
        onClick={async () => {
          if (!titre.trim()) return;
          const res = await fetch("/api/objectifs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titre, niveau, parentId: parentId || undefined }) });
          const data = await res.json();
          if (!res.ok) { alert(data.error); return; }
          onDone();
        }}
        className="w-full bg-[#2F6B4F] text-[#F4EFE3] rounded-md py-2 text-sm font-semibold"
      >Enregistrer</button>
    </div>
  );
}

function IndicateurForm({ objectifId, onDone }: { objectifId: string; onDone: () => void }) {
  const [nom, setNom] = useState("");
  const [cible, setCible] = useState("");
  const [unite, setUnite] = useState("");
  const [odd, setOdd] = useState<number[]>([]);
  return (
    <div>
      <h3 className="font-serif text-lg mb-4">Nouvel indicateur</h3>
      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom de l'indicateur" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <input value={cible} onChange={(e) => setCible(e.target.value)} type="number" placeholder="Cible" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <input value={unite} onChange={(e) => setUnite(e.target.value)} placeholder="Unité (ménages, %, FCFA...)" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <label className="block text-xs uppercase text-[#5A6656] mb-1.5">ODD liés (optionnel)</label>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ODD_LIST.map((o) => (
          <button
            key={o.n}
            type="button"
            title={o.titre}
            onClick={() => setOdd((s) => s.includes(o.n) ? s.filter((x) => x !== o.n) : [...s, o.n])}
            className="text-[10px] font-mono px-2 py-1 rounded border"
            style={{ background: odd.includes(o.n) ? o.couleur : "transparent", color: odd.includes(o.n) ? "#fff" : o.couleur, borderColor: o.couleur }}
          >{o.n}</button>
        ))}
      </div>
      <button
        onClick={async () => {
          if (!nom.trim() || !cible) return;
          const res = await fetch("/api/indicateurs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objectifId, nom, cible, unite, odd }) });
          const data = await res.json();
          if (!res.ok) { alert(data.error); return; }
          onDone();
        }}
        className="w-full bg-[#2F6B4F] text-[#F4EFE3] rounded-md py-2 text-sm font-semibold"
      >Enregistrer</button>
    </div>
  );
}

function ValeurForm({ indicateurId, onDone }: { indicateurId: string; onDone: () => void }) {
  const [valeur, setValeur] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      <h3 className="font-serif text-lg mb-4">Mettre à jour la valeur</h3>
      <input value={valeur} onChange={(e) => setValeur(e.target.value)} type="number" placeholder="Nouvelle valeur" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optionnel)" className="w-full border border-[#C9C2AD] rounded-md px-3 py-2 text-sm mb-3" />
      <label className="block text-xs uppercase text-[#5A6656] mb-1.5">Preuve jointe (optionnel)</label>
      <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs mb-4" />
      <button
        disabled={uploading}
        onClick={async () => {
          if (!valeur || !date) return;
          setUploading(true);
          try {
            let preuveUrl: string | undefined;
            if (file) {
              const fd = new FormData();
              fd.append("file", file);
              const up = await fetch("/api/upload", { method: "POST", body: fd });
              const upData = await up.json();
              if (!up.ok) { alert(upData.error); setUploading(false); return; }
              preuveUrl = upData.url;
            }
            const res = await fetch(`/api/indicateurs/${indicateurId}/valeurs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ valeur, date, note, preuveUrl }) });
            const data = await res.json();
            if (!res.ok) { alert(data.error); return; }
            onDone();
          } finally {
            setUploading(false);
          }
        }}
        className="w-full bg-[#2F6B4F] text-[#F4EFE3] rounded-md py-2 text-sm font-semibold disabled:opacity-50"
      >{uploading ? "Envoi…" : "Enregistrer"}</button>
    </div>
  );
}

function MembresPanel({ members, role, onChange }: { members: Member[]; role: Role; onChange: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [memberRole, setMemberRole] = useState<Role>("agent");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <div className="space-y-2 mb-6">
        {members.map((m) => (
          <div key={m.id} className="bg-panel border border-white/10 rounded-lg p-3 flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold">{m.nom}</div>
              <div className="text-xs text-inksoft">{m.email}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wide bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-inksoft">
                {m.role === "admin" ? "Administrateur" : m.role === "superviseur" ? "Superviseur" : "Agent terrain"}
              </span>
              {role === "admin" && (
                <button onClick={async () => { if (!confirm(`Retirer ${m.nom} ?`)) return; await fetch(`/api/members/${m.id}`, { method: "DELETE" }); onChange(); }} className="text-inksoft hover:text-rust text-xs">🗑</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {role === "admin" && (
        showForm ? (
          <div className="bg-panel border border-white/10 rounded-lg p-4 max-w-sm">
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm mb-2" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm mb-2" />
            <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as Role)} className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm mb-2">
              <option value="agent">Agent terrain (saisie seule)</option>
              <option value="superviseur">Superviseur (valide les données)</option>
              <option value="admin">Administrateur (accès complet)</option>
            </select>
            <input value={code} onChange={(e) => setCode(e.target.value)} type="password" placeholder="Code d'accès (min. 4 caractères)" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm mb-3" />
            {error && <p className="text-rust text-xs mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setError(null);
                  const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom, email, role: memberRole, code }) });
                  const data = await res.json();
                  if (!res.ok) { setError(data.error); return; }
                  setShowForm(false); setNom(""); setEmail(""); setCode("");
                  onChange();
                }}
                className="flex-1 bg-teal text-[#0E1A14] font-semibold rounded-md py-2 text-sm"
              >Ajouter</button>
              <button onClick={() => setShowForm(false)} className="px-3 text-xs text-inksoft">Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="border border-dashed border-white/15 rounded-lg px-4 py-2 text-sm text-inksoft hover:text-teal hover:border-teal transition">+ Ajouter un membre</button>
        )
      )}
    </div>
  );
}

function PartagePanel({ org, resumeText, onChange }: { org: Organization; resumeText: string; onChange: () => void }) {
  const [loading, setLoading] = useState(false);
  const shareUrl = org.publicShareToken && typeof window !== "undefined" ? `${window.location.origin}/public/${org.publicShareToken}` : "";

  async function toggle(enabled: boolean) {
    setLoading(true);
    await fetch("/api/organization/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) });
    setLoading(false);
    onChange();
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h3 className="font-semibold mb-2">Exports</h3>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export/excel" className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-teal hover:text-teal transition">⇩ Export Excel</a>
          <a href="/api/export/pdf" className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-teal hover:text-teal transition">⇩ Rapport PDF</a>
          <WhatsAppShare orgName={org.name} resumeText={resumeText} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Mode bailleur</h3>
        <p className="text-xs text-inksoft mb-3">Activez un lien public en lecture seule (données validées uniquement), à partager avec vos bailleurs sans qu&apos;ils créent de compte.</p>
        {org.publicShareEnabled ? (
          <div className="space-y-2">
            <div className="bg-panel border border-white/10 rounded-md px-3 py-2 text-xs text-teal break-all">{shareUrl}</div>
            <button disabled={loading} onClick={() => toggle(false)} className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-rust hover:text-rust">Désactiver le lien</button>
          </div>
        ) : (
          <button disabled={loading} onClick={() => toggle(true)} className="text-xs px-3 py-1.5 rounded-md bg-ochre text-[#231703] font-semibold">Activer le lien bailleur</button>
        )}
      </div>
    </div>
  );
}
