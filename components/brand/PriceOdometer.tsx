"use client";

import { useEffect, useState } from "react";
import { animate } from "motion";

export function PriceOdometer({
  value,
  currency,
  className = "",
}: {
  value: number;
  currency: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(display, value, {
      type: "spring",
      bounce: 0,
      duration: 0.36,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={`inline-flex items-baseline gap-1 font-extrabold tabular-nums ${className}`}>
      <span>{display}</span>
      <span className="text-xs font-bold tracking-wider opacity-80">{currency}</span>
    </span>
  );
}
