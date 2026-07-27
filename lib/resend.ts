import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendCodeRecoveryEmail(opts: {
  to: string;
  nom: string;
  resetUrl: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY absente : email de récupération non envoyé.", opts.resetUrl);
    return;
  }
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Suivi-Évaluation <onboarding@resend.dev>",
      to: opts.to,
      subject: "Réinitialisation de votre code d'accès",
      html: `
        <div style="font-family: Georgia, serif; color:#16231C;">
          <h2 style="color:#1B3A57;">Bonjour ${opts.nom},</h2>
          <p>Vous avez demandé la réinitialisation de votre code d'accès au Carnet de Suivi & Évaluation.</p>
          <p><a href="${opts.resetUrl}" style="background:#4FA184;color:#0E1A14;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;">Choisir un nouveau code</a></p>
          <p style="color:#6E7D71; font-size:12px;">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Erreur envoi email de récupération", e);
  }
}

export async function sendUpdateNotification(opts: {
  to: string[];
  orgName: string;
  indicateurNom: string;
  valeur: number;
  cible: number;
  enAttente: boolean;
}) {
  if (!resend || opts.to.length === 0) return;
  const pct = Math.round((opts.valeur / opts.cible) * 100);
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Suivi-Évaluation <onboarding@resend.dev>",
      to: opts.to,
      subject: `[${opts.orgName}] ${opts.enAttente ? "Donnée à valider" : "Nouvelle mise à jour"} : ${opts.indicateurNom}`,
      html: `
        <div style="font-family: Georgia, serif; color:#16231C;">
          <h2 style="color:#1B3A57;">${opts.orgName}</h2>
          <p><strong>${opts.indicateurNom}</strong> a été mis à jour.</p>
          <p>Nouvelle valeur : <strong>${opts.valeur}</strong> / ${opts.cible} (${pct}%)</p>
          ${opts.enAttente ? '<p style="color:#D69A45;">Cette donnée a été soumise par un agent terrain et attend votre validation.</p>' : ""}
          <p style="color:#6E7D71; font-size:12px;">Notification automatique — Carnet de Suivi & Évaluation, propulsé par KRÉA.AI</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Erreur envoi email", e);
  }
}
