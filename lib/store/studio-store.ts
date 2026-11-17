import { create } from "zustand";
import type { AddonSelection, CategoryId, MenuItem } from "@/lib/rules/types";
import { OFFICIAL_MENU } from "@/lib/rules/placeholder-menu";

interface StudioState {
  categoryId: CategoryId;
  itemId: string;
  variantId: string;
  addons: AddonSelection;
  activeAddonGroup: keyof AddonSelection;
  cutaway: boolean;
  soundOn: boolean;
  layersMerged: boolean;
  moodIndex: number;

  setCategory: (categoryId: CategoryId) => void;
  selectItem: (item: MenuItem) => void;
  setVariant: (variantId: string) => void;
  setAddon: (group: keyof AddonSelection, optionId: string) => void;
  setActiveAddonGroup: (group: keyof AddonSelection) => void;
  toggleCutaway: () => void;
  toggleSound: () => void;
  setLayersMerged: (merged: boolean) => void;
  cycleMood: () => void;
}

const DEFAULT_ADDONS: AddonSelection = {
  shot: "shot_std",
  milk: "milk_std",
  syrup: "syrup_none",
  topping: "top_none",
};

const defaultItem =
  OFFICIAL_MENU.find((i) => i.id === "pistachio_velvet_latte") ?? OFFICIAL_MENU[0];

export const useStudioStore = create<StudioState>((set) => ({
  categoryId: defaultItem.categoryId,
  itemId: defaultItem.id,
  variantId:
    defaultItem.variants.find((v) => v.temp === "iced")?.id ??
    defaultItem.variants[0].id,
  addons: { ...DEFAULT_ADDONS },
  activeAddonGroup: "milk",
  cutaway: false,
  soundOn: true,
  layersMerged: false,
  moodIndex: 0,

  setCategory: (categoryId) => {
    const firstInCat =
      OFFICIAL_MENU.find((i) => i.categoryId === categoryId) ?? OFFICIAL_MENU[0];
    const prefVariant =
      firstInCat.variants.find((v) => v.temp === "iced") ?? firstInCat.variants[0];
    set({
      categoryId,
      itemId: firstInCat.id,
      variantId: prefVariant.id,
      addons: { ...DEFAULT_ADDONS },
      cutaway: false,
      layersMerged: false,
    });
  },

  selectItem: (item) => {
    const prefVariant =
      item.variants.find((v) => v.temp === "iced") ?? item.variants[0];
    set({
      categoryId: item.categoryId,
      itemId: item.id,
      variantId: prefVariant.id,
      addons: { ...DEFAULT_ADDONS },
      cutaway: false,
      layersMerged: false,
    });
  },

  setVariant: (variantId) =>
    set({
      variantId,
      cutaway: false,
    }),

  setAddon: (group, optionId) =>
    set((s) => ({
      addons: { ...s.addons, [group]: optionId },
    })),

  setActiveAddonGroup: (activeAddonGroup) => set({ activeAddonGroup }),
  toggleCutaway: () => set((s) => ({ cutaway: !s.cutaway })),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  setLayersMerged: (layersMerged) => set({ layersMerged }),
  cycleMood: () => set((s) => ({ moodIndex: (s.moodIndex + 1) % 4 })),
}));
