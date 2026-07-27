"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [newCode, setNewCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const { ok, data } = await fetchJson("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newCode }),
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Une erreur est survenue.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) return <p className="text-rust text-sm">Lien invalide ou incomplet.</p>;
  if (done) return <p className="text-teal text-sm">Code mis à jour ! Redirection vers la connexion…</p>;

  return (
    <>
      <input value={newCode} onChange={(e) => setNewCode(e.target.value)} type="password" placeholder="Nouveau code d'accès" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm mb-4" />
      {error && <p className="text-rust text-sm mb-3">{error}</p>}
      <button onClick={submit} disabled={loading || newCode.length < 4} className="w-full bg-teal text-[#0E1A14] font-semibold rounded-lg py-2.5 disabled:opacity-50">
        {loading ? "…" : "Valider le nouveau code"}
      </button>
    </>
  );
}

export default function ResetPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-ink px-6">
      <div className="max-w-md w-full bg-panel border border-white/10 rounded-2xl p-8">
        <h1 className="font-serif text-2xl mb-6">Nouveau code d&apos;accès</h1>
        <Suspense fallback={<p className="text-inksoft text-sm">Chargement…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
