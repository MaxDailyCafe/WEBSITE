"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Droplets,
  Eye,
  Flame,
  Globe,
  Layers,
  RefreshCw,
  Snowflake,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { DICTIONARY, type Locale } from "@/lib/i18n";
import {
  CUSTOM_ADDON_GROUPS,
  CUSTOM_ADDON_OPTIONS,
  MENU_CATEGORIES,
  OFFICIAL_MENU,
} from "@/lib/rules/placeholder-menu";
import { evaluateMenuOrder } from "@/lib/rules/allowlist";
import { compileRecipe } from "@/lib/recipe-to-timeline";
import { useStudioStore } from "@/lib/store/studio-store";
import { triggerHaptic } from "@/lib/haptics";
import { soundEngine } from "@/lib/audio";
import { PriceOdometer } from "@/components/brand/PriceOdometer";
import { LabelReceipt } from "@/components/brand/LabelReceipt";
import { BrandLogo } from "@/components/brand/BrandLogo";
import type { CustomAddonOption } from "@/lib/rules/types";

const MaxDailyCanvas = dynamic(
  () => import("@/components/three/MaxDailyCanvas").then((m) => m.MaxDailyCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-xs font-extrabold tracking-[0.22em] text-[#F5EFE2]">
        PREPARING 3D BAR...
      </div>
    ),
  }
);

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Converts normalized poured volume (0..1) to frustum fill height (0..1) so rising speed matches real cup taper */
function frustumFillHeight(volumeFrac: number, bottomR: number, topR: number): number {
  const v = Math.max(0, Math.min(1, volumeFrac));
  const r0_3 = bottomR * bottomR * bottomR;
  const r1_3 = topR * topR * topR;
  const r = Math.cbrt(r0_3 + v * (r1_3 - r0_3));
  return (r - bottomR) / (topR - bottomR);
}

