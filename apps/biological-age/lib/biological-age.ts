export type SportType =
  | "none"
  | "walking"
  | "running"
  | "cycling"
  | "swimming"
  | "racket"
  | "team"
  | "strength"
  | "fitness"
  | "yoga"
  | "other";
export type SocialPractice = "solo" | "pair" | "group" | "club";
export type InjuryStatus = "none" | "light" | "frequent" | "limited";
export type SleepQuality = "good" | "average" | "poor";
export type TobaccoStatus = "never" | "former" | "nicotine" | "current";
export type Frequency = "rare" | "some" | "frequent" | "daily";
export type EnergyStability = "stable" | "variable" | "crash" | "unknown";
export type ChangeStatus = "none" | "slight" | "clear" | "unknown";
export type Confidence = "low" | "medium" | "good";

export type Profile = {
  age: number;
  heightCm: number;
  weightKg: number;
  waistCm: number | null;
};

export type Questionnaire = {
  sportType: SportType;
  moderateMinutes: number | null;
  vigorousMinutes: number | null;
  strengthSessions: number | null;
  mobilitySessions: number | null;
  sittingHours: number | null;
  sportYears: number | null;
  socialPractice: SocialPractice;
  injuries: InjuryStatus;
  sleepHours: number | null;
  sleepQuality: SleepQuality;
  stressLevel: number | null;
  fatigueLevel: number | null;
  energyStability: EnergyStability;
  appetiteChange: ChangeStatus;
  unintentionalWeightLoss: ChangeStatus;
  emotionalEating: Frequency;
  tobacco: TobaccoStatus;
  alcoholDrinksPerWeek: number | null;
  fruitVegServingsPerDay: number | null;
  legumesPerWeek: number | null;
  wholeGrains: Frequency;
  ultraProcessed: Frequency;
  sugaryDrinksPerWeek: number | null;
  proteinAtMeals: Frequency;
  nutsSeedsPerWeek: number | null;
  fattyFishPerWeek: number | null;
  processedMeatPerWeek: number | null;
  systolic: number | null;
  diastolic: number | null;
  restingHeartRate: number | null;
};

export type ComponentKey =
  | "nutrition"
  | "activity"
  | "sedentary"
  | "sleep"
  | "stressRecovery"
  | "tobacco"
  | "alcohol"
  | "morphology"
  | "vitals";

export type FactorKey =
  | "regularActivity"
  | "protectiveNutrition"
  | "lowTobaccoExposure"
  | "highSedentaryTime"
  | "tobaccoOrNicotine"
  | "poorSleep"
  | "frequentUltraProcessed"
  | "highAlcohol"
  | "highFatigue"
  | "intenseStress"
  | "appetiteOrWeightChange";

export type AssessmentResult = {
  chronologicalAge: number;
  biologicalAgeYears: number;
  biologicalAgeMonths: number;
  deltaMonths: number;
  score: number;
  confidence: Confidence;
  components: Array<{ key: ComponentKey; score: number; max: number }>;
  favorable: FactorKey[];
  unfavorable: FactorKey[];
};

export const defaultProfile: Profile = {
  age: 38,
  heightCm: 175,
  weightKg: 72,
  waistCm: null
};

export const defaultQuestionnaire: Questionnaire = {
  sportType: "walking",
  moderateMinutes: 150,
  vigorousMinutes: 0,
  strengthSessions: 1,
  mobilitySessions: 1,
  sittingHours: 8,
  sportYears: 1,
  socialPractice: "solo",
  injuries: "none",
  sleepHours: 7,
  sleepQuality: "average",
  stressLevel: 5,
  fatigueLevel: 4,
  energyStability: "unknown",
  appetiteChange: "none",
  unintentionalWeightLoss: "none",
  emotionalEating: "some",
  tobacco: "never",
  alcoholDrinksPerWeek: 0,
  fruitVegServingsPerDay: 4,
  legumesPerWeek: 2,
  wholeGrains: "some",
  ultraProcessed: "some",
  sugaryDrinksPerWeek: 0,
  proteinAtMeals: "some",
  nutsSeedsPerWeek: 2,
  fattyFishPerWeek: 1,
  processedMeatPerWeek: 1,
  systolic: null,
  diastolic: null,
  restingHeartRate: null
};

