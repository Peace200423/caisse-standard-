import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendCodeRecoveryEmail } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email;
    if (!email) return NextResponse.json({ error: "Email requis." }, { status: 400 });

    const member = await prisma.member.findUnique({ where: { email } });

    if (member) {
      const resetToken = crypto.randomBytes(24).toString("hex");
      await prisma.member.update({
        where: { id: member.id },
        data: { resetToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      });

      const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
      const resetUrl = `${origin}/reset?token=${resetToken}`;

      await sendCodeRecoveryEmail({ to: member.email, nom: member.nom, resetUrl }).catch((e) =>
        console.error("Erreur envoi email récupération", e)
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
    });
  } catch (e) {
    console.error("Erreur /api/auth/forgot", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