export function BuildStudio({ locale }: { locale: Locale }) {
  const copy = DICTIONARY[locale];
  const isRtl = copy.dir === "rtl";
  const otherLocale: Locale = locale === "en" ? "ar" : "en";

  const {
    categoryId,
    itemId,
    variantId,
    addons,
    activeAddonGroup,
    cutaway,
    soundOn,
    layersMerged,
    moodIndex,
    setCategory,
    selectItem,
    setVariant,
    setAddon,
    setActiveAddonGroup,
    toggleCutaway,
    toggleSound,
    setLayersMerged,
    cycleMood,
  } = useStudioStore();

  const item = useMemo(
    () => OFFICIAL_MENU.find((i) => i.id === itemId) ?? OFFICIAL_MENU[0],
    [itemId]
  );

  const categoryItems = useMemo(
    () => OFFICIAL_MENU.filter((i) => i.categoryId === categoryId),
    [categoryId]
  );

  const evaluation = useMemo(
    () => evaluateMenuOrder(item, variantId, addons),
    [item, variantId, addons]
  );

  const recipe = useMemo(
    () => compileRecipe(item, variantId, addons),
    [item, variantId, addons]
  );

  // Continuous 60fps pour & mix state (final shape = 0.96 fully filled & mixed!)
  const [currentFill, setCurrentFill] = useState(0.96);
  const [mixProgress, setMixProgress] = useState(1.0);
  const [mixStyle, setMixStyle] = useState<"mixed" | "layered">("mixed");
  const [isPouring, setIsPouring] = useState(false);
  const [pourColor, setPourColor] = useState("#7EA656");
  const [pourThickness, setPourThickness] = useState(0.046);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [sloshImpulse, setSloshImpulse] = useState(1);
  const [swirlImpulse, setSwirlImpulse] = useState(0);
  const [showHotLid, setShowHotLid] = useState(false);

  const [showTicket, setShowTicket] = useState(false);
  const [tableNumber, setTableNumber] = useState(7);
  const [orderCode, setOrderCode] = useState("MX-482");
  const [confirmed, setConfirmed] = useState(false);

  const rafRef = useRef<number | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelPourRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (statusTimerRef.current !== null) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    soundEngine.enabled = soundOn;
  }, [soundOn]);

  useEffect(() => {
    return () => cancelPourRaf();
  }, [cancelPourRaf]);

  const vessel = evaluation.variant.vessel;

  // Continuous 60fps RAF pour sequence synced to overhead falling stream & cup frustum volume
  const runSmoothOverheadPour = useCallback(
    (targetRecipe = recipe, targetKind = item.kind, targetVessel = vessel) => {
      cancelPourRaf();

      if (targetKind !== "drink") {
        setLayersMerged(false);
        setPourColor(targetRecipe.dessertGlazeColor);
        setIsPouring(true);
        setStatusText(
          locale === "ar" ? "سكب الصوص الدافئ من الأعلى..." : "POURING WARM GLAZE FROM ABOVE..."
        );
        soundEngine.pour("thick", 1.1);
        const start = performance.now();
        const stepDessert = (now: number) => {
          const elapsed = (now - start) / 1000;
          if (elapsed < 1.1) {
            rafRef.current = requestAnimationFrame(stepDessert);
          } else {
            setIsPouring(false);
            setLayersMerged(true);
            soundEngine.merge();
            setStatusText(
              locale === "ar" ? "اكتمل دمج الطبقات ✨" : "LAYERS MERGED ✨"
            );
            statusTimerRef.current = setTimeout(() => setStatusText(null), 1400);
          }
        };
        rafRef.current = requestAnimationFrame(stepDessert);
        return;
      }

      if (targetRecipe.layers.length === 0) return;

      const layerA = targetRecipe.layers[0];
      const layerB = targetRecipe.layers[1] ?? layerA;
      const rBot = targetVessel === "kraft_hot" ? 0.286 : 0.252;
      const rTop = targetVessel === "kraft_hot" ? 0.401 : 0.368;

      setCurrentFill(0.0);
      setMixProgress(0.0);
      setPourColor(layerA.color);
      setPourThickness(0.044);
      setIsPouring(true);
      setSloshImpulse((n) => n + 1);
      soundEngine.pour("thin", 1.35);

      let phase2Triggered = false;
      const startTime = performance.now();
      const tHit = 0.26; // Matches PourStream gravity fall time from overhead spout to cup base
      const tPhase2 = 1.48;
      const totalDuration = 2.85;

      const tick = (now: number) => {
        const elapsed = (now - startTime) / 1000;

        if (elapsed < tHit) {
          setCurrentFill(0.0);
          setMixProgress(0.0);
          setStatusText(
            locale === "ar"
              ? `سكب ${layerA.labelAr} من الأعلى...`
              : `POURING ${layerA.labelEn.toUpperCase()}...`
          );
        } else if (elapsed < tPhase2) {
          const u1 = (elapsed - tHit) / (tPhase2 - tHit);
          const vol1 = (0.85 * u1 + 0.15 * easeInOutCubic(u1)) * 0.45;
          setCurrentFill(frustumFillHeight(vol1, rBot, rTop) * 0.96);
          setMixProgress(0.0);
        } else if (elapsed < totalDuration) {
          if (!phase2Triggered) {
            phase2Triggered = true;
            setPourColor(layerB.color);
            setPourThickness(0.056);
            setSloshImpulse((n) => n + 1);
            soundEngine.pour("thick", 1.28);
            setStatusText(
              locale === "ar"
                ? `مزج ${layerB.labelAr} حتى امتلاء الكوب...`
                : `FILLING ${layerB.labelEn.toUpperCase()} TO FULL CUP...`
            );
          }
          const u2 = (elapsed - tPhase2) / (totalDuration - tPhase2);
          const vol2 = 0.45 + (0.85 * u2 + 0.15 * easeInOutCubic(u2)) * 0.55;
          setCurrentFill(frustumFillHeight(vol2, rBot, rTop) * 0.96);
          setMixProgress(u2);
        } else {
          setCurrentFill(0.96);
          setMixProgress(1.0);
          setIsPouring(false);
          setSloshImpulse((n) => n + 1);
          setSwirlImpulse((n) => n + 1);
          soundEngine.clink();
          setStatusText(
            targetVessel === "kraft_hot"
              ? locale === "ar"
                ? "اكتمل التحضير · المشروب الساخن مكشوف من الأعلى ✨"
                : "READY · HOT DRINK OPEN TOP VIEW ✨"
              : locale === "ar"
                ? "اكتمل التحضير · الشكل النهائي للكوب ✨"
                : "READY · REAL OUTSIDE CUP VIEW ✨"
          );
          statusTimerRef.current = setTimeout(() => setStatusText(null), 1800);
          rafRef.current = null;
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [cancelPourRaf, item.kind, locale, recipe, setLayersMerged, vessel]
  );

  useEffect(() => {
    runSmoothOverheadPour(recipe, item.kind, evaluation.variant.vessel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, variantId]);

  const pourAddonSmooth = (opt: CustomAddonOption) => {
    cancelPourRaf();
    if (item.kind !== "drink") {
      runSmoothOverheadPour(recipe, item.kind, vessel);
      return;
    }

    const rBot = vessel === "kraft_hot" ? 0.286 : 0.252;
    const rTop = vessel === "kraft_hot" ? 0.401 : 0.368;
    setCurrentFill(0.76);
    setPourColor(opt.color);
    setPourThickness(0.05);
    setIsPouring(true);
    setSloshImpulse((n) => n + 1);
    soundEngine.pour("thick", 1.1);
    setStatusText(
      locale === "ar"
        ? `إضافة ${opt.nameAr} من الأعلى...`
        : `POURING ${opt.nameEn.toUpperCase()}...`
    );

    const t0 = performance.now();
    const tFall = 0.16;
    const dur = 1.18;
    const step = (now: number) => {
      const dt = (now - t0) / 1000;
      if (dt < tFall) {
        setCurrentFill(0.76);
        rafRef.current = requestAnimationFrame(step);
      } else if (dt < dur) {
        const u = (dt - tFall) / (dur - tFall);
        const vol = 0.72 + (0.85 * u + 0.15 * easeInOutCubic(u)) * 0.28;
        setCurrentFill(frustumFillHeight(vol, rBot, rTop) * 0.96);
        setMixProgress(0.45 + u * 0.55);
        rafRef.current = requestAnimationFrame(step);
      } else {
        setCurrentFill(0.96);
        setMixProgress(1.0);
        setIsPouring(false);
        setSwirlImpulse((n) => n + 1);
        soundEngine.clink();
        setStatusText(null);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const activeGroupOptions = CUSTOM_ADDON_OPTIONS.filter(
    (o) => o.groupId === activeAddonGroup
  );
  const fillPct = Math.min(100, Math.round((currentFill / 0.96) * 100));

  return (
    <div className="min-h-[100dvh] px-3 pt-3 pb-6 sm:px-6">
      <div className="mx-auto max-w-[520px] space-y-3.5 lg:max-w-5xl">
        {/* TOP HEADER + 6 OFFICIAL MENU CATEGORIES */}
        <header className="space-y-2 rounded-[26px] border border-[#163828]/25 bg-[#FAF6EE]/95 p-3 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}`}
                className="tactile-press flex h-9 w-9 items-center justify-center rounded-full bg-[#163828] text-[#F5EFE2]"
                aria-label="Menu Board"
              >
                {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              </Link>
              <BrandLogo variant="badge" className="h-8 w-auto" />
              <div className="min-w-0">
                <div className="truncate text-xs font-extrabold tracking-wider text-[#0D2419]">
                  {locale === "ar" ? item.nameAr : item.nameEn}
                </div>
                <div className="truncate text-[10px] font-bold text-[#23503B]">
                  {locale === "ar" ? item.descAr : item.descEn}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(6);
                  toggleSound();
                }}
                className="tactile-press flex h-9 w-9 items-center justify-center rounded-full border border-[#163828]/25 bg-[#F5EFE2] text-[#163828]"
                aria-label="Toggle sound"
              >
                {soundOn ? (
                  <Volume2 className="h-4 w-4 text-[#D9381E]" />
                ) : (
                  <VolumeX className="h-4 w-4 text-[#163828]/60" />
                )}
              </button>
              <Link
                href={`/${otherLocale}/build`}
                className="tactile-press inline-flex h-9 items-center gap-1 rounded-full border border-[#163828]/25 bg-[#F5EFE2] px-2.5 text-[11px] font-extrabold text-[#163828]"
              >
                <Globe className="h-3 w-3 text-[#D9381E]" />
                <span>{copy.nav.lang}</span>
              </Link>
            </div>
          </div>

          {/* 6 Official Menu Category Pills */}
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pt-0.5">
            {MENU_CATEGORIES.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic(8);
                    setCategory(cat.id);
                  }}
                  className={`tactile-press shrink-0 rounded-full px-3.5 py-1.5 text-[10.5px] font-extrabold tracking-wider transition-all ${
                    active
                      ? "bg-[#163828] text-[#FAF6EE] shadow-xs ring-1 ring-[#D9381E]"
                      : "bg-[#E6DCC8]/70 text-[#163828] hover:bg-[#E6DCC8]"
                  }`}
                >
                  {locale === "ar" ? cat.titleAr : cat.titleEn}
                </button>
              );
            })}
          </div>
        </header>

        {/* MAIN SPLIT: 30% VERDE ABETO ARCH STAGE + 60% CREMA CLÁSICA DOCK */}
        <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
          {/* VERDE ABETO ARCH 3D STAGE */}
          <section className="luxury-arch-stage relative h-[46dvh] min-h-[340px] w-full min-w-0 lg:col-span-7 lg:h-[640px]">
            <MaxDailyCanvas
              className="!absolute inset-0 h-full w-full"
              vessel={vessel}
              recipe={recipe}
              currentFill={currentFill}
              mixProgress={mixProgress}
              mixStyle={mixStyle}
              cupScale={evaluation.variant.scale}
              cutaway={cutaway}
              isPouring={isPouring}
              showHotLid={showHotLid}
              pourColor={pourColor}
              pourThickness={pourThickness}
              sloshImpulse={sloshImpulse}
              swirlImpulse={swirlImpulse}
              layersMerged={layersMerged}
              onDoubleTap={() => runSmoothOverheadPour(recipe, item.kind)}
            />

            {/* Top Arch Status Pill */}
            <div className="pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center px-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#FAF6EE]/35 bg-[#0D2419]/90 px-4 py-1 text-[10px] font-extrabold tracking-[0.16em] text-[#FAF6EE] uppercase shadow-lg backdrop-blur-md">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-[#D9381E]"
                  style={{ backgroundColor: isPouring ? pourColor : "#D9381E" }}
                />
                <span className="truncate">
                  {statusText || (locale === "ar" ? item.nameAr : item.nameEn)}
                </span>
              </div>
            </div>

            {/* Bottom-Left Stage Action Pills */}
            <div className="pointer-events-none absolute bottom-9 left-4 z-20 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  runSmoothOverheadPour(recipe, item.kind);
                }}
                className="tactile-press pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-[#D9381E] px-4 text-[11px] font-extrabold tracking-wide text-[#FAF6EE] shadow-lg"
              >
                <Droplets className="h-3.5 w-3.5" />
                <span>{copy.studio.pourBtn}</span>
              </button>

              {vessel !== "oak_plate" ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic([8, 20, 8]);
                    setSwirlImpulse((n) => n + 1);
                    setSloshImpulse((n) => n + 1);
                    setMixStyle((m) => (m === "mixed" ? "layered" : "mixed"));
                    soundEngine.clink();
                  }}
                  className="tactile-press pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FAF6EE]/35 bg-[#163828]/90 px-3.5 text-[11px] font-bold text-[#FAF6EE]"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#D9381E]" />
                  <span>
                    {mixStyle === "mixed"
                      ? locale === "ar"
                        ? "ممزوج بالكامل"
                        : "Mixed Full Cup"
                      : locale === "ar"
                        ? "طبقات متدرجة"
                        : "Layered Swirl"}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(10);
                    setLayersMerged(!layersMerged);
                    soundEngine.merge();
                  }}
                  className="tactile-press pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FAF6EE]/35 bg-[#163828]/90 px-3.5 text-[11px] font-bold text-[#FAF6EE]"
                >
                  <Layers className="h-3.5 w-3.5 text-[#D9381E]" />
                  <span>{copy.studio.mergeBtn}</span>
                </button>
              )}

              {vessel !== "oak_plate" && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    toggleCutaway();
                  }}
                  className="tactile-press pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FAF6EE]/35 bg-[#163828]/90 px-3.5 text-[11px] font-bold text-[#FAF6EE]"
                >
                  <Eye className="h-3.5 w-3.5 text-[#D9381E]" />
                  <span>
                    {cutaway || isPouring
                      ? locale === "ar"
                        ? "عرض الكوب الخارجي"
                        : "Outside Cup"
                      : copy.studio.xrayBtn}
                  </span>
                </button>
              )}

              {vessel === "kraft_hot" && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    setShowHotLid((v) => !v);
                  }}
                  className="tactile-press pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-[#FAF6EE]/35 bg-[#163828]/90 px-3.5 text-[11px] font-bold text-[#FAF6EE]"
                >
                  <Flame className="h-3.5 w-3.5 text-[#D9381E]" />
                  <span>
                    {showHotLid
                      ? locale === "ar"
                        ? "فتح الكوب"
                        : "Open Top"
                      : locale === "ar"
                        ? "إضافة الغطاء"
                        : "Sip Lid"}
                  </span>
                </button>
              )}
            </div>

            {/* Right Vertical Cup Fill Level Sight-Glass (synced 1:1 with pouring rate) */}
            {vessel !== "oak_plate" && (
              <div className="pointer-events-none absolute right-4 bottom-9 z-20 flex flex-col items-center gap-1 rounded-full border border-[#FAF6EE]/30 bg-[#0D2419]/85 p-1.5 backdrop-blur-xs">
                <div className="relative flex h-24 w-3 flex-col-reverse overflow-hidden rounded-full bg-[#163828]">
                  {/* Sight-glass level ticks at 25%, 50%, 75% */}
                  <span className="pointer-events-none absolute inset-x-0 bottom-1/4 z-10 h-[1px] bg-[#FAF6EE]/25" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-1/2 z-10 h-[1px] bg-[#FAF6EE]/35" />
                  <span className="pointer-events-none absolute inset-x-0 bottom-3/4 z-10 h-[1px] bg-[#FAF6EE]/25" />
                  <div
                    className="relative w-full rounded-full"
                    style={{
                      height: `${fillPct}%`,
                      background:
                        recipe.layers.length > 1
                          ? `linear-gradient(to top, ${recipe.layers[0].color}, ${
                              recipe.layers[recipe.layers.length - 1].color
                            })`
                          : pourColor,
                    }}
                  >
                    {fillPct > 2 && fillPct < 99 && (
                      <span className="absolute inset-x-0 top-0 h-[2px] bg-[#FAF6EE]" />
                    )}
                  </div>
                </div>
                <span className="text-[9px] font-extrabold tabular-nums text-[#FAF6EE]">
                  {fillPct}%
                </span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-20 text-center">
              <span className="text-[9px] font-extrabold tracking-[0.18em] text-[#F5EFE2]/75 uppercase">
                {copy.studio.dragHint}
              </span>
            </div>
          </section>

          {/* 60% CREMA CLÁSICA OFFICIAL MENU + CUSTOMIZATION DOCK */}
          <section className="luxury-cream-panel flex min-w-0 flex-col justify-between p-4 sm:p-5 lg:col-span-5">
            <div className="space-y-4">
              {/* 1. Official Items in Selected Category + HOT/ICED or REG/LRG Toggle */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#163828] uppercase">
                    {locale === "ar"
                      ? MENU_CATEGORIES.find((c) => c.id === categoryId)?.titleAr
                      : MENU_CATEGORIES.find((c) => c.id === categoryId)?.titleEn}
                  </span>

                  {/* Official Variant Toggle (HOT/ICED or REG/LRG) */}
                  {item.variants.length > 1 && (
                    <div className="flex gap-1 rounded-full border border-[#163828]/20 bg-[#F5EFE2] p-0.5">
                      {item.variants.map((v) => {
                        const active = v.id === evaluation.variant.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              triggerHaptic(6);
                              setVariant(v.id);
                            }}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              active
                                ? "bg-[#163828] text-[#FAF6EE]"
                                : "text-[#163828]/70"
                            }`}
                          >
                            {v.temp === "hot" ? (
                              <Flame className="h-3 w-3 text-[#D9381E]" />
                            ) : v.temp === "iced" ? (
                              <Snowflake className="h-3 w-3 text-[#D9381E]" />
                            ) : null}
                            <span>
                              {v.code} · {v.price}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Official Category Items Strip */}
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {categoryItems.map((m) => {
                    const active = m.id === item.id;
                    const pricePreview = m.variants.map((v) => v.price).join(" / ");
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic(10);
                          selectItem(m);
                        }}
                        className={`tactile-press shrink-0 rounded-2xl border px-3.5 py-2 text-start transition-all ${
                          active
                            ? "border-[#D9381E] bg-[#163828] text-[#FAF6EE] shadow-md"
                            : "border-[#163828]/20 bg-[#F5EFE2] text-[#0D2419]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-extrabold">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: m.baseLayers[1].color }}
                          />
                          <span>{locale === "ar" ? m.nameAr : m.nameEn}</span>
                        </div>
                        <div
                          className={`mt-0.5 text-[10px] font-bold ${
                            active ? "text-[#D9381E]" : "text-[#23503B]"
                          }`}
                        >
                          {pricePreview} {copy.currency}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Official "CUSTOMIZE YOUR DAILY DOSE" Tabs */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#163828] px-3 py-0.5 text-[9.5px] font-extrabold tracking-[0.16em] text-[#FAF6EE] uppercase">
                    {locale === "ar"
                      ? "خصّص جرعتك اليومية"
                      : "CUSTOMIZE YOUR DAILY DOSE"}
                  </span>
                  <span className="text-[10px] font-bold text-[#23503B]">
                    {evaluation.addonTotal > 0
                      ? `+${evaluation.addonTotal} ${copy.currency}`
                      : locale === "ar"
                        ? "الوصفة الأصلية"
                        : "Standard Recipe"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {CUSTOM_ADDON_GROUPS.map((g) => {
                    const isCurrent = g.id === activeAddonGroup;
                    const enabled = evaluation.allowedAddons[g.id];
                    const pickedId = addons[g.id];
                    const pickedOpt = CUSTOM_ADDON_OPTIONS.find(
                      (o) => o.id === pickedId
                    );
                    const hasExtra = pickedOpt && pickedOpt.priceDelta > 0;

                    return (
                      <button
                        key={g.id}
                        type="button"
                        disabled={!enabled}
                        onClick={() => {
                          triggerHaptic(6);
                          setActiveAddonGroup(g.id);
                        }}
                        className={`tactile-press flex items-center justify-center gap-1 rounded-xl border py-2 px-2 text-[10.5px] font-extrabold transition-all disabled:opacity-35 ${
                          isCurrent
                            ? "border-[#D9381E] bg-[#163828] text-[#FAF6EE] shadow-xs"
                            : hasExtra
                              ? "border-[#D9381E]/50 bg-[#F5EFE2] text-[#0D2419]"
                              : "border-[#163828]/20 bg-[#F5EFE2] text-[#163828]"
                        }`}
                      >
                        <span className="truncate">
                          {locale === "ar" ? g.nameAr : g.nameEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Circular Medallion Add-on Options */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5 sm:grid-cols-2">
                {activeGroupOptions.map((opt) => {
                  const enabled = evaluation.allowedAddons[opt.groupId];
                  const selected = addons[opt.groupId] === opt.id;
                  const name = locale === "ar" ? opt.nameAr : opt.nameEn;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!enabled}
                      onClick={() => {
                        triggerHaptic(10);
                        setAddon(opt.groupId, opt.id);
                        pourAddonSmooth(opt);
                      }}
                      className={`tactile-press flex items-center gap-3 rounded-[20px] border p-2.5 text-start transition-all disabled:opacity-40 ${
                        selected
                          ? "border-[#D9381E] bg-[#163828] text-[#FAF6EE] shadow-[0_8px_20px_rgba(13,36,25,0.2)] ring-2 ring-[#D9381E]"
                          : "border-[#163828]/20 bg-[#F5EFE2] text-[#0D2419] hover:border-[#163828]"
                      }`}
                    >
                      <span
                        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 shadow-inner ${
                          selected ? "border-[#FAF6EE]" : "border-[#163828]/15"
                        }`}
                        style={{
                          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.75) 0%, ${opt.color} 52%, #0D2419 145%)`,
                        }}
                      >
                        {selected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D9381E] text-[#FAF6EE]">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-extrabold leading-tight">
                          {name}
                        </div>
                        <div
                          className={`mt-0.5 text-[10px] font-bold ${
                            selected ? "text-[#D9381E]" : "text-[#23503B]"
                          }`}
                        >
                          {opt.priceDelta > 0
                            ? `+${opt.priceDelta} ${copy.currency}`
                            : locale === "ar"
                              ? "مشمول"
                              : "Included"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTTOM ORDER BAR — 10% Rojo Tomate Primary CTA */}
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#163828]/15 pt-3.5">
              <div>
                <div className="text-[10px] font-extrabold tracking-[0.16em] text-[#23503B] uppercase">
                  {locale === "ar" ? item.nameAr : item.nameEn} ·{" "}
                  {evaluation.variant.code}
                </div>
                <PriceOdometer
                  value={evaluation.totalPrice}
                  currency={copy.currency}
                  className="text-2xl text-[#0D2419]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic([12, 30, 18]);
                  soundEngine.merge();
                  setOrderCode(`MX-${Math.floor(100 + Math.random() * 899)}`);
                  setConfirmed(false);
                  setShowTicket(true);
                }}
                className="tactile-press inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-[#D9381E] px-6 text-xs font-extrabold tracking-wider text-[#FAF6EE] uppercase shadow-[0_12px_28px_rgba(217,56,30,0.35)]"
              >
                <Sparkles className="h-4 w-4" />
                <span>{copy.studio.orderBtn}</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* DAILY DOSE TICKET MODAL */}
      {showTicket && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0D2419]/75 p-3 backdrop-blur-xs sm:items-center">
          <div className="w-full max-w-md space-y-4 rounded-[28px] border-2 border-[#163828] bg-[#FAF6EE] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BrandLogo variant="badge" className="h-10 w-auto" />
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-[#0D2419]">
                    {copy.studio.ticketTitle}
                  </div>
                  <div className="text-[10px] font-bold text-[#23503B]">
                    {copy.studio.ticketSub}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTicket(false)}
                className="rounded-full bg-[#F5EFE2] px-3 py-1 text-xs font-extrabold text-[#0D2419]"
              >
                ✕
              </button>
            </div>

            <LabelReceipt
              doseText={locale === "ar" ? item.nameAr : item.nameEn}
              craftText={
                evaluation.summaryEn.length > 0
                  ? `${evaluation.variant.code} + ${evaluation.summaryEn.join(", ")}`
                  : `${evaluation.variant.code} · STANDARD`
              }
              moodText={copy.studio.moods[moodIndex % copy.studio.moods.length]}
              priceText={`${evaluation.totalPrice} ${copy.currency}`}
              code={orderCode}
              onCycleMood={() => {
                triggerHaptic(6);
                cycleMood();
              }}
            />

            <div className="flex items-center justify-between rounded-2xl border border-[#163828]/25 bg-[#F5EFE2] px-4 py-2.5">
              <span className="text-xs font-extrabold text-[#0D2419]">
                {copy.studio.tableLabel}:
              </span>
              <select
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="rounded-xl border border-[#163828]/35 bg-[#FAF6EE] px-3 py-1.5 text-xs font-extrabold text-[#0D2419]"
              >
                {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {locale === "ar" ? `طاولة ${n}` : `Table ${String(n).padStart(2, "0")}`}
                  </option>
                ))}
              </select>
            </div>

            {confirmed ? (
              <div className="rounded-2xl border border-[#D9381E] bg-[#163828] p-4 text-center text-[#FAF6EE]">
                <div className="text-xs font-extrabold tracking-[0.2em] text-[#D9381E]">
                  {orderCode} · TABLE {String(tableNumber).padStart(2, "0")}
                </div>
                <p className="mt-1 text-xs font-semibold">{copy.studio.confirmedMsg}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic([15, 35, 15]);
                  setConfirmed(true);
                }}
                className="tactile-press flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#D9381E] text-xs font-extrabold tracking-wider text-[#FAF6EE] uppercase shadow-lg"
              >
                <Check className="h-4 w-4" />
                <span>{copy.studio.confirmBtn}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