const sportValues: readonly SportType[] = ["none", "walking", "running", "cycling", "swimming", "racket", "team", "strength", "fitness", "yoga", "other"];
const socialValues: readonly SocialPractice[] = ["solo", "pair", "group", "club"];
const injuryValues: readonly InjuryStatus[] = ["none", "light", "frequent", "limited"];
const sleepValues: readonly SleepQuality[] = ["good", "average", "poor"];
const tobaccoValues: readonly TobaccoStatus[] = ["never", "former", "nicotine", "current"];
const frequencyValues: readonly Frequency[] = ["rare", "some", "frequent", "daily"];
const energyValues: readonly EnergyStability[] = ["stable", "variable", "crash", "unknown"];
const changeValues: readonly ChangeStatus[] = ["none", "slight", "clear", "unknown"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number, decimals = 0) {
  const numeric = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return fallback;
  const factor = 10 ** decimals;
  return Math.round(clamp(numeric, min, max) * factor) / factor;
}

function numberOrNull(value: unknown, min: number, max: number, decimals = 0) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(numeric)) return null;
  const factor = 10 ** decimals;
  return Math.round(clamp(numeric, min, max) * factor) / factor;
}

function optionValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeProfile(input?: Partial<Profile> | null): Profile {
  return {
    age: Math.round(finiteNumber(input?.age, defaultProfile.age, 18, 100)),
    heightCm: Math.round(finiteNumber(input?.heightCm, defaultProfile.heightCm, 120, 230)),
    weightKg: finiteNumber(input?.weightKg, defaultProfile.weightKg, 30, 250, 1),
    waistCm: numberOrNull(input?.waistCm, 45, 180, 1)
  };
}

export function normalizeQuestionnaire(input?: Partial<Questionnaire> | null): Questionnaire {
  return {
    sportType: optionValue(input?.sportType, sportValues, defaultQuestionnaire.sportType),
    moderateMinutes: numberOrNull(input?.moderateMinutes, 0, 2000),
    vigorousMinutes: numberOrNull(input?.vigorousMinutes, 0, 1200),
    strengthSessions: numberOrNull(input?.strengthSessions, 0, 14),
    mobilitySessions: numberOrNull(input?.mobilitySessions, 0, 14),
    sittingHours: numberOrNull(input?.sittingHours, 0, 18, 1),
    sportYears: numberOrNull(input?.sportYears, 0, 80),
    socialPractice: optionValue(input?.socialPractice, socialValues, defaultQuestionnaire.socialPractice),
    injuries: optionValue(input?.injuries, injuryValues, defaultQuestionnaire.injuries),
    sleepHours: numberOrNull(input?.sleepHours, 3, 12, 1),
    sleepQuality: optionValue(input?.sleepQuality, sleepValues, defaultQuestionnaire.sleepQuality),
    stressLevel: numberOrNull(input?.stressLevel, 0, 10),
    fatigueLevel: numberOrNull(input?.fatigueLevel, 0, 10),
    energyStability: optionValue(input?.energyStability, energyValues, defaultQuestionnaire.energyStability),
    appetiteChange: optionValue(input?.appetiteChange, changeValues, defaultQuestionnaire.appetiteChange),
    unintentionalWeightLoss: optionValue(input?.unintentionalWeightLoss, changeValues, defaultQuestionnaire.unintentionalWeightLoss),
    emotionalEating: optionValue(input?.emotionalEating, frequencyValues, defaultQuestionnaire.emotionalEating),
    tobacco: optionValue(input?.tobacco, tobaccoValues, defaultQuestionnaire.tobacco),
    alcoholDrinksPerWeek: numberOrNull(input?.alcoholDrinksPerWeek, 0, 80),
    fruitVegServingsPerDay: numberOrNull(input?.fruitVegServingsPerDay, 0, 12, 1),
    legumesPerWeek: numberOrNull(input?.legumesPerWeek, 0, 21),
    wholeGrains: optionValue(input?.wholeGrains, frequencyValues, defaultQuestionnaire.wholeGrains),
    ultraProcessed: optionValue(input?.ultraProcessed, frequencyValues, defaultQuestionnaire.ultraProcessed),
    sugaryDrinksPerWeek: numberOrNull(input?.sugaryDrinksPerWeek, 0, 50),
    proteinAtMeals: optionValue(input?.proteinAtMeals, frequencyValues, defaultQuestionnaire.proteinAtMeals),
    nutsSeedsPerWeek: numberOrNull(input?.nutsSeedsPerWeek, 0, 21),
    fattyFishPerWeek: numberOrNull(input?.fattyFishPerWeek, 0, 14),
    processedMeatPerWeek: numberOrNull(input?.processedMeatPerWeek, 0, 21),
    systolic: numberOrNull(input?.systolic, 70, 240),
    diastolic: numberOrNull(input?.diastolic, 40, 140),
    restingHeartRate: numberOrNull(input?.restingHeartRate, 35, 220)
  };
}

