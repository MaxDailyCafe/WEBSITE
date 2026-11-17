"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  EDITORIAL_MENU,
  EXTRAS_NOTES,
  type EditorialCategory,
  type EditorialMenuItem,
} from "@/lib/menu-data";
import { withBasePath } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

function formatItemPrice(item: EditorialMenuItem) {
  if (item.priceNote) return item.priceNote;
  if (item.price !== undefined && item.priceSecondary !== undefined) {
    return `${item.price} / ${item.priceSecondary} EGP`;
  }
  if (item.price !== undefined) {
    return `${item.price} EGP`;
  }
  return "—";
}

function FloatingCutout({
  src,
  alt,
  sizeClass = "h-36 w-36 sm:h-44 sm:w-44",
}: {
  src: string;
  alt: string;
  sizeClass?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <img
        src={withBasePath(src)}
        alt={alt}
        loading="lazy"
        draggable={false}
        className={`relative z-10 object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${sizeClass}`}
      />
      <div
        aria-hidden="true"
        className="-mt-3 h-3.5 w-[56%] rounded-full bg-[#1A120D]/16 blur-[6px]"
      />
    </div>
  );
}

export function EditorialMenu({ locale }: { locale: Locale }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<{
    item: EditorialMenuItem;
    category: EditorialCategory;
  } | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    EDITORIAL_MENU[0].id
  );

  // Track currently visible category + Escape key to close search/modal/drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setIndexOpen(false);
        setDrawerOpen(false);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const sections = EDITORIAL_MENU.map((cat) =>
      document.getElementById(`cat-${cat.id}`)
    ).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveCategoryId(visible.target.id.replace(/^cat-/, ""));
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.05, 0.2, 0.4] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EDITORIAL_MENU;
    return EDITORIAL_MENU.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.nameEn.toLowerCase().includes(q) ||
          item.descEn.toLowerCase().includes(q) ||
          item.nameAr.includes(query.trim())
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const activeCategory =
    EDITORIAL_MENU.find((c) => c.id === activeCategoryId) ?? EDITORIAL_MENU[0];

  const scrollToCategory = (id: string) => {
    setIndexOpen(false);
    const el = document.getElementById(`cat-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-[100dvh] bg-[#EBE1CE]/60 text-[#1A120D]">
      {/* FLOATING SIDE SLIDER BUTTON (Collapsed Handle on Right Edge) */}
      <aside
        aria-label="MAX DAILY 3D Studio & Social Links"
        className="fixed top-5 right-0 z-50 print:hidden"
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="max-side-slider-drawer"
          aria-label="Open 3D Generative System and Social Media Drawer"
          className={`group flex cursor-pointer items-center gap-2 rounded-l-full border border-r-0 border-[#B5854B]/45 bg-[#FAF6EE]/96 py-1.5 pr-3 pl-2 shadow-[0_10px_28px_rgba(26,18,13,0.16)] backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:pr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9381E] ${
            drawerOpen
              ? "pointer-events-none translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <ChevronLeft className="h-4 w-4 text-[#D9381E] transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#B5854B]/65 bg-[#1A120D] text-[8.5px] font-extrabold leading-[1.05] tracking-[0.14em] text-[#F5EFE2] shadow-inner">
            MAX
            <br />
            DAILY
          </span>
          <span className="hidden flex-col items-start pr-1 text-left sm:flex">
            <span className="text-[9px] font-extrabold tracking-[0.2em] text-[#D9381E] uppercase">
              3D Studio
            </span>
            <span className="text-[10px] font-semibold tracking-[0.14em] text-[#554235] uppercase">
              &amp; Socials
            </span>
          </span>
        </button>
      </aside>

      {/* BACKDROP WHEN SIDE SLIDER PANEL IS OPEN */}
      {drawerOpen && (
        <div
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-[55] bg-[#1A120D]/35 backdrop-blur-[2px] transition-opacity print:hidden"
        />
      )}

      {/* SLIDE-OUT RIGHT DRAWER: 3D GENERATIVE SYSTEM + SOCIAL MEDIA WEBSITES */}
      <nav
        id="max-side-slider-drawer"
        aria-label="3D Studio and Social Media Navigation"
        className={`fixed top-4 right-0 z-[65] flex max-h-[calc(100dvh-2rem)] w-[305px] flex-col overflow-y-auto rounded-l-[28px] border border-r-0 border-[#B5854B]/45 bg-[#FAF6EE]/98 p-5 shadow-[-18px_20px_54px_rgba(26,18,13,0.24)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[336px] print:hidden ${
          drawerOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#B5854B]/25 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B5854B]/60 bg-[#1A120D] text-[7.5px] font-extrabold leading-[1.05] tracking-[0.12em] text-[#F5EFE2]">
              MAX
              <br />
              DAILY
            </span>
            <div>
              <p className="font-editorial text-lg leading-none font-semibold text-[#1A120D]">
                MAX DAILY
              </p>
              <p className="mt-0.5 text-[9px] font-bold tracking-[0.2em] text-[#B5854B] uppercase">
                Studio &amp; Socials
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close side slider drawer"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBE1CE] text-[#1A120D] transition-colors hover:bg-[#1A120D] hover:text-[#FAF6EE]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* HERO CTA: 3D GENERATIVE SYSTEM */}
        <div className="mt-4">
          <p className="mb-2 text-[9px] font-bold tracking-[0.22em] text-[#B5854B] uppercase">
            Interactive 3D Experience
          </p>
          <Link
            href={`/${locale}/build`}
            onClick={() => setDrawerOpen(false)}
            className="group block rounded-2xl border border-[#D9381E]/50 bg-[#1A120D] p-4 text-[#FAF6EE] shadow-[0_12px_28px_rgba(26,18,13,0.18)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D9381E] px-2.5 py-0.5 text-[9px] font-extrabold tracking-[0.18em] text-[#FAF6EE] uppercase">
                <Sparkles className="h-3 w-3" />
                3D Generative
              </span>
              <ChevronRight className="h-4 w-4 text-[#D9AE7B] transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="font-editorial mt-2.5 text-2xl leading-tight font-semibold text-[#FAF6EE]">
              3D Drink &amp; Dessert Studio
            </div>
            <p className="mt-1 text-[11px] leading-snug text-[#F5EFE2]/78">
              Pour layers, swirl creams &amp; preview your custom order live in 3D.
            </p>
          </Link>
        </div>

        {/* SOCIAL MEDIA & WEBSITES */}
        <div className="mt-5">
          <p className="mb-2 text-[9px] font-bold tracking-[0.22em] text-[#B5854B] uppercase">
            Social Media &amp; Websites
          </p>
          <div className="space-y-1.5">
            <Link
              href={`/${locale}`}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-between rounded-xl border border-[#B5854B]/25 bg-[#F5EFE2] px-3.5 py-2.5 text-xs transition-colors hover:border-[#D9381E]"
            >
              <span className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-[#D9381E]" />
                <span>
                  <span className="block font-bold text-[#1A120D]">
                    Brand Hub &amp; Official Site
                  </span>
                  <span className="block text-[10px] text-[#554235]">
                    Story, Wi-Fi &amp; Overview
                  </span>
                </span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-[#B5854B]" />
            </Link>

            <a
              href="https://instagram.com/maxdaily.coffee"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#B5854B]/25 bg-[#F5EFE2] px-3.5 py-2.5 text-xs transition-colors hover:border-[#D9381E]"
            >
              <span className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 text-[#D9381E]" />
                <span>
                  <span className="block font-bold text-[#1A120D]">Instagram</span>
                  <span className="block text-[10px] text-[#554235]">
                    @maxdaily.coffee
                  </span>
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B5854B]" />
            </a>

            <a
              href="https://tiktok.com/@maxdaily.coffee"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#B5854B]/25 bg-[#F5EFE2] px-3.5 py-2.5 text-xs transition-colors hover:border-[#D9381E]"
            >
              <span className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 fill-current text-[#D9381E]"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.26 8.26 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.21Z" />
                </svg>
                <span>
                  <span className="block font-bold text-[#1A120D]">TikTok</span>
                  <span className="block text-[10px] text-[#554235]">
                    @maxdaily.coffee
                  </span>
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B5854B]" />
            </a>

            <a
              href="https://facebook.com/maxdaily.coffee"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#B5854B]/25 bg-[#F5EFE2] px-3.5 py-2.5 text-xs transition-colors hover:border-[#D9381E]"
            >
              <span className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 fill-current text-[#D9381E]"
                >
                  <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
                </svg>
                <span>
                  <span className="block font-bold text-[#1A120D]">Facebook</span>
                  <span className="block text-[10px] text-[#554235]">
                    /maxdaily.coffee
                  </span>
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B5854B]" />
            </a>

            <a
              href="https://wa.me/201000000000?text=Hello%20MAX%20DAILY!"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#B5854B]/25 bg-[#F5EFE2] px-3.5 py-2.5 text-xs transition-colors hover:border-[#D9381E]"
            >
              <span className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-[#D9381E]" />
                <span>
                  <span className="block font-bold text-[#1A120D]">WhatsApp</span>
                  <span className="block text-[10px] text-[#554235]">
                    Direct Order &amp; Inquiries
                  </span>
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B5854B]" />
            </a>

            <a
              href="https://maps.google.com/?q=MAX+DAILY+Specialty+Coffee+and+Bakery"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#B5854B]/25 bg-[#F5EFE2] px-3.5 py-2.5 text-xs transition-colors hover:border-[#D9381E]"
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#D9381E]" />
                <span>
                  <span className="block font-bold text-[#1A120D]">Location &amp; Hours</span>
                  <span className="block text-[10px] text-[#554235]">
                    Open Daily · 7 AM – 12 AM
                  </span>
                </span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-[#B5854B]" />
            </a>
          </div>
        </div>

        {/* MENU TOOLS */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#B5854B]/25 pt-4">
          <button
            type="button"
            onClick={() => {
              setSearchOpen(true);
              setDrawerOpen(false);
            }}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#1A120D]/15 bg-[#F5EFE2] py-2.5 text-[11px] font-bold text-[#1A120D] hover:border-[#D9381E]"
          >
            <Search className="h-3.5 w-3.5 text-[#D9381E]" />
            Search
          </button>

          <a
            href={withBasePath("/MAX_DAILY_Luxury_Editorial_Menu.pdf")}
            download="MAX_DAILY_Luxury_Editorial_Menu.pdf"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#1A120D]/15 bg-[#F5EFE2] py-2.5 text-[11px] font-bold text-[#1A120D] hover:border-[#B5854B]"
          >
            <FileDown className="h-3.5 w-3.5 text-[#B5854B]" />
            Save PDF
          </a>
        </div>
      </nav>

      {/* EXPANDABLE EDITORIAL SEARCH BAR */}
      {searchOpen && (
        <div className="fixed inset-x-0 top-0 z-[60] border-b border-[#B5854B]/30 bg-[#FAF6EE]/96 px-4 py-3 shadow-sm backdrop-blur-md print:hidden">
          <div className="mx-auto flex max-w-[740px] items-center gap-3">
            <Search className="h-4 w-4 shrink-0 text-[#B5854B]" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Espresso, Matcha, Cheesecake, Mojito..."
              className="w-full bg-transparent text-sm font-medium text-[#1A120D] placeholder:text-[#554235]/60 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="cursor-pointer text-xs font-bold tracking-wider text-[#D9381E] uppercase"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
              aria-label="Close search"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full hover:bg-[#1A120D]/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* CONTINUOUS EDITORIAL LOOKBOOK COLUMN */}
      <main
        className={`mx-auto max-w-[760px] bg-[#F5EFE2] shadow-[0_24px_80px_rgba(26,18,13,0.14)] print:max-w-none print:shadow-none ${
          searchOpen ? "pt-14" : ""
        }`}
      >
        {/* PAGE 1: EMBOSSED CREMA COVER */}
        {!query.trim() && (
          <section className="editorial-cover-paper relative flex min-h-[88dvh] flex-col items-center justify-between px-8 pt-24 pb-16 text-center sm:min-h-[820px] sm:py-20">
            <div className="max-w-[260px] text-[10px] leading-relaxed font-semibold tracking-[0.32em] text-[#554235] uppercase sm:max-w-none">
              Specialty Coffee &amp; Artisan Bakery · Est. 2015
            </div>

            <div className="my-auto flex flex-col items-center">
              <div
                aria-label="MAX DAILY"
                className="embossed-wordmark font-editorial text-[4.1rem] leading-[0.9] font-semibold tracking-[0.14em] uppercase select-none sm:text-[6rem]"
              >
                MAX
                <span className="block text-[3rem] tracking-[0.22em] sm:text-[4.3rem]">
                  DAILY
                </span>
              </div>
              <div className="mt-7 h-px w-20 bg-[#B5854B]/55" />
              <p className="mt-4 text-[11px] font-medium tracking-[0.28em] text-[#554235] uppercase">
                A Daily Dose of Positivity
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <span className="font-editorial text-2xl font-semibold tracking-[0.34em] text-[#D9381E] uppercase sm:text-3xl">
                MENU
              </span>
              <span className="text-[10px] font-medium tracking-[0.22em] text-[#554235]/80 uppercase print:hidden">
                Scroll to explore
              </span>
            </div>
          </section>
        )}

        {/* EMPTY SEARCH STATE */}
        {filteredCategories.length === 0 && (
          <section className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-8 py-20 text-center">
            <p className="font-editorial text-3xl text-[#1A120D]">
              No matching pours or sweets found
            </p>
            <p className="text-sm text-[#554235]">
              Try searching for Matcha, Latte, Waffle, Mojito, or San Sebastian.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="cursor-pointer rounded-full bg-[#D9381E] px-6 py-2.5 text-xs font-bold tracking-[0.16em] text-[#FAF6EE] uppercase"
            >
              Show Full Menu
            </button>
          </section>
        )}

        {/* CATEGORY SPREADS */}
        {filteredCategories.map((category) => (
          <article key={category.id} id={`cat-${category.id}`} className="scroll-mt-4">
            {/* FULL-BLEED PHOTOGRAPHIC CATEGORY DIVIDER */}
            {!query.trim() && (
              <div className="relative flex min-h-[68dvh] items-center justify-center overflow-hidden bg-[#1A120D] sm:min-h-[540px]">
                <img
                  src={withBasePath(category.coverImage)}
                  alt={`${category.titleEn} editorial divider`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-88"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-[#1A120D]/45 via-[#1A120D]/35 to-[#1A120D]/65"
                />
                <div className="relative z-10 px-8 text-center text-[#FAF6EE]">
                  <div className="mx-auto mb-4 h-px w-12 bg-[#D9AE7B]/85" />
                  <h2 className="font-editorial text-5xl font-medium tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] sm:text-6xl">
                    {category.titleEn}
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed font-medium tracking-[0.06em] text-[#F5EFE2]/90 sm:text-sm">
                    {category.subtitleEn}
                  </p>
                </div>
              </div>
            )}

            {/* CREMA CLÁSICA EDITORIAL LISTING SPREAD */}
            <section className="relative bg-[#F5EFE2] px-6 pt-12 pb-10 sm:px-14 sm:pt-16 sm:pb-14">
              {/* Top-left Rojo Tomate Category Title */}
              <header className="mb-10 flex flex-col gap-1 pr-14 sm:mb-12 sm:flex-row sm:items-baseline sm:justify-between sm:pr-0">
                <h3 className="font-editorial text-4xl font-medium tracking-tight text-[#D9381E] sm:text-5xl">
                  {category.titleEn}
                </h3>
                <span className="text-[10px] font-semibold tracking-[0.22em] text-[#B5854B] uppercase">
                  {category.items.length} Selections
                </span>
              </header>

              {/* ARCHETYPE 1: 2-COLUMN FLOATING CUTOUT GRID */}
              {category.layout === "grid" && (
                <div
                  className={`grid gap-x-6 gap-y-11 sm:gap-x-12 sm:gap-y-14 ${
                    category.items.some((i) => i.image)
                      ? "grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {category.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem({ item, category })}
                      className="group flex cursor-pointer flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9381E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F5EFE2]"
                    >
                      {item.image && (
                        <div className="mb-4 flex w-full justify-center">
                          <FloatingCutout
                            src={item.image}
                            alt={item.nameEn}
                            sizeClass="h-32 w-32 sm:h-40 sm:w-40"
                          />
                        </div>
                      )}

                      <div className="flex w-full flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <span className="font-editorial text-[1.25rem] leading-tight font-semibold text-[#1A120D] transition-colors group-hover:text-[#D9381E] sm:text-[1.4rem]">
                          {item.nameEn}
                          {item.isSignature && (
                            <span
                              title="House Signature"
                              className="ml-1.5 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-[#D9381E]"
                            />
                          )}
                        </span>
                        <span className="font-editorial shrink-0 text-[1.05rem] font-semibold whitespace-nowrap text-[#1A120D] tabular-nums sm:text-[1.2rem]">
                          {formatItemPrice(item)}
                        </span>
                      </div>

                      {item.priceLabel && (
                        <span className="mt-0.5 text-[9.5px] font-semibold tracking-[0.16em] text-[#B5854B] uppercase">
                          {item.priceLabel}
                        </span>
                      )}

                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#554235] sm:text-xs">
                        {item.descEn}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* ARCHETYPE 2: ALTERNATING ZIG-ZAG EDITORIAL ROWS */}
              {category.layout === "zigzag" && (
                <div className="space-y-12 sm:space-y-16">
                  {category.items.map((item, idx) => {
                    const imageOnRight = idx % 2 === 0;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem({ item, category })}
                        className={`group flex w-full cursor-pointer items-center gap-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9381E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F5EFE2] sm:gap-12 ${
                          imageOnRight ? "flex-row" : "flex-row-reverse"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <span className="font-editorial text-2xl leading-tight font-semibold text-[#1A120D] transition-colors group-hover:text-[#D9381E] sm:text-[1.75rem]">
                              {item.nameEn}
                            </span>
                            <span className="font-editorial shrink-0 text-xl font-semibold whitespace-nowrap text-[#1A120D] tabular-nums sm:text-[1.4rem]">
                              {formatItemPrice(item)}
                            </span>
                          </div>

                          {(item.isSignature || item.priceLabel) && (
                            <div className="mt-1 flex items-center gap-2 text-[9.5px] font-bold tracking-[0.18em] uppercase">
                              {item.isSignature && (
                                <span className="text-[#D9381E]">
                                  House Signature
                                </span>
                              )}
                              {item.priceLabel && (
                                <span className="text-[#B5854B]">
                                  {item.priceLabel}
                                </span>
                              )}
                            </div>
                          )}

                          <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#554235] sm:text-[13px]">
                            {item.descEn}
                          </p>
                        </div>

                        {item.image && (
                          <div className="shrink-0">
                            <FloatingCutout
                              src={item.image}
                              alt={item.nameEn}
                              sizeClass="h-36 w-36 sm:h-48 sm:w-48"
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ARCHETYPE 3: SINGLE HERO PHOTO + EDITORIAL LIST SPREAD */}
              {category.layout === "hero" && (
                <div className="grid items-start gap-10 sm:grid-cols-12 sm:gap-10">
                  <div className="sm:col-span-5">
                    {category.heroImage?.includes("/covers/") ? (
                      <div className="overflow-hidden rounded-t-[160px] rounded-b-2xl border border-[#B5854B]/35 bg-[#1A120D]">
                        <img
                          src={withBasePath(category.heroImage)}
                          alt={category.titleEn}
                          loading="lazy"
                          className="aspect-[3/4] w-full object-cover"
                        />
                      </div>
                    ) : (
                      category.heroImage && (
                        <div className="flex justify-center py-4">
                          <FloatingCutout
                            src={category.heroImage}
                            alt={category.titleEn}
                            sizeClass="h-52 w-52 sm:h-60 sm:w-60"
                          />
                        </div>
                      )
                    )}
                  </div>

                  <div className="space-y-6 sm:col-span-7">
                    {category.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem({ item, category })}
                        className="group block w-full cursor-pointer border-b border-[#B5854B]/22 pb-5 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9381E]"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-editorial text-2xl font-semibold text-[#1A120D] transition-colors group-hover:text-[#D9381E]">
                            {item.nameEn}
                            {item.isSignature && (
                              <span
                                title="House Signature"
                                className="ml-2 inline-block h-1.5 w-1.5 -translate-y-0.5 rounded-full bg-[#D9381E]"
                              />
                            )}
                          </span>
                          <span
                            className={`font-editorial shrink-0 text-lg font-semibold tabular-nums ${
                              item.priceNote
                                ? "italic text-[#B5854B]"
                                : "text-[#1A120D]"
                            }`}
                          >
                            {formatItemPrice(item)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#554235]">
                          {item.descEn}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CENTERED ROJO TOMATE BRAND FOOTER PER SPREAD */}
              <footer className="mt-14 flex flex-col items-center gap-1.5 pt-4 text-center">
                <span className="font-editorial text-lg font-semibold tracking-[0.38em] text-[#D9381E] uppercase">
                  MAX DAILY
                </span>
              </footer>
            </section>
          </article>
        ))}

        {/* EXTRAS & EDITORIAL COLOPHON */}
        <section className="border-t border-[#B5854B]/28 bg-[#EFE6D4] px-6 py-14 text-center sm:px-14">
          <p className="text-[10px] font-bold tracking-[0.28em] text-[#B5854B] uppercase">
            Tailor Your Cup · Extras
          </p>
          <h4 className="font-editorial mt-2 text-3xl font-medium text-[#1A120D]">
            Customize Your Daily Dose
          </h4>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#554235]">
            Personalize any espresso or signature drink at our bar — ask your barista for seasonal additions.
          </p>
          <div className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-[#1A120D]">
            {EXTRAS_NOTES.map((note) => (
              <span key={note} className="inline-flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-[#D9381E]" />
                {note}
              </span>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <Link
              href={`/${locale}/build`}
              className="inline-flex items-center gap-2 rounded-full bg-[#1A120D] px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-[#FAF6EE] uppercase transition-colors hover:bg-[#D9381E]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D9AE7B]" />
              Open Interactive 3D Drink Studio
            </Link>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#1A120D]/25 bg-[#FAF6EE] px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-[#1A120D] uppercase transition-colors hover:border-[#D9381E]"
            >
              Back to Brand Hub
            </Link>
          </div>

          <p className="mt-10 text-[10px] font-semibold tracking-[0.32em] text-[#D9381E] uppercase">
            But First, Max Daily.
          </p>
        </section>
      </main>

      {/* FLOATING BOTTOM CATEGORY JUMP CAPSULE */}
      <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 pointer-events-none print:hidden">
        <div className="pointer-events-auto relative">
          {indexOpen && (
            <div className="absolute bottom-14 left-1/2 w-72 -translate-x-1/2 rounded-3xl border border-[#B5854B]/40 bg-[#FAF6EE]/96 p-3 shadow-[0_20px_50px_rgba(26,18,13,0.22)] backdrop-blur-lg">
              <div className="mb-2 flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#B5854B] uppercase">
                  Chapters
                </span>
                <button
                  type="button"
                  onClick={() => setIndexOpen(false)}
                  aria-label="Close chapters"
                  className="cursor-pointer rounded-full p-1 text-[#554235] hover:bg-[#1A120D]/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-72 space-y-0.5 overflow-y-auto no-scrollbar">
                {EDITORIAL_MENU.map((cat) => {
                  const active = cat.id === activeCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => scrollToCategory(cat.id)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? "bg-[#1A120D] font-semibold text-[#FAF6EE]"
                          : "text-[#1A120D] hover:bg-[#EBE1CE]"
                      }`}
                    >
                      <span className="font-editorial text-base">
                        {cat.titleEn}
                      </span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          active ? "text-[#D9AE7B]" : "text-[#554235]"
                        }`}
                      >
                        {cat.items.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 rounded-full border border-[#B5854B]/35 bg-[#1A120D]/92 p-1.5 text-[#FAF6EE] shadow-[0_14px_34px_rgba(26,18,13,0.28)] backdrop-blur-md">
            <button
              type="button"
              onClick={() => setIndexOpen((v) => !v)}
              className="flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-colors hover:bg-white/10"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#D9AE7B]" />
              <span className="font-editorial text-base tracking-wide">
                {activeCategory.titleEn}
              </span>
            </button>
            <span className="h-4 w-px bg-[#F5EFE2]/20" />
            <button
              type="button"
              onClick={() => {
                setSearchOpen((s) => {
                  if (s) setQuery("");
                  return !s;
                });
              }}
              aria-label="Toggle search menu items"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[#F5EFE2] transition-colors hover:bg-white/10 hover:text-[#D9AE7B]"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TACTILE ITEM DETAIL SHEET */}
      {selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedItem.item.nameEn}
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A120D]/55 p-3 backdrop-blur-sm sm:items-center print:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] border border-[#B5854B]/45 bg-[#FAF6EE] p-6 text-[#1A120D] shadow-[0_28px_70px_rgba(26,18,13,0.34)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.22em] text-[#D9381E] uppercase">
                  {selectedItem.category.titleEn}
                </p>
                <h4 className="font-editorial mt-1 text-3xl font-semibold text-[#1A120D]">
                  {selectedItem.item.nameEn}
                </h4>
                <p className="text-xs font-medium text-[#554235]">
                  {selectedItem.item.nameAr}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Close item details"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#EBE1CE] text-[#1A120D] hover:bg-[#1A120D] hover:text-[#FAF6EE]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedItem.item.image && (
              <div className="my-5 flex justify-center rounded-2xl bg-[#F5EFE2] py-5">
                <FloatingCutout
                  src={selectedItem.item.image}
                  alt={selectedItem.item.nameEn}
                  sizeClass="h-44 w-44"
                />
              </div>
            )}

            <p className="text-sm leading-relaxed text-[#554235]">
              {selectedItem.item.descEn}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-[#B5854B]/25 pt-4">
              <div>
                {selectedItem.item.priceLabel && (
                  <span className="block text-[10px] font-bold tracking-[0.18em] text-[#B5854B] uppercase">
                    {selectedItem.item.priceLabel}
                  </span>
                )}
                <span className="font-editorial text-2xl font-semibold text-[#1A120D]">
                  {formatItemPrice(selectedItem.item)}
                </span>
              </div>

              {selectedItem.item.builderPresetId && (
                <Link
                  href={`/${locale}/build`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D9381E] px-5 py-2.5 text-[11px] font-bold tracking-[0.15em] text-[#FAF6EE] uppercase hover:bg-[#b82d17]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Craft in 3D
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
