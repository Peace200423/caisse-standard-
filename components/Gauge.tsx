"use client";

export function Gauge({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  const over = pct >= 100;
  return (
    <div className="relative h-4 rounded border border-white/10 bg-white/5 overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
          over ? "bg-gradient-to-r from-ochre to-[#E7B96B]" : "bg-gradient-to-r from-[#3E8E71] to-teal"
        }`}
        style={{ width: `${clamped}%` }}
      />
      <div className="absolute inset-0 gauge-ticks pointer-events-none" />
    </div>
  );
}