function scoreActivity(q: Questionnaire) {
  const equivalent = (q.moderateMinutes || 0) + (q.vigorousMinutes || 0) * 2;
  let score = equivalent >= 300 ? 9 : equivalent >= 150 ? 8 : equivalent >= 75 ? 5 : equivalent > 0 ? 2 : 0;
  score += clamp((q.strengthSessions || 0) * 2, 0, 4);
  score += clamp(q.mobilitySessions || 0, 0, 2);
  const sportBonus: Record<SportType, number> = {
    none: 0,
    walking: 1,
    running: 1.5,
    cycling: 1.5,
    swimming: 2,
    racket: 3,
    team: 2.5,
    strength: 1.5,
    fitness: 2,
    yoga: 1,
    other: 1
  };
  score += sportBonus[q.sportType];
  if (q.socialPractice === "group" || q.socialPractice === "club") score += 1;
  if ((q.sportYears || 0) >= 5) score += 1;
  if (q.injuries === "frequent") score -= 2;
  if (q.injuries === "limited") score -= 4;
  return clamp(score, 0, 20);
}

function scoreSedentary(q: Questionnaire) {
  const hours = q.sittingHours ?? 8;
  if (hours <= 5) return 10;
  if (hours <= 8) return 7;
  if (hours <= 10) return 4;
  return 1;
}

function scoreSleep(q: Questionnaire) {
  const hours = q.sleepHours ?? 7;
  let score = hours >= 7 && hours <= 9 ? 7 : hours >= 6 && hours < 10 ? 5 : 2;
  if (q.sleepQuality === "good") score += 3;
  if (q.sleepQuality === "average") score += 1;
  return clamp(score, 0, 10);
}

function scoreStressRecovery(q: Questionnaire) {
  const stress = q.stressLevel ?? 5;
  const fatigue = q.fatigueLevel ?? 4;
  let score = 10;
  if (stress >= 8) score -= 4;
  else if (stress >= 6) score -= 2;
  else if (stress <= 3) score += 1;
  if (fatigue >= 8) score -= 4;
  else if (fatigue >= 6) score -= 2;
  if (q.energyStability === "stable") score += 1;
  if (q.energyStability === "crash") score -= 2;
  if (q.emotionalEating === "frequent" || q.emotionalEating === "daily") score -= 2;
  return clamp(score, 0, 10);
}

function scoreTobacco(q: Questionnaire) {
  if (q.tobacco === "never") return 12;
  if (q.tobacco === "former") return 9;
  if (q.tobacco === "nicotine") return 5;
  return 0;
}

