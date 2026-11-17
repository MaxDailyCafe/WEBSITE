import Link from "next/link";
import { ArrowLeft, ArrowRight, Globe, Sparkles } from "lucide-react";
import { DICTIONARY, LOCALES, type Locale } from "@/lib/i18n";
import { MENU_CATEGORIES, OFFICIAL_MENU } from "@/lib/rules/placeholder-menu";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "ar" ? "ar" : "en";
  const copy = DICTIONARY[locale];
  const otherLocale: Locale = locale === "en" ? "ar" : "en";
  const ArrowIcon = copy.dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pt-5 pb-16">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold tracking-[0.22em] text-[#163828]">
          DAILY DOSE // 100% ARABICA · {copy.brand.since}
        </span>
        <Link
          href={`/${otherLocale}`}
          className="tactile-press inline-flex items-center gap-1.5 rounded-full border border-[#163828]/30 bg-[#FAF6EE] px-3.5 py-1.5 text-xs font-extrabold text-[#0D2419]"
        >
          <Globe className="h-3.5 w-3.5 text-[#D9381E]" />
          <span>{copy.nav.lang}</span>
        </Link>
      </div>

      {/* 30% VERDE ABETO HERO ARCH + 10% ROJO TOMATE CTA */}
      <section className="luxury-arch-stage mx-auto max-w-xl px-6 pt-10 pb-8 text-center text-[#FAF6EE]">
        <BrandLogo
          variant="stacked-cream"
          className="mx-auto h-28 w-auto drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]"
        />
        <div className="mx-auto my-3.5 h-[3px] w-16 rounded-full bg-[#D9381E]" />
        <p className="text-[10.5px] font-bold tracking-[0.24em] text-[#F5EFE2] uppercase">
          {copy.brand.subtitle}
        </p>
        <div className="mt-3.5 inline-flex items-center rounded-full border border-[#F5EFE2]/35 bg-[#F5EFE2]/10 px-4 py-1.5 text-[9.5px] font-extrabold tracking-[0.18em] text-[#FAF6EE] uppercase">
          {copy.brand.slogan}
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link
              href={`/${locale}/menu`}
              className="tactile-press inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-[#D9381E] px-6 py-3 text-xs font-extrabold tracking-[0.14em] text-[#FAF6EE] uppercase shadow-[0_12px_28px_rgba(217,56,30,0.4)]"
            >
              <span>{locale === "ar" ? "تصفح المنيو الفاخر" : "EXPLORE LUXURY MENU"}</span>
              <ArrowIcon className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/build`}
              className="tactile-press inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border border-[#F5EFE2]/45 bg-[#F5EFE2]/12 px-6 py-3 text-xs font-extrabold tracking-[0.14em] text-[#FAF6EE] uppercase"
            >
              <Sparkles className="h-4 w-4 text-[#D9AE7B]" />
              <span>{copy.home.ctaMain}</span>
            </Link>
          </div>
          <p className="mt-2 text-[10px] font-bold tracking-[0.16em] text-[#F5EFE2]/80 uppercase">
            {copy.home.ctaSub}
          </p>
        </div>
      </section>

      {/* OFFICIAL INTERACTIVE MENU BOARD (All 6 Categories + 24 Items) */}
      <section className="rounded-[32px] border-2 border-[#163828] bg-[#FAF6EE] p-5 shadow-md sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-[#163828]/20 pb-4">
          <div>
            <h1 className="text-lg font-extrabold tracking-[0.14em] text-[#0D2419] uppercase">
              {locale === "ar" ? "قائمة ماكس ديلي الرسمية" : "OFFICIAL INTERACTIVE MENU"}
            </h1>
            <p className="text-xs font-semibold text-[#23503B]">
              {locale === "ar"
                ? "اضغط على أي مشروب أو حلوى لتحضيره وتخصيصه في استوديو الـ 3D"
                : "Tap any item to pour & customize it live in the 3D Studio"}
            </p>
          </div>
          <Link
            href={`/${locale}/build`}
            className="rounded-full bg-[#163828] px-4 py-2 text-xs font-extrabold text-[#FAF6EE]"
          >
            {copy.nav.studio} →
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {MENU_CATEGORIES.map((cat) => {
            const catItems = OFFICIAL_MENU.filter((i) => i.categoryId === cat.id);
            return (
              <div key={cat.id} className="min-w-0 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b-2 border-[#163828] pb-1.5">
                  <h2 className="min-w-0 truncate text-xs font-extrabold tracking-[0.14em] text-[#163828] uppercase">
                    {locale === "ar" ? cat.titleAr : cat.titleEn}
                  </h2>
                  <div className="flex shrink-0 gap-2 text-[10px] font-extrabold tracking-wider text-[#23503B]">
                    {cat.columns.map((col) => (
                      <span key={col} className="w-8 text-end">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-[#163828]/12">
                  {catItems.map((m) => {
                    const col1 =
                      cat.columns.length === 1
                        ? m.variants[0]?.price
                        : m.variants.find((v) => v.code === cat.columns[0])?.price;
                    const col2 =
                      cat.columns.length > 1
                        ? m.variants.find((v) => v.code === cat.columns[1])?.price
                        : undefined;

                    return (
                      <Link
                        key={m.id}
                        href={`/${locale}/build`}
                        className="group flex items-baseline justify-between gap-3 py-2.5 transition-colors hover:bg-[#F5EFE2]/70"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0D2419] group-hover:text-[#D9381E]">
                            <span>{locale === "ar" ? m.nameAr : m.nameEn}</span>
                            {m.isSignature && (
                              <span className="text-[10px] text-[#D9381E]">★</span>
                            )}
                          </div>
                          <p className="truncate text-[11px] text-[#23503B]">
                            {locale === "ar" ? m.descAr : m.descEn}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2 text-xs font-extrabold tabular-nums">
                          {cat.columns.length === 1 ? (
                            <span className="w-8 text-end text-[#D9381E]">
                              {col1 ?? "—"}
                            </span>
                          ) : (
                            <>
                              <span className="w-8 text-end text-[#0D2419]">
                                {col1 ?? "—"}
                              </span>
                              <span className="w-8 text-end text-[#D9381E]">
                                {col2 ?? "—"}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Official CUSTOMIZE YOUR DAILY DOSE Footer Box */}
        <div className="mt-8 rounded-2xl border border-[#163828]/35 bg-[#F5EFE2] p-4">
          <div className="mb-2 text-center">
            <span className="rounded-full bg-[#163828] px-4 py-1 text-[10px] font-extrabold tracking-[0.18em] text-[#FAF6EE] uppercase">
              CUSTOMIZE YOUR DAILY DOSE
            </span>
          </div>
          <div className="grid gap-2 text-xs font-extrabold text-[#0D2419] sm:grid-cols-2">
            <div>• EXTRA ESPRESSO SHOT <span className="text-[#D9381E]">+25</span></div>
            <div>• OAT / ALMOND / COCONUT MILK <span className="text-[#D9381E]">+30</span></div>
            <div>• HOUSE SYRUP (VANILLA / CARAMEL / HAZELNUT) <span className="text-[#D9381E]">+20</span></div>
            <div>• WHIPPED CREAM / SWEET COLD FOAM <span className="text-[#D9381E]">+25</span></div>
          </div>
        </div>
      </section>

      {/* BRAND STORY POEM */}
      <section className="luxury-cream-panel p-6 text-center">
        <span className="inline-block rounded-full border border-[#D9381E]/40 bg-[#F5EFE2] px-3.5 py-1 text-[9.5px] font-extrabold tracking-[0.2em] text-[#D9381E] uppercase">
          {copy.home.storyBadge}
        </span>
        <div className="mt-4 space-y-1.5 text-sm font-semibold leading-relaxed text-[#0D2419]">
          {copy.home.poem.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </section>

      <footer className="rounded-[24px] border border-[#163828] bg-[#0D2419] p-5 text-center text-[#FAF6EE]">
        <p className="text-[11px] font-extrabold tracking-[0.22em]">{copy.brand.footer}</p>
      </footer>
    </main>
  );
}
