"use client";

export function WhatsAppShare({ orgName, resumeText }: { orgName: string; resumeText: string }) {
  const text = `📊 ${orgName} — Suivi & Évaluation\n\n${resumeText}\n\nGénéré via Carnet Suivi & Évaluation (KRÉA.AI)`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-teal hover:text-teal transition"
    >
      ⇢ Partager sur WhatsApp
    </a>
  );
}
