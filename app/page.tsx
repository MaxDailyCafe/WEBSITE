"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function RootRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/en/menu/");
  }, [router]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <BrandLogo variant="badge" className="h-28 w-auto" />
      <p className="text-xs font-extrabold tracking-[0.22em] text-[#77583C]">
        MAX DAILY · OPENING MENU
      </p>
    </main>
  );
}
