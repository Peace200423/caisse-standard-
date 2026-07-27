import { NextResponse } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { BRAND } from "@/lib/branding";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1B241A" },
  eyebrow: { fontSize: 9, color: "#D69A45", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" },
  title: { fontSize: 20, marginBottom: 2, color: "#1B3A57" },
  subtitle: { fontSize: 11, color: "#4FA184", marginBottom: 18 },
  objTitle: { fontSize: 13, marginTop: 16, marginBottom: 8, color: "#1B3A57", borderBottomWidth: 1, borderBottomColor: "#D69A45", paddingBottom: 4 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#DDD", paddingVertical: 5 },
  cellName: { width: "40%" },
  cellVal: { width: "20%" },
  headerRow: { flexDirection: "row", backgroundColor: "#1B3A57", paddingVertical: 6, paddingHorizontal: 4 },
  headerCellName: { width: "40%", color: "#F4EFE3", fontSize: 9 },
  headerCellVal: { width: "20%", color: "#F4EFE3", fontSize: 9 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#888", textAlign: "center" },
});

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: { objectifs: { include: { indicateurs: { include: { valeurs: true } } } } },
  });
  if (!org) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const doc = React.createElement(
    Document,
    {},
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.eyebrow }, "Carnet de Suivi & Évaluation"),
      React.createElement(Text, { style: styles.title }, org.name),
      React.createElement(
        Text,
        { style: styles.subtitle },
        `Rapport généré le ${new Date().toLocaleDateString("fr-FR")}`
      ),
      ...org.objectifs.map((obj: (typeof org.objectifs)[number]) =>
        React.createElement(
          View,
          { key: obj.id },
          React.createElement(Text, { style: styles.objTitle }, obj.titre),
          React.createElement(
            View,
            { style: styles.headerRow },
            React.createElement(Text, { style: styles.headerCellName }, "Indicateur"),
            React.createElement(Text, { style: styles.headerCellVal }, "Cible"),
            React.createElement(Text, { style: styles.headerCellVal }, "Réalisé"),
            React.createElement(Text, { style: styles.headerCellVal }, "Progression")
          ),
          ...obj.indicateurs.map((ind: (typeof obj.indicateurs)[number]) => {
            const sorted = [...ind.valeurs].sort((a, b) => a.date.getTime() - b.date.getTime());
            const last = sorted.at(-1);
            const pct = last ? Math.round((last.valeur / ind.cible) * 100) : 0;
            return React.createElement(
              View,
              { style: styles.row, key: ind.id },
              React.createElement(Text, { style: styles.cellName }, ind.nom),
              React.createElement(Text, { style: styles.cellVal }, `${ind.cible} ${ind.unite || ""}`),
              React.createElement(Text, { style: styles.cellVal }, last ? String(last.valeur) : "—"),
              React.createElement(Text, { style: styles.cellVal }, last ? `${pct}%` : "—")
            );
          })
        )
      ),
      React.createElement(
        Text,
        { style: styles.footer },
        `Propulsé par ${BRAND.name} — ${BRAND.productName}`
      )
    )
  );

  const buffer = await renderToBuffer(doc as any);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapport_${org.slug}.pdf"`,
    },
  });
}
