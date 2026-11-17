import { CUSTOM_ADDON_OPTIONS } from "./placeholder-menu";
import type { AddonSelection, MenuItem, MenuItemVariant } from "./types";

export interface OrderEvaluation {
  variant: MenuItemVariant;
  basePrice: number;
  addonTotal: number;
  totalPrice: number;
  allowedAddons: {
    shot: boolean;
    milk: boolean;
    syrup: boolean;
    topping: boolean;
  };
  summaryEn: string[];
  summaryAr: string[];
}

export function evaluateMenuOrder(
  item: MenuItem,
  variantId: string,
  addons: AddonSelection
): OrderEvaluation {
  const variant =
    item.variants.find((v) => v.id === variantId) ?? item.variants[0];

  const allowedAddons = {
    shot: item.allowShotAddon,
    milk: item.allowMilkAddons,
    syrup: item.allowSyrupAddons,
    topping: item.allowToppingAddons,
  };

  let addonTotal = 0;
  const summaryEn: string[] = [];
  const summaryAr: string[] = [];

  (Object.keys(addons) as Array<keyof AddonSelection>).forEach((groupKey) => {
    if (!allowedAddons[groupKey]) return;
    const pickedId = addons[groupKey];
    const opt = CUSTOM_ADDON_OPTIONS.find((o) => o.id === pickedId);
    if (opt && opt.priceDelta > 0) {
      addonTotal += opt.priceDelta;
      summaryEn.push(opt.nameEn);
      summaryAr.push(opt.nameAr);
    }
  });

  return {
    variant,
    basePrice: variant.price,
    addonTotal,
    totalPrice: variant.price + addonTotal,
    allowedAddons,
    summaryEn,
    summaryAr,
  };
}
