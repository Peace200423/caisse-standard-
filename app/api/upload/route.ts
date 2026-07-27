import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (8 Mo max)" }, { status: 413 });
  }

  try {
    const blob = await put(
      `preuves/${session.organizationId}/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    );
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Erreur upload Vercel Blob", e);
    return NextResponse.json(
      { error: "Échec de l'upload. Vérifiez que BLOB_READ_WRITE_TOKEN est configuré." },
      { status: 500 }
    );
  }
}
