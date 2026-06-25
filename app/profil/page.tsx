"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activeEnergyTarget,
  getReferenceForNutrientWithEnergy,
  loadCustomEnergyTarget,
  saveCustomEnergyTarget
} from "../../lib/energy-reference";
import {
  activityLevels,
  defaultProfile,
  formatAmount,
  keyReferenceSummary,
  loadStoredProfile,
  normalizeProfile,
  objectiveOptions,
  referenceModes,
  saveStoredProfile,
  summarizeProfile,
  type ActivityLevel,
  type Objective,
  type PhysiologicalStatus,
  type ProfileSex,
  type ReferenceMode,
  type UserProfile
} from "../../lib/nutrition-profile";

const physiologicalOptions: Array<{ value: PhysiologicalStatus; label: string }> = [
  { value: "none", label: "Aucune" },
  { value: "pregnant", label: "Grossesse" },
  { value: "lactating", label: "Allaitement" }
];

function normalizeCustomEnergy(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(6000, Math.max(900, Math.round(numeric)));
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [customEnergyKcal, setCustomEnergyKcal] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadStoredProfile());
    setCustomEnergyKcal(loadCustomEnergyTarget());
  }, []);

  const summary = useMemo(() => summarizeProfile(profile), [profile]);
  const activeCalories = useMemo(() => activeEnergyTarget(profile, customEnergyKcal), [profile, customEnergyKcal]);
  const referenceSummary = useMemo(() => {
    return keyReferenceSummary(profile).map((item) => ({
      ...item,
      reference: getReferenceForNutrientWithEnergy(item.key, profile, customEnergyKcal)
    }));
  }, [profile, customEnergyKcal]);

  function updateNumber(field: "age" | "heightCm" | "weightKg", value: string) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, [field]: Number(value) }));
  }

  function updateCustomEnergy(value: string) {
    setSaved(false);
    setCustomEnergyKcal(normalizeCustomEnergy(value));
  }

  function updateSex(value: ProfileSex) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, sex: value }));
  }

  function updateActivity(value: ActivityLevel) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, activityLevel: value }));
  }

  function updateObjective(value: Objective) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, objective: value }));
  }

  function updatePhysiologicalStatus(value: PhysiologicalStatus) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, physiologicalStatus: value }));
  }

  function updateReferenceMode(value: ReferenceMode) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, referenceMode: value }));
  }

  function saveProfile() {
    const normalized = normalizeProfile(profile);
    saveStoredProfile(normalized);
    saveCustomEnergyTarget(customEnergyKcal);
    setProfile(normalized);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
          <a href="/#sources">Sources</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Profil nutritionnel</p>
          <h1>Définir les repères avant de lire les pourcentages.</h1>
          <p>
            L’âge, le sexe, la taille, le poids, l’activité et le référentiel choisi pilotent désormais les objectifs affichés dans les fiches aliments et le cumul journalier.
          </p>
          <div className="ctaRow">
            <button className="primaryCta" type="button" onClick={saveProfile}>{saved ? "Profil enregistré" : "Enregistrer le profil"}</button>
            <a className="secondaryCta" href="/search">Rechercher un aliment</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Résumé calculé</p>
          <div className="metricGrid">
            <div><span>IMC</span><strong>{summary.bmi.toFixed(1)}</strong><small>{summary.bmiLabel}</small></div>
            <div><span>Métabolisme</span><strong>{summary.bmr}</strong><small>kcal / jour</small></div>
            <div><span>Objectif calories</span><strong>{activeCalories}</strong><small>{customEnergyKcal ? "saisi manuellement" : "estimé depuis le profil"}</small></div>
            <div><span>Référentiel</span><strong className="metricText">{summary.referenceModeLabel}</strong><small>appliqué au cumul</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <form className="profileEditor" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
          <div>
            <p className="eyebrow">Étape 1</p>
            <h2>Mes données de base.</h2>
            <p>
              Ces données restent locales au navigateur pour cette première version. Les calories peuvent être estimées automatiquement ou fixées manuellement, par exemple à 1 800 kcal/j.
            </p>
          </div>

          <div className="formGrid">
            <label className="field"><span>Âge</span><input type="number" min="4" max="100" value={profile.age} onChange={(event) => updateNumber("age", event.currentTarget.value)} /></label>
            <label className="field"><span>Taille</span><input type="number" min="90" max="230" value={profile.heightCm} onChange={(event) => updateNumber("heightCm", event.currentTarget.value)} /><small>cm</small></label>
            <label className="field"><span>Poids</span><input type="number" min="25" max="250" step="0.1" value={profile.weightKg} onChange={(event) => updateNumber("weightKg", event.currentTarget.value)} /><small>kg</small></label>
            <label className="field"><span>Sexe</span><select value={profile.sex} onChange={(event) => updateSex(event.currentTarget.value as ProfileSex)}><option value="female">Femme</option><option value="male">Homme</option></select></label>
            <label className="field"><span>Activité</span><select value={profile.activityLevel} onChange={(event) => updateActivity(event.currentTarget.value as ActivityLevel)}>{activityLevels.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select></label>
            <label className="field"><span>Objectif</span><select value={profile.objective} onChange={(event) => updateObjective(event.currentTarget.value as Objective)}>{objectiveOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Situation</span><select value={profile.physiologicalStatus} disabled={profile.sex !== "female"} onChange={(event) => updatePhysiologicalStatus(event.currentTarget.value as PhysiologicalStatus)}>{physiologicalOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Référentiel</span><select value={profile.referenceMode} onChange={(event) => updateReferenceMode(event.currentTarget.value as ReferenceMode)}>{referenceModes.map((mode) => <option value={mode.value} key={mode.value}>{mode.label}</option>)}</select></label>
            <label className="field"><span>Calories personnalisées</span><input type="number" min="900" max="6000" placeholder={`${summary.calories}`} value={customEnergyKcal ?? ""} onChange={(event) => updateCustomEnergy(event.currentTarget.value)} /><small>vide = estimation automatique</small></label>
          </div>

          <button className="primaryCta" type="submit">{saved ? "Profil enregistré" : "Sauvegarder et appliquer"}</button>
        </form>

        <div className="referencePreview">
          <p className="eyebrow">Repères actifs</p>
          <h2>Les VNR changent avec le profil.</h2>
          <div className="referenceList">
            {referenceSummary.map((item) => (
              <article key={item.key}>
                <span>{item.label}</span>
                <strong>{item.reference ? formatAmount(item.reference.target, item.reference.unit) : "-"}</strong>
                <small>{item.reference ? `${item.reference.basis} · ${item.reference.source}` : "Non renseigné"}</small>
              </article>
            ))}
          </div>
          <div className="sourceNote">
            <strong>Lecture importante</strong>
            <p>
              Le cumul énergétique se compare à l’objectif calories actif. Si 1 800 kcal/j est saisi, 900 kcal consommées représentent 50 % de la journée.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