function scoreAlcohol(q: Questionnaire) {
  const drinks = q.alcoholDrinksPerWeek ?? 0;
  if (drinks === 0) return 6;
  if (drinks <= 7) return 5;
  if (drinks <= 14) return 3;
  return 1;
}

function computeBmi(weightKg: number, heightCm: number) {
  return weightKg / (heightCm / 100) ** 2;
}

function scoreMorphology(profile: Profile) {
  const bmi = computeBmi(profile.weightKg, profile.heightCm);
  let score = bmi >= 18.5 && bmi < 25 ? 7 : bmi >= 25 && bmi < 30 ? 4 : 2;
  if (profile.waistCm) {
    const waistToHeight = profile.waistCm / profile.heightCm;
    if (waistToHeight < 0.5) score += 3;
    else if (waistToHeight < 0.6) score += 1;
  } else {
    score += 1;
  }
  return clamp(score, 0, 10);
}

function scoreNutrition(q: Questionnaire) {
  let score = 0;
  const fruitVeg = q.fruitVegServingsPerDay ?? 0;
  if (fruitVeg >= 5) score += 6;
  else if (fruitVeg >= 3) score += 4;
  else if (fruitVeg >= 1) score += 2;
  if ((q.legumesPerWeek || 0) >= 3) score += 4;
  else if ((q.legumesPerWeek || 0) >= 1) score += 2;
  if (q.wholeGrains === "daily") score += 4;
  else if (q.wholeGrains === "frequent") score += 3;
  else if (q.wholeGrains === "some") score += 1;
  if (q.ultraProcessed === "rare") score += 5;
  else if (q.ultraProcessed === "some") score += 3;
  else if (q.ultraProcessed === "frequent") score += 1;
  if ((q.sugaryDrinksPerWeek || 0) === 0) score += 3;
  else if ((q.sugaryDrinksPerWeek || 0) <= 2) score += 1;
  if (q.proteinAtMeals === "daily") score += 3;
  else if (q.proteinAtMeals === "frequent") score += 2;
  else if (q.proteinAtMeals === "some") score += 1;
  if ((q.nutsSeedsPerWeek || 0) >= 5) score += 3;
  else if ((q.nutsSeedsPerWeek || 0) >= 2) score += 2;
  if ((q.fattyFishPerWeek || 0) >= 2) score += 3;
  else if ((q.fattyFishPerWeek || 0) >= 1) score += 1;
  const processed = q.processedMeatPerWeek ?? 0;
  if (processed === 0) score += 4;
  else if (processed <= 1) score += 2;
  if (q.appetiteChange === "clear" || q.unintentionalWeightLoss === "clear") score -= 4;
  else if (q.appetiteChange === "slight" || q.unintentionalWeightLoss === "slight") score -= 2;
  return clamp(score, 0, 35);
}

function scoreVitals(q: Questionnaire) {
  let score = 0;
  if (q.systolic && q.diastolic) {
    if (q.systolic < 120 && q.diastolic < 80) score += 4;
    else if (q.systolic < 130 && q.diastolic < 85) score += 3;
    else if (q.systolic < 140 && q.diastolic < 90) score += 2;
  } else {
    score += 2;
  }
  if (q.restingHeartRate !== null) {
    if (q.restingHeartRate >= 50 && q.restingHeartRate <= 70) score += 3;
    else if (q.restingHeartRate < 85) score += 2;
    else score += 1;
  } else {
    score += 1;
  }
  return clamp(score, 0, 7);
}

