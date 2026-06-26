export type ProfileSex = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Objective = "maintenance" | "loss" | "performance" | "longevity";
export type PhysiologicalStatus = "none" | "pregnant" | "lactating";
export type ReferenceMode = "anses" | "eu";
export type NutrientRole = "positive" | "limit" | "neutral";

export type UserProfile = {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: ProfileSex;
  activityLevel: ActivityLevel;
  objective: Objective;
  physiologicalStatus: PhysiologicalStatus;
  referenceMode: ReferenceMode;
  targetWeightKg?: number | null;
  waistCm?: number | null;
  activityMinutesPerWeek?: number | null;
  proteinFactor?: number | null;
  carbPercent?: number | null;
  fatPercent?: number | null;
  mealsPerDay?: number | null;
  updatedAt?: string;
};

export type NutrientReference = {
  target: number;
  unit: string;
  role: NutrientRole;
  basis: string;
  source: string;
  upperLimit?: number;
  upperLimitLabel?: string;
  note?: string;
};

export type ReferenceSummaryItem = {
  key: string;
  label: string;
  reference: NutrientReference | null;
};

export type MacroDistribution = {
  calories: number;
  referenceWeightKg: number;
  proteinFactor: number;
  proteinG: number;
  carbPercent: number;
  carbG: number;
  fatPercent: number;
  fatG: number;
  saturatedFatLimitG: number;
};

export const PROFILE_STORAGE_KEY = "nutriatlas-profile-v1";

export const activityLevels: Array<{ value: ActivityLevel; label: string; factor: number }> = [
  { value: "sedentary", label: "Sédentaire", factor: 1.2 },
  { value: "light", label: "Activité légère", factor: 1.375 },
  { value: "moderate", label: "Activité modérée", factor: 1.55 },
  { value: "active", label: "Actif", factor: 1.725 },
  { value: "athlete", label: "Très actif / sportif", factor: 1.9 }
];

export const objectiveOptions: Array<{ value: Objective; label: string }> = [
  { value: "maintenance", label: "Maintien" },
  { value: "loss", label: "Perte de poids progressive" },
  { value: "performance", label: "Performance / récupération" },
  { value: "longevity", label: "Longévité / prévention" }
];

export const referenceModes: Array<{ value: ReferenceMode; label: string }> = [
  { value: "anses", label: "ANSES personnalisé" },
  { value: "eu", label: "UE étiquetage" }
];

const sexValues: readonly ProfileSex[] = ["female", "male"];
const activityValues: readonly ActivityLevel[] = ["sedentary", "light", "moderate", "active", "athlete"];
const objectiveValues: readonly Objective[] = ["maintenance", "loss", "performance", "longevity"];
const physiologicalValues: readonly PhysiologicalStatus[] = ["none", "pregnant", "lactating"];
const referenceModeValues: readonly ReferenceMode[] = ["anses", "eu"];

export const defaultProfile: UserProfile = {
  age: 38,
  heightCm: 175,
  weightKg: 72,
  sex: "male",
  activityLevel: "moderate",
  objective: "maintenance",
  physiologicalStatus: "none",
  referenceMode: "anses",
  targetWeightKg: null,
  waistCm: null,
  activityMinutesPerWeek: null,
  proteinFactor: null,
  carbPercent: null,
  fatPercent: null,
  mealsPerDay: null
};

function finiteNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function optionalNumber(value: unknown, min: number, max: number, decimals = 0) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const clamped = Math.min(max, Math.max(min, numeric));
  const factor = Math.pow(10, decimals);
  return Math.round(clamped * factor) / factor;
}

function optionValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeProfile(input?: Partial<UserProfile> | null): UserProfile {
  const sex = optionValue(input?.sex, sexValues, defaultProfile.sex);
  const physiologicalStatus = sex === "female"
    ? optionValue(input?.physiologicalStatus, physiologicalValues, defaultProfile.physiologicalStatus)
    : "none";

  return {
    age: Math.round(finiteNumber(input?.age, defaultProfile.age, 4, 100)),
    heightCm: Math.round(finiteNumber(input?.heightCm, defaultProfile.heightCm, 90, 230)),
    weightKg: optionalNumber(input?.weightKg, 25, 250, 1) || defaultProfile.weightKg,
    sex,
    activityLevel: optionValue(input?.activityLevel, activityValues, defaultProfile.activityLevel),
    objective: optionValue(input?.objective, objectiveValues, defaultProfile.objective),
    physiologicalStatus,
    referenceMode: optionValue(input?.referenceMode, referenceModeValues, defaultProfile.referenceMode),
    targetWeightKg: optionalNumber(input?.targetWeightKg, 25, 250, 1),
    waistCm: optionalNumber(input?.waistCm, 45, 180, 1),
    activityMinutesPerWeek: optionalNumber(input?.activityMinutesPerWeek, 0, 2000, 0),
    proteinFactor: optionalNumber(input?.proteinFactor, 0.6, 2.5, 2),
    carbPercent: optionalNumber(input?.carbPercent, 20, 70, 0),
    fatPercent: optionalNumber(input?.fatPercent, 15, 50, 0),
    mealsPerDay: optionalNumber(input?.mealsPerDay, 1, 8, 0),
    updatedAt: input?.updatedAt
  };
}

export function loadStoredProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw) as Partial<UserProfile>) : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export function saveStoredProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  const normalized = normalizeProfile({ ...profile, updatedAt: new Date().toISOString() });
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(normalized));
}

export function computeBmi(weightKg: number, heightCm: number) {
  return weightKg / Math.pow(heightCm / 100, 2);
}

export function bmiLabel(bmi: number) {
  if (bmi < 18.5) return "Poids bas";
  if (bmi < 25) return "Zone de référence";
  if (bmi < 30) return "Surpoids";
  return "Obésité";
}

export function mifflin(profile: UserProfile) {
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(base + (profile.sex === "male" ? 5 : -161));
}

export function activityFactor(level: ActivityLevel) {
  return activityLevels.find((item) => item.value === level)?.factor || 1.2;
}

export function estimateEnergyTarget(input: Partial<UserProfile>) {
  const profile = normalizeProfile(input);
  const base = mifflin(profile) * activityFactor(profile.activityLevel);
  const objectiveAdjustment: Record<Objective, number> = {
    maintenance: 0,
    loss: -300,
    performance: 180,
    longevity: -80
  };
  const minimum = profile.age < 18 ? 1000 : profile.sex === "male" ? 1500 : 1200;
  return Math.round(Math.max(minimum, base + objectiveAdjustment[profile.objective]));
}

function defaultProteinFactor(profile: UserProfile) {
  if (profile.objective === "performance") return 1.25;
  if (profile.objective === "loss") return 1.1;
  if (profile.objective === "longevity") return 1.0;
  return 0.83;
}

function defaultCarbPercent(profile: UserProfile) {
  if (profile.objective === "performance") return 55;
  if (profile.objective === "loss") return 40;
  if (profile.objective === "longevity") return 45;
  return 50;
}

function defaultFatPercent(profile: UserProfile) {
  if (profile.objective === "performance") return 30;
  return 35;
}

export function referenceWeight(profileInput: Partial<UserProfile>) {
  const profile = normalizeProfile(profileInput);
  return profile.targetWeightKg || profile.weightKg;
}

