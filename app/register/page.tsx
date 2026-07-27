"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/fetchJson";

export default function RegisterPage() {
  const router = useRouter();
  const [orgName, setOrgName] = useState("");
  const [adminNom, setAdminNom] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const { ok, data } = await fetchJson("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgName, adminNom, adminEmail, adminCode }),
    });
    setLoading(false);
    if (!ok) {
      setError(data.error || "Une erreur est survenue.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg text-ink px-6">
      <div className="max-w-md w-full bg-panel border border-white/10 rounded-2xl p-8">
        <div className="font-mono text-xs tracking-[0.16em] uppercase text-ochre mb-2">
          KRÉA.AI · Suivi & Évaluation
        </div>
        <h1 className="font-serif text-2xl mb-6">Créer votre association</h1>

        <div className="space-y-4">
          <Field label="Nom de l'association">
            <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Ex. : Association Espoir Cotonou" />
          </Field>
          <Field label="Votre nom">
            <input value={adminNom} onChange={(e) => setAdminNom(e.target.value)} placeholder="Ex. : Jean-Marie H." />
          </Field>
          <Field label="Votre email">
            <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="vous@association.org" />
          </Field>
          <Field label="Choisissez votre code d'accès">
            <input value={adminCode} onChange={(e) => setAdminCode(e.target.value)} type="password" placeholder="Au moins 4 caractères" />
          </Field>
        </div>

        {error && <p className="text-rust text-sm mt-4">{error}</p>}

        <button onClick={submit} disabled={loading} className="w-full mt-6 bg-teal text-[#0E1A14] font-semibold rounded-lg py-2.5 disabled:opacity-50">
          {loading ? "…" : "Créer l'espace"}
        </button>

        <p className="text-xs text-inksoft mt-4">
          Vous serez administrateur de cet espace : vous pourrez ensuite inviter votre équipe
          (superviseurs, agents terrain) avec leurs propres accès depuis le tableau de bord.
        </p>

        <div className="text-center mt-4 text-xs text-inksoft">
          Déjà un compte ? <Link href="/login" className="text-teal hover:underline">Se connecter</Link>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-inksoft mb-1.5">{label}</span>
      <div className="[&_input]:w-full [&_input]:bg-white/5 [&_input]:border [&_input]:border-white/10 [&_input]:rounded-md [&_input]:px-3 [&_input]:py-2 [&_input]:text-ink [&_input]:text-sm">
        {children}
      </div>
    </label>
  );
}