function deltaMonthsFromScore(score: number) {
  const anchors = [
    { score: 100, deltaMonths: -72 },
    { score: 90, deltaMonths: -72 },
    { score: 80, deltaMonths: -48 },
    { score: 70, deltaMonths: -24 },
    { score: 60, deltaMonths: 0 },
    { score: 50, deltaMonths: 24 },
    { score: 40, deltaMonths: 48 },
    { score: 0, deltaMonths: 84 }
  ];
  for (let index = 1; index < anchors.length; index += 1) {
    const high = anchors[index - 1];
    const low = anchors[index];
    if (score >= low.score) {
      const span = high.score - low.score || 1;
      const ratio = (score - low.score) / span;
      return Math.round(low.deltaMonths + (high.deltaMonths - low.deltaMonths) * ratio);
    }
  }
  return 84;
}

function confidence(q: Questionnaire): Confidence {
  const optionalFilled = [q.systolic, q.diastolic, q.restingHeartRate].filter((value) => value !== null).length;
  const activityFilled = q.moderateMinutes !== null || q.vigorousMinutes !== null;
  const globalFilled = q.fatigueLevel !== null && q.stressLevel !== null;
  if (optionalFilled >= 3 && activityFilled && globalFilled) return "good";
  if (activityFilled && globalFilled) return "medium";
  return "low";
}

export function calculateBiologicalAge(profileInput: Partial<Profile>, questionnaireInput?: Partial<Questionnaire> | null): AssessmentResult {
  const profile = normalizeProfile(profileInput);
  const q = normalizeQuestionnaire(questionnaireInput || defaultQuestionnaire);
  const components: AssessmentResult["components"] = [
    { key: "nutrition", score: scoreNutrition(q), max: 35 },
    { key: "activity", score: scoreActivity(q), max: 20 },
    { key: "sedentary", score: scoreSedentary(q), max: 10 },
    { key: "sleep", score: scoreSleep(q), max: 10 },
    { key: "stressRecovery", score: scoreStressRecovery(q), max: 10 },
    { key: "tobacco", score: scoreTobacco(q), max: 12 },
    { key: "alcohol", score: scoreAlcohol(q), max: 6 },
    { key: "morphology", score: scoreMorphology(profile), max: 10 },
    { key: "vitals", score: scoreVitals(q), max: 7 }
  ];
  const rawScore = components.reduce((sum, item) => sum + item.score, 0);
  const maxScore = components.reduce((sum, item) => sum + item.max, 0);
  const score = clamp(Math.round((rawScore / maxScore) * 100), 0, 100);
  const deltaMonths = deltaMonthsFromScore(score);
  const totalBiologicalMonths = Math.round(clamp(profile.age * 12 + deltaMonths, 18 * 12, 100 * 12));
  const favorable: FactorKey[] = [];
  const unfavorable: FactorKey[] = [];
  if (scoreActivity(q) >= 15) favorable.push("regularActivity");
  if (scoreNutrition(q) >= 25) favorable.push("protectiveNutrition");
  if (q.tobacco === "never" || q.tobacco === "former") favorable.push("lowTobaccoExposure");
  if ((q.sittingHours || 0) > 8) unfavorable.push("highSedentaryTime");
  if (q.tobacco === "current" || q.tobacco === "nicotine") unfavorable.push("tobaccoOrNicotine");
  if ((q.sleepHours || 7) < 6 || q.sleepQuality === "poor") unfavorable.push("poorSleep");
  if (q.ultraProcessed === "daily" || q.ultraProcessed === "frequent") unfavorable.push("frequentUltraProcessed");
  if ((q.alcoholDrinksPerWeek || 0) > 14) unfavorable.push("highAlcohol");
  if ((q.fatigueLevel || 0) >= 7) unfavorable.push("highFatigue");
  if ((q.stressLevel || 0) >= 8) unfavorable.push("intenseStress");
  if (q.appetiteChange === "clear" || q.unintentionalWeightLoss === "clear") unfavorable.push("appetiteOrWeightChange");
  return {
    chronologicalAge: profile.age,
    biologicalAgeYears: Math.floor(totalBiologicalMonths / 12),
    biologicalAgeMonths: totalBiologicalMonths % 12,
    deltaMonths,
    score,
    confidence: confidence(q),
    components,
    favorable,
    unfavorable
  };
}
