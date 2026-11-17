import { CUSTOM_ADDON_OPTIONS } from "./rules/placeholder-menu";
import type { AddonSelection, MenuItem, VisualSpec } from "./rules/types";

export interface LiquidLayerSpec {
  id: string;
  labelEn: string;
  labelAr: string;
  color: string;
  opacity: number;
  start: number;
  end: number;
  marbling: boolean;
  viscosity: number;
}

export interface BuiltRecipe {
  layers: LiquidLayerSpec[];
  iceCount: number;
  garnishKind?: VisualSpec["particleKind"];
  garnishCount: number;
  dessertGlazeColor: string;
  dessertCrunchColor: string;
}

export function compileRecipe(
  item: MenuItem,
  variantId: string,
  addons: AddonSelection
): BuiltRecipe {
  const variant =
    item.variants.find((v) => v.id === variantId) ?? item.variants[0];

  const [base0, base1] = item.baseLayers;
  let color0 = base0.color;
  let color1 = base1.color;
  let label0En = base0.labelEn;
  let label0Ar = base0.labelAr;
  let label1En = base1.labelEn;
  let label1Ar = base1.labelAr;

  // Apply milk customization tint if chosen
  if (item.allowMilkAddons && addons.milk !== "milk_std") {
    const milkOpt = CUSTOM_ADDON_OPTIONS.find((o) => o.id === addons.milk);
    if (milkOpt) {
      label0En = `${base0.labelEn} (${milkOpt.nameEn})`;
      label0Ar = `${base0.labelAr} (${milkOpt.nameAr})`;
    }
  }

  // Apply syrup or extra shot customization
  if (item.allowSyrupAddons && addons.syrup !== "syrup_none") {
    const syrOpt = CUSTOM_ADDON_OPTIONS.find((o) => o.id === addons.syrup);
    if (syrOpt) {
      label1En = `${base1.labelEn} + ${syrOpt.nameEn}`;
      label1Ar = `${base1.labelAr} + ${syrOpt.nameAr}`;
    }
  }

  const layers: LiquidLayerSpec[] = [
    {
      id: `${item.id}_0`,
      labelEn: label0En,
      labelAr: label0Ar,
      color: color0,
      opacity: 0.98,
      start: 0.0,
      end: 0.56,
      marbling: false,
      viscosity: base0.viscosity,
    },
    {
      id: `${item.id}_1`,
      labelEn: label1En,
      labelAr: label1Ar,
      color: color1,
      opacity: 0.98,
      start: 0.56,
      end: 0.96,
      marbling: true,
      viscosity: base1.viscosity,
    },
  ];

  // If Whipped Cream or Sweet Cold Foam crown is added, tint the top layer/crown
  if (item.allowToppingAddons && addons.topping !== "top_none") {
    const topOpt = CUSTOM_ADDON_OPTIONS.find((o) => o.id === addons.topping);
    if (topOpt) {
      layers.push({
        id: `${item.id}_top`,
        labelEn: topOpt.nameEn,
        labelAr: topOpt.nameAr,
        color: topOpt.color,
        opacity: 0.99,
        start: 0.82,
        end: 0.96,
        marbling: true,
        viscosity: 0.9,
      });
    }
  }

  let dessertGlazeColor = item.dessertGlazeColor ?? "#2D170E";
  if (item.kind !== "drink" && addons.syrup === "syrup_caramel") {
    dessertGlazeColor = "#C87A28";
  } else if (item.kind !== "drink" && addons.syrup === "syrup_hazelnut") {
    dessertGlazeColor = "#6E3B18";
  }

  return {
    layers,
    iceCount: variant.temp === "iced" ? 6 : 0,
    garnishKind: item.garnishKind,
    garnishCount: item.garnishKind ? 5 : 0,
    dessertGlazeColor,
    dessertCrunchColor: item.dessertCrunchColor ?? "#B86E34",
  };
}
