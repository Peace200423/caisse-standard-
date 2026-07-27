"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Indicateur = { id: string; nom: string; cible: number; unite: string | null };
type Objectif = { id: string; titre: string; indicateurs: Indicateur[] };
type Organization = { id: string; name: string; objectifs: Objectif[] };

type QueueItem = {
  localId: string;
  indicateurId: string;
  indicateurNom: string;
  valeur: number;
  date: string;
  note: string;
  photoBase64: string | null;
  photoName: string | null;
};

const CACHE_KEY = "terrain_cache_v1";
const QUEUE_KEY = "terrain_queue_v1";

function readQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; }
}
function writeQueue(q: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export default function TerrainPage() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [openForm, setOpenForm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/objectifs");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrg(data.organization);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data.organization));
      setOnline(true);
    } catch {
      setOnline(false);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setOrg(JSON.parse(cached));
    }
    setQueue(readQueue());
  }, []);

  useEffect(() => {
    loadData();
    const goOnline = () => { setOnline(true); syncQueue(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncQueue() {
    const q = readQueue();
    if (q.length === 0) return;
    setSyncing(true);
    const remaining: QueueItem[] = [];
    for (const item of q) {
      try {
        let preuveUrl: string | undefined;
        if (item.photoBase64) {
          const blob = await (await fetch(item.photoBase64)).blob();
          const fd = new FormData();
          fd.append("file", blob, item.photoName || "preuve.jpg");
          const up = await fetch("/api/upload", { method: "POST", body: fd });
          if (up.ok) { const upData = await up.json(); preuveUrl = upData.url; }
        }
        const res = await fetch(`/api/indicateurs/${item.indicateurId}/valeurs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valeur: item.valeur, date: item.date, note: item.note, preuveUrl }),
        });
        if (!res.ok) remaining.push(item);
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
    setQueue(remaining);
    setSyncing(false);
    loadData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!org) return <div className="min-h-screen flex items-center justify-center text-inksoft bg-bg font-mono">Chargement…</div>;

  return (
    <main className="min-h-screen bg-bg text-ink px-4 py-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-1">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ochre">Collecte terrain</div>
          <button onClick={logout} className="text-[10px] text-inksoft hover:text-rust">Déconnexion</button>
        </div>
        <h1 className="font-serif text-2xl mb-4">{org.name}</h1>

        <div className={`text-xs rounded-md px-3 py-2 mb-4 flex items-center justify-between ${online ? "bg-teal/10 text-teal" : "bg-ochre/10 text-ochre"}`}>
          <span>{online ? "● En ligne" : "● Hors-ligne — les saisies seront synchronisées plus tard"}</span>
          {queue.length > 0 && (
            <button onClick={syncQueue} disabled={syncing || !online} className="underline disabled:opacity-50">
              {syncing ? "Synchronisation…" : `Synchroniser (${queue.length})`}
            </button>
          )}
        </div>

        {org.objectifs.map((obj) => (
          <div key={obj.id} className="mb-6">
            <div className="text-xs text-inksoft mb-2">{obj.titre}</div>
            <div className="space-y-2">
              {obj.indicateurs.map((ind) => (
                <IndicateurEntry
                  key={ind.id}
                  ind={ind}
                  open={openForm === ind.id}
                  onToggle={() => setOpenForm(openForm === ind.id ? null : ind.id)}
                  pendingCount={queue.filter((q) => q.indicateurId === ind.id).length}
                  onSubmit={async (valeur, date, note, photoBase64, photoName) => {
                    if (online) {
                      try {
                        let preuveUrl: string | undefined;
                        if (photoBase64) {
                          const blob = await (await fetch(photoBase64)).blob();
                          const fd = new FormData();
                          fd.append("file", blob, photoName || "preuve.jpg");
                          const up = await fetch("/api/upload", { method: "POST", body: fd });
                          if (up.ok) { const upData = await up.json(); preuveUrl = upData.url; }
                        }
                        const res = await fetch(`/api/indicateurs/${ind.id}/valeurs`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ valeur, date, note, preuveUrl }),
                        });
                        if (!res.ok) throw new Error();
                        setOpenForm(null);
                        loadData();
                        return;
                      } catch {
                        // bascule en file d'attente si l'envoi échoue malgré la connexion apparente
                      }
                    }
                    const q = readQueue();
                    q.push({
                      localId: "q" + Math.random().toString(36).slice(2),
                      indicateurId: ind.id, indicateurNom: ind.nom,
                      valeur, date, note, photoBase64, photoName,
                    });
                    writeQueue(q);
                    setQueue(q);
                    setOpenForm(null);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function IndicateurEntry({
  ind, open, onToggle, onSubmit, pendingCount,
}: {
  ind: Indicateur; open: boolean; onToggle: () => void; pendingCount: number;
  onSubmit: (valeur: number, date: string, note: string, photoBase64: string | null, photoName: string | null) => void;
}) {
  const [valeur, setValeur] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  return (
    <div className="bg-panel border border-white/10 rounded-lg p-3">
      <button onClick={onToggle} className="w-full flex justify-between items-center text-left">
        <span className="text-sm font-medium">{ind.nom}</span>
        <span className="text-[10px] text-inksoft">
          {pendingCount > 0 && <span className="text-ochre mr-2">{pendingCount} en attente</span>}
          cible {ind.cible} {ind.unite}
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <input value={valeur} onChange={(e) => setValeur(e.target.value)} type="number" placeholder="Valeur relevée" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" />
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optionnel)" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" />
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="w-full text-xs" />
          <button
            onClick={async () => {
              if (!valeur) return;
              let photoBase64: string | null = null;
              if (photo) {
                photoBase64 = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(photo);
                });
              }
              onSubmit(parseFloat(valeur), date, note, photoBase64, photo?.name || null);
              setValeur(""); setNote(""); setPhoto(null);
            }}
            className="w-full bg-teal text-[#0E1A14] font-semibold rounded-md py-2 text-sm"
          >
            Enregistrer
          </button>
        </div>
      )}
    </div>
  );
}
