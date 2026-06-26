import {
  estimateEnergyTarget,
  getReferenceForNutrient,
  macroDistribution,
  type NutrientReference,
  type UserProfile
} from "./nutrition-profile";

export const CUSTOM_ENERGY_STORAGE_KEY = "nutriatlas-custom-energy-kcal-v1";

export function loadCustomEnergyTarget() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CUSTOM_ENERGY_STORAGE_KEY);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(6000, Math.max(900, Math.round(value)));
}

export function saveCustomEnergyTarget(value: number | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(CUSTOM_ENERGY_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(CUSTOM_ENERGY_STORAGE_KEY, String(Math.min(6000, Math.max(900, Math.round(value)))));
}

export function activeEnergyTarget(profile: UserProfile, customEnergyKcal: number | null) {
  return customEnergyKcal || estimateEnergyTarget(profile);
}

function normalizedKey(key: string) {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

function hasAny(key: string, values: string[]) {
  return values.some((value) => key.includes(value));
}

function isEnergyKcal(key: string) {
  return (key.includes("energy") || key.includes("energie")) && key.includes("kcal");
}

function isFat(key: string) {
  return hasAny(key, ["fat", "lipid", "lipide", "matieres_grasses"]);
}

function isSaturatedFat(key: string) {
  return hasAny(key, ["saturated", "sature"]) && hasAny(key, ["fat", "gras", "lipid"]);
}

function isCarbohydrate(key: string) {
  return hasAny(key, ["carbohydrate", "carb", "glucide", "glucides"]);
}

function isProtein(key: string) {
  return hasAny(key, ["protein", "proteine", "proteines"]);
}

export function getReferenceForNutrientWithEnergy(
  key: string,
  profile: UserProfile,
  customEnergyKcal: number | null
): NutrientReference | null {
  const base = getReferenceForNutrient(key, profile);
  const energy = activeEnergyTarget(profile, customEnergyKcal);
  const macro = macroDistribution(profile, energy);
  const normalized = normalizedKey(key);
  const source = customEnergyKcal ? "Objectif calories du profil" : "Profil nutritionnel";

  if (isEnergyKcal(normalized)) {
    return {
      target: energy,
      unit: "kcal",
      role: "neutral",
      basis: customEnergyKcal ? "Objectif énergétique journalier saisi" : "Besoin énergétique estimé depuis le profil",
      source
    };
  }

  if (isSaturatedFat(normalized)) {
    return {
      target: macro.saturatedFatLimitG,
      unit: "g",
      role: "limit",
      basis: "Repère indicatif : 10 % de l’énergie",
      source
    };
  }

  if (isProtein(normalized)) {
    return {
      target: macro.proteinG,
      unit: "g",
      role: "positive",
      basis: `${macro.proteinFactor} g/kg sur poids de référence ${macro.referenceWeightKg} kg`,
      source
    };
  }

  if (isFat(normalized)) {
    return {
      target: macro.fatG,
      unit: "g",
      role: "neutral",
      basis: `Repère indicatif : ${macro.fatPercent} % de l’énergie`,
      source
    };
  }

  if (isCarbohydrate(normalized)) {
    return {
      target: macro.carbG,
      unit: "g",
      role: "neutral",
      basis: `Repère indicatif : ${macro.carbPercent} % de l’énergie`,
      source
    };
  }

  return base;
}
