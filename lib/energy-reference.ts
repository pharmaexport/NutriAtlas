import {
  estimateEnergyTarget,
  getReferenceForNutrient,
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

function roundGram(value: number) {
  return Math.round(value * 10) / 10;
}

export function getReferenceForNutrientWithEnergy(
  key: string,
  profile: UserProfile,
  customEnergyKcal: number | null
): NutrientReference | null {
  const base = getReferenceForNutrient(key, profile);
  if (!customEnergyKcal) return base;

  const normalized = normalizedKey(key);
  const energy = activeEnergyTarget(profile, customEnergyKcal);
  const source = "Objectif calories du profil";

  if (isEnergyKcal(normalized)) {
    return {
      target: energy,
      unit: "kcal",
      role: "neutral",
      basis: "Objectif énergétique journalier saisi",
      source
    };
  }

  if (isSaturatedFat(normalized)) {
    return {
      target: roundGram((energy * 0.1) / 9),
      unit: "g",
      role: "limit",
      basis: "Repère indicatif : 10 % de l’énergie",
      source
    };
  }

  if (isFat(normalized)) {
    return {
      target: roundGram((energy * 0.35) / 9),
      unit: "g",
      role: "neutral",
      basis: "Repère indicatif : 35 % de l’énergie",
      source
    };
  }

  if (isCarbohydrate(normalized)) {
    return {
      target: roundGram((energy * 0.5) / 4),
      unit: "g",
      role: "neutral",
      basis: "Repère indicatif : 50 % de l’énergie",
      source
    };
  }

  return base;
}