export function macroDistribution(profileInput: Partial<UserProfile>, caloriesOverride?: number | null): MacroDistribution {
  const profile = normalizeProfile(profileInput);
  const calories = caloriesOverride || estimateEnergyTarget(profile);
  const refWeight = referenceWeight(profile);
  const proteinFactor = profile.proteinFactor || defaultProteinFactor(profile);
  const carbPercent = profile.carbPercent || defaultCarbPercent(profile);
  const fatPercent = profile.fatPercent || defaultFatPercent(profile);

  return {
    calories,
    referenceWeightKg: refWeight,
    proteinFactor,
    proteinG: Math.round(refWeight * proteinFactor * 10) / 10,
    carbPercent,
    carbG: Math.round((calories * carbPercent / 100 / 4) * 10) / 10,
    fatPercent,
    fatG: Math.round((calories * fatPercent / 100 / 9) * 10) / 10,
    saturatedFatLimitG: Math.round((calories * 0.1 / 9) * 10) / 10
  };
}

function normalizedKey(key: string) {
  return key
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

function includesAny(key: string, values: string[]) {
  return values.some((value) => key.includes(value));
}

function isSugarKey(key: string) { return includesAny(key, ["sugar", "sugars", "sucre", "sucres"]); }
function isFiberKey(key: string) { return includesAny(key, ["fiber", "fibre", "fibres"]); }
function isSaltKey(key: string) { return includesAny(key, ["salt", "sel"]) && !key.includes("selenium"); }
function isSodiumKey(key: string) { return includesAny(key, ["sodium"]); }
function isSaturatedFatKey(key: string) { return includesAny(key, ["saturated", "sature"]) && includesAny(key, ["fat", "gras", "lipid"]); }
function isFatKey(key: string) { return includesAny(key, ["fat", "lipid", "lipide", "matieres_grasses"]); }
function isProteinKey(key: string) { return includesAny(key, ["protein", "proteine", "proteines"]); }
function isCarbohydrateKey(key: string) { return includesAny(key, ["carbohydrate", "carb", "glucide", "glucides"]); }
function isEnergyKcalKey(key: string) { return (key.includes("energy") && key.includes("kcal")) || key.includes("energie_kcal"); }

function sugarLimit(age: number) {
  if (age >= 13) return 100;
  if (age >= 8) return 75;
  if (age >= 4) return 60;
  return 100;
}

function fiberTarget(age: number) {
  if (age >= 18) return 30;
  if (age >= 11) return 25;
  if (age >= 7) return 20;
  return 15;
}

function magnesiumTarget(profile: UserProfile) {
  const age = profile.age;
  if (profile.physiologicalStatus !== "none") return 300;
  if (age >= 18) return profile.sex === "male" ? 380 : 300;
  if (age >= 15) return profile.sex === "male" ? 295 : 225;
  if (age >= 11) return 265;
  if (age >= 7) return 240;
  if (age >= 4) return 210;
  return 180;
}

function potassiumTarget(profile: UserProfile) {
  const age = profile.age;
  if (profile.physiologicalStatus === "lactating") return 4000;
  if (age >= 15) return 3500;
  if (age >= 11) return 2700;
  if (age >= 7) return 1800;
  if (age >= 4) return 1100;
  return 800;
}

function sodiumAdequateIntake(profile: UserProfile) {
  const age = profile.age;
  if (age >= 14) return 1500;
  if (age >= 9) return 1200;
  if (age >= 4) return 1000;
  return 800;
}

function sodiumUpperLimit(profile: UserProfile) {
  const age = profile.age;
  if (age >= 14) return 2300;
  if (age >= 9) return 1800;
  if (age >= 4) return 1500;
  return 1200;
}

function calciumTarget(profile: UserProfile) {
  const age = profile.age;
  if (age >= 25) return 950;
  if (age >= 18) return 1000;
  if (age >= 11) return 1150;
  if (age >= 4) return 800;
  return 450;
}

function seleniumTarget(profile: UserProfile) {
  if (profile.physiologicalStatus === "lactating") return 85;
  if (profile.age >= 15) return 70;
  if (profile.age >= 11) return 55;
  if (profile.age >= 7) return 35;
  if (profile.age >= 4) return 20;
  return 15;
}

function euReference(key: string): NutrientReference | null {
  const base = { source: "Règlement UE 1169/2011", basis: "Valeur de référence d’étiquetage" };
  if (isEnergyKcalKey(key)) return { ...base, target: 2000, unit: "kcal", role: "neutral" };
  if (isSugarKey(key)) return { ...base, target: 90, unit: "g", role: "limit" };
  if (isSaturatedFatKey(key)) return { ...base, target: 20, unit: "g", role: "limit" };
  if (isSaltKey(key)) return { ...base, target: 6, unit: "g", role: "limit" };
  if (isFatKey(key)) return { ...base, target: 70, unit: "g", role: "neutral" };
  if (isCarbohydrateKey(key)) return { ...base, target: 260, unit: "g", role: "neutral" };
  if (isProteinKey(key)) return { ...base, target: 50, unit: "g", role: "positive" };
  if (isFiberKey(key)) return { ...base, target: 25, unit: "g", role: "positive" };
  if (key.includes("potassium")) return { ...base, target: 2000, unit: "mg", role: "positive" };
  if (key.includes("magnesium") || key.includes("magnes")) return { ...base, target: 375, unit: "mg", role: "positive" };
  if (key.includes("calcium")) return { ...base, target: 800, unit: "mg", role: "positive" };
  if (key.includes("selenium")) return { ...base, target: 55, unit: "µg", role: "positive" };
  return null;
}

export function roleForNutrient(key: string): NutrientRole {
  const normalized = normalizedKey(key);
  if (isSugarKey(normalized) || isSaltKey(normalized) || isSodiumKey(normalized) || isSaturatedFatKey(normalized)) return "limit";
  if (isFiberKey(normalized) || isProteinKey(normalized) || includesAny(normalized, ["vitamin", "vitamine", "calcium", "iron", "fer", "magnesium", "magnes", "potassium", "selenium", "zinc"])) return "positive";
  return "neutral";
}

export function getReferenceForNutrient(key: string, input?: Partial<UserProfile> | null): NutrientReference | null {
  const profile = normalizeProfile(input);
  const normalized = normalizedKey(key);
  const macro = macroDistribution(profile);

  if (profile.referenceMode === "eu") return euReference(normalized);

  if (isEnergyKcalKey(normalized)) {
    return { target: macro.calories, unit: "kcal", role: "neutral", basis: "Besoin énergétique estimé depuis le profil", source: "Mifflin-St Jeor + niveau d’activité" };
  }

  if (isSugarKey(normalized)) return { target: sugarLimit(profile.age), unit: "g", role: "limit", basis: "Maximum sucres totaux hors lactose et galactose", source: "ANSES" };
  if (isFiberKey(normalized)) return { target: fiberTarget(profile.age), unit: "g", role: "positive", basis: "Repère fibres alimentaires", source: "ANSES / PNNS" };
  if (normalized.includes("potassium")) return { target: potassiumTarget(profile), unit: "mg", role: "positive", basis: "AS potassium selon l’âge et la situation physiologique", source: "ANSES" };
  if (normalized.includes("magnesium") || normalized.includes("magnes")) return { target: magnesiumTarget(profile), unit: "mg", role: "positive", basis: "AS magnésium selon l’âge et le sexe", source: "ANSES", upperLimit: 250, upperLimitLabel: "LSS compléments / magnésium ajouté", note: "La LSS ANSES du magnésium ne s’applique pas au magnésium naturellement présent dans les aliments." };

  if (isSodiumKey(normalized)) {
    const limit = sodiumUpperLimit(profile);
    return { target: limit, unit: "mg", role: "limit", basis: "LSS sodium", source: "ANSES", upperLimit: limit, upperLimitLabel: "Limite supérieure de sécurité", note: `AS sodium : ${sodiumAdequateIntake(profile)} mg/j` };
  }

  if (isSaltKey(normalized)) {
    const saltFromSodiumLimit = Math.round((sodiumUpperLimit(profile) * 2.54 / 1000) * 10) / 10;
    return { target: saltFromSodiumLimit, unit: "g", role: "limit", basis: "Conversion de la LSS sodium en équivalent sel", source: "ANSES" };
  }

  if (isSaturatedFatKey(normalized)) return { target: macro.saturatedFatLimitG, unit: "g", role: "limit", basis: "Repère indicatif : 10 % de l’énergie", source: "Profil nutritionnel" };
  if (isProteinKey(normalized)) return { target: macro.proteinG, unit: "g", role: "positive", basis: `${macro.proteinFactor} g/kg sur poids de référence ${macro.referenceWeightKg} kg`, source: "Profil nutritionnel" };
  if (isFatKey(normalized)) return { target: macro.fatG, unit: "g", role: "neutral", basis: `Repère indicatif : ${macro.fatPercent} % de l’énergie`, source: "Profil nutritionnel" };
  if (isCarbohydrateKey(normalized)) return { target: macro.carbG, unit: "g", role: "neutral", basis: `Repère indicatif : ${macro.carbPercent} % de l’énergie`, source: "Profil nutritionnel" };

  if (normalized.includes("calcium")) return { target: calciumTarget(profile), unit: "mg", role: "positive", basis: "RNP calcium selon l’âge", source: "ANSES", upperLimit: profile.age >= 18 ? 2500 : undefined, upperLimitLabel: profile.age >= 18 ? "LSS" : undefined };
  if (normalized.includes("selenium")) return { target: seleniumTarget(profile), unit: "µg", role: "positive", basis: "AS sélénium selon l’âge", source: "ANSES", upperLimit: profile.age >= 18 ? 255 : undefined, upperLimitLabel: profile.age >= 18 ? "LSS" : undefined };

  return null;
}

export function coveragePercent(value: number, target?: number | null) {
  if (!target) return null;
  return Math.max(0, Math.round((value / target) * 100));
}

export function formatAmount(value: number, unit: string) {
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${unit}`;
}

export function summarizeProfile(profileInput: Partial<UserProfile>) {
  const profile = normalizeProfile(profileInput);
  const bmi = computeBmi(profile.weightKg, profile.heightCm);
  const macro = macroDistribution(profile);
  return {
    profile,
    bmi,
    bmiLabel: bmiLabel(bmi),
    bmr: mifflin(profile),
    calories: macro.calories,
    macro,
    referenceModeLabel: referenceModes.find((mode) => mode.value === profile.referenceMode)?.label || "ANSES personnalisé"
  };
}

export function keyReferenceSummary(profileInput: Partial<UserProfile>): ReferenceSummaryItem[] {
  const profile = normalizeProfile(profileInput);
  return [
    { key: "energy_kcal", label: "Énergie", reference: getReferenceForNutrient("energy_kcal", profile) },
    { key: "protein_g", label: "Protéines", reference: getReferenceForNutrient("protein_g", profile) },
    { key: "carbohydrate_g", label: "Glucides", reference: getReferenceForNutrient("carbohydrate_g", profile) },
    { key: "fat_g", label: "Lipides", reference: getReferenceForNutrient("fat_g", profile) },
    { key: "saturated_fat_g", label: "Saturés", reference: getReferenceForNutrient("saturated_fat_g", profile) },
    { key: "sugars_g", label: "Sucres", reference: getReferenceForNutrient("sugars_g", profile) },
    { key: "fiber_g", label: "Fibres", reference: getReferenceForNutrient("fiber_g", profile) },
    { key: "magnesium_mg", label: "Magnésium", reference: getReferenceForNutrient("magnesium_mg", profile) },
    { key: "potassium_mg", label: "Potassium", reference: getReferenceForNutrient("potassium_mg", profile) },
    { key: "sodium_mg", label: "Sodium", reference: getReferenceForNutrient("sodium_mg", profile) }
  ];
}
