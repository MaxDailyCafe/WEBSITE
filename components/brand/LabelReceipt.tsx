"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LabelReceiptProps {
  doseText: string;
  craftText: string;
  moodText: string;
  priceText: string;
  code?: string;
  onCycleMood?: () => void;
  className?: string;
}

export function LabelReceipt({
  doseText,
  craftText,
  moodText,
  priceText,
  code = "MX-482",
  onCycleMood,
  className,
}: LabelReceiptProps) {
  const bars = useMemo(() => {
    const out: number[] = [];
    let seed = 0;
    for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i) * (i + 1);
    for (let i = 0; i < 40; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      out.push((seed % 3) + 1);
    }
    return out;
  }, [code]);

  return (
    <div className={cn("kraft-card rounded-[20px] p-4 text-[#0D2419]", className)}>
      <div className="flex items-baseline justify-between border-b-2 border-[#163828] pb-2">
        <div>
          <div className="text-2xl font-extrabold tracking-[0.06em] leading-none text-[#163828]">
            MAX
          </div>
          <div className="text-sm font-extrabold tracking-[0.22em] leading-tight text-[#D9381E]">
            DAILY
          </div>
        </div>
        <span className="rounded-full bg-[#D9381E] px-3 py-0.5 text-sm font-extrabold tabular-nums text-[#FAF6EE]">
          {priceText}
        </span>
      </div>

      <div className="divide-y divide-[#163828]/25 text-xs">
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="font-extrabold tracking-wider text-[#163828]">DOSE:</span>
          <span className="truncate font-bold">{doseText}</span>
        </div>
        <div className="flex items-center justify-between gap-2 py-2">
          <span className="font-extrabold tracking-wider text-[#163828]">CRAFT:</span>
          <span className="truncate font-bold">{craftText}</span>
        </div>
        <button
          type="button"
          onClick={onCycleMood}
          className="flex w-full items-center justify-between gap-2 py-2 text-start"
        >
          <span className="font-extrabold tracking-wider text-[#163828]">MOOD:</span>
          <span className="rounded-full bg-[#163828] px-3 py-0.5 text-[11px] font-extrabold tracking-widest text-[#F5EFE2]">
            {moodText} ↻
          </span>
        </button>
      </div>

      <div className="mt-2 border-t-2 border-[#163828] pt-2.5 text-center">
        <div aria-hidden="true" className="mx-auto flex h-7 max-w-[210px] items-stretch justify-center gap-[2px]">
          {bars.map((w, i) => (
            <span key={i} className="bg-[#163828]" style={{ width: `${w}px` }} />
          ))}
        </div>
        <div className="mt-1 text-[10px] font-extrabold tracking-[0.24em] text-[#23503B]">
          {code} · 100% POSITIVITY
        </div>
      </div>
    </div>
  );
}
