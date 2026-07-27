"use client";

import { oddByNumber } from "@/lib/odd";

export function OddBadges({ odd }: { odd: number[] }) {
  if (!odd || odd.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {odd.map((n) => {
        const info = oddByNumber(n);
        if (!info) return null;
        return (
          <span
            key={n}
            title={info.titre}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: info.couleur + "22", color: info.couleur, border: `1px solid ${info.couleur}55` }}
          >
            ODD {n}
          </span>
        );
      })}
    </div>
  );
}
