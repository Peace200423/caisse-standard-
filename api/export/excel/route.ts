import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { BRAND } from "@/lib/branding";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: { objectifs: { include: { indicateurs: { include: { valeurs: true } } } } },
  });
  if (!org) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Suivi & Évaluation");
  sheet.columns = [
    { header: "Objectif", key: "objectif", width: 34 },
    { header: "Indicateur", key: "indicateur", width: 34 },
    { header: "Cible", key: "cible", width: 12 },
    { header: "Unité", key: "unite", width: 12 },
    { header: "Dernière valeur", key: "valeur", width: 16 },
    { header: "Date", key: "date", width: 14 },
    { header: "Progression", key: "pct", width: 14 },
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFF4EFE3" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3A57" } };
    cell.alignment = { vertical: "middle" };
  });

  org.objectifs.forEach((obj: (typeof org.objectifs)[number]) => {
    obj.indicateurs.forEach((ind: (typeof obj.indicateurs)[number]) => {
      const sorted = [...ind.valeurs].sort((a, b) => a.date.getTime() - b.date.getTime());
      const last = sorted.at(-1);
      const pct = last ? Math.round((last.valeur / ind.cible) * 100) : 0;
      sheet.addRow({
        objectif: obj.titre,
        indicateur: ind.nom,
        cible: ind.cible,
        unite: ind.unite || "",
        valeur: last ? last.valeur : "",
        date: last ? last.date.toLocaleDateString("fr-FR") : "",
        pct: last ? `${pct}%` : "",
      });
    });
  });

  sheet.addRow([]);
  sheet.addRow([`Rapport généré via ${BRAND.productName} — propulsé par ${BRAND.name}`]);

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="suivi_evaluation_${org.slug}.xlsx"`,
    },
  });
}
