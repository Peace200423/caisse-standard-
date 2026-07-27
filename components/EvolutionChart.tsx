"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Valeur = { date: string; valeur: number };

export function EvolutionChart({ valeurs, cible }: { valeurs: Valeur[]; cible: number }) {
  const sorted = [...valeurs].sort((a, b) => a.date.localeCompare(b.date));
  const data = sorted.map((v) => ({
    date: new Date(v.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    valeur: v.valeur,
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-32 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6E7D71" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#6E7D71" }} axisLine={false} tickLine={false} width={30} />
          <ReferenceLine y={cible} stroke="#D69A45" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{ background: "#1E2E24", border: "1px solid rgba(236,231,217,0.14)", fontSize: 11 }}
            labelStyle={{ color: "#ECE7D9" }}
          />
          <Line type="monotone" dataKey="valeur" stroke="#4FA184" strokeWidth={2} dot={{ r: 2.6, fill: "#4FA184" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
