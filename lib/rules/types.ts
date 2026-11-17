export type CategoryId =
  | "espresso_milk"
  | "max_signatures"
  | "iced_frappe"
  | "matcha_elixirs"
  | "manual_brew"
  | "artisan_bakery";

export type ItemKind = "drink" | "dessert" | "bakery";
export type VesselType = "kraft_hot" | "clear_iced" | "oak_plate";
export type TempOption = "hot" | "iced" | "both" | "none";
export type ActiveTemp = "hot" | "iced" | "none";

export interface VisualSpec {
  type: "liquid" | "cream" | "foam" | "ice" | "particles" | "layer" | "glaze" | "none";
  color: string;
  opacity?: number;
  viscosity?: number;
  fill?: number;
  pour?: "stream" | "ribbon" | "drop" | "none";
  particleKind?: "ice" | "strawberry" | "passion" | "mango" | "pistachio" | "mint" | "choc_chip" | "biscoff";
  particleCount?: number;
  layerHeight?: number;
  marbling?: boolean;
}

export interface MenuCategory {
  id: CategoryId;
  titleEn: string;
  titleAr: string;
  columns: [string, string] | [string];
}

export interface MenuItemVariant {
  id: string;
  code: "HOT" | "ICED" | "REG" | "LRG" | "STD";
  labelEn: string;
  labelAr: string;
  temp: ActiveTemp;
  vessel: VesselType;
  price: number;
  scale: number;
}

export interface RecipeLayer {
  labelEn: string;
  labelAr: string;
  color: string;
  fill: number;
  viscosity: number;
  marbling?: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: CategoryId;
  nameEn: string;
  nameAr: string;
  descEn: string;
  descAr: string;
  kind: ItemKind;
  isSignature: boolean;
  soldOut: boolean;
  variants: MenuItemVariant[];
  baseLayers: [RecipeLayer, RecipeLayer];
  garnishKind?: VisualSpec["particleKind"];
  dessertBaseColor?: string;
  dessertCoreColor?: string;
  dessertGlazeColor?: string;
  dessertCrunchColor?: string;
  allowMilkAddons: boolean;
  allowShotAddon: boolean;
  allowSyrupAddons: boolean;
  allowToppingAddons: boolean;
}

export interface CustomAddonGroup {
  id: "shot" | "milk" | "syrup" | "topping";
  nameEn: string;
  nameAr: string;
}

export interface CustomAddonOption {
  id: string;
  groupId: "shot" | "milk" | "syrup" | "topping";
  nameEn: string;
  nameAr: string;
  priceDelta: number;
  color: string;
  viscosity: number;
}

export type AddonSelection = Record<"shot" | "milk" | "syrup" | "topping", string>;
