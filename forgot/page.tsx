"use client";

import { useState } from "react";
import Link from "next/link";
import { fetchJson } from "@/lib/fetchJson";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const { data } = await fetchJson<{ message?: string }>("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setMessage(data.message || data.error || "Si un compte existe, un email vient d'être envoyé.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-ink px-6">
      <div className="max-w-md w-full bg-panel border border-white/10 rounded-2xl p-8">
        <h1 className="font-serif text-2xl mb-2">Code oublié ?</h1>
        <p className="text-inksoft text-sm mb-6">
          Indiquez l&apos;email associé à votre compte, nous vous enverrons un lien pour choisir un nouveau code.
        </p>

        {!message ? (
          <>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@association.org" className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm mb-4" />
            <button onClick={submit} disabled={loading || !email} className="w-full bg-teal text-[#0E1A14] font-semibold rounded-lg py-2.5 disabled:opacity-50">
              {loading ? "…" : "Envoyer le lien"}
            </button>
          </>
        ) : (
          <p className="text-teal text-sm">{message}</p>
        )}

        <div className="text-center mt-6 text-xs text-inksoft">
          <Link href="/login" className="hover:text-teal underline">Retour à la connexion</Link>
        </div>
      </div>
    </main>
  );
}
