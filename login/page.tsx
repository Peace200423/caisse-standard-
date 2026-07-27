"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const { ok, data } = await fetchJson<{ role: string }>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Une erreur est survenue.");
      return;
    }
    router.push(data.role === "agent" ? "/terrain" : "/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-ink px-6">
      <div className="max-w-md w-full bg-panel border border-white/10 rounded-2xl p-8">
        <div className="font-mono text-xs tracking-[0.16em] uppercase text-ochre mb-2">
          KRÉA.AI · Suivi & Évaluation
        </div>
        <h1 className="font-serif text-2xl mb-6">Se connecter</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-inksoft mb-1.5">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@association.org" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-inksoft mb-1.5">Code d&apos;accès</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} type="password" placeholder="Votre code personnel" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm" />
          </div>
        </div>

        {error && <p className="text-rust text-sm mt-4">{error}</p>}

        <button onClick={submit} disabled={loading} className="w-full mt-6 bg-teal text-[#0E1A14] font-semibold rounded-lg py-2.5 disabled:opacity-50">
          {loading ? "…" : "Entrer"}
        </button>

        <div className="flex justify-between mt-4 text-xs text-inksoft">
          <Link href="/forgot" className="hover:text-teal underline">Code oublié ?</Link>
          <Link href="/register" className="hover:text-teal underline">Créer une nouvelle association</Link>
        </div>
      </div>
    </main>
  );
}
