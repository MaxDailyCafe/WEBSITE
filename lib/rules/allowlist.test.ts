import { describe, it, expect } from "vitest";
import { evaluateMenuOrder } from "./allowlist";
import { OFFICIAL_MENU } from "./placeholder-menu";

describe("Official MAX DAILY Menu & Customization Rules", () => {
  const spanishLatte = OFFICIAL_MENU.find((i) => i.id === "spanish_latte")!;
  const espressoDoppio = OFFICIAL_MENU.find((i) => i.id === "espresso_doppio")!;
  const pistachioLatte = OFFICIAL_MENU.find((i) => i.id === "pistachio_velvet_latte")!;
  const sanSebastian = OFFICIAL_MENU.find((i) => i.id === "san_sebastian_cheesecake")!;

  it("has all 28 official menu items across the 6 categories", () => {
    expect(OFFICIAL_MENU.length).toBe(28);
  });

  it("computes Spanish Latte Iced (125) + Extra Shot (+25) + Oat Milk (+30) = 180 EGP", () => {
    const res = evaluateMenuOrder(spanishLatte, "iced", {
      shot: "shot_extra",
      milk: "milk_oat",
      syrup: "syrup_none",
      topping: "top_none",
    });
    expect(res.basePrice).toBe(125);
    expect(res.addonTotal).toBe(55);
    expect(res.totalPrice).toBe(180);
  });

  it("ignores Milk & Topping add-ons on Espresso / Doppio (65 Hot only) per boundaries", () => {
    const res = evaluateMenuOrder(espressoDoppio, "hot", {
      shot: "shot_extra",
      milk: "milk_oat",
      syrup: "syrup_vanilla",
      topping: "top_whipped",
    });
    // Only Extra Shot (+25) and Syrup (+20) apply; milk & whipped cream are blocked
    expect(res.basePrice).toBe(65);
    expect(res.totalPrice).toBe(65 + 25 + 20);
  });

  it("computes Pistachio Velvet Latte Hot (135) & Iced (145) accurately", () => {
    const hot = evaluateMenuOrder(pistachioLatte, "hot", {
      shot: "shot_std",
      milk: "milk_std",
      syrup: "syrup_none",
      topping: "top_none",
    });
    const iced = evaluateMenuOrder(pistachioLatte, "iced", {
      shot: "shot_std",
      milk: "milk_std",
      syrup: "syrup_none",
      topping: "top_cold_foam",
    });
    expect(hot.totalPrice).toBe(135);
    expect(iced.totalPrice).toBe(145 + 25);
  });

  it("prices San Sebastian Cheesecake at 140 EGP on the Light Oak Plate", () => {
    const res = evaluateMenuOrder(sanSebastian, "std", {
      shot: "shot_std",
      milk: "milk_std",
      syrup: "syrup_none",
      topping: "top_none",
    });
    expect(res.variant.vessel).toBe("oak_plate");
    expect(res.totalPrice).toBe(140);
  });
});
