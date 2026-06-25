"use client";

import { useMemo, useState } from "react";

const scenarios = [
  "Perte de poids progressive",
  "Maintien et énergie stable",
  "Performance et récupération",
  "Longévité et prévention"
];

const activityFactors = {
  low: { label: "Faible", factor: 1.3 },
  moderate: { label: "Modérée", factor: 1.5 },
  high: { label: "Élevée", factor: 1.75 }
};

const objectiveAdjustments = {
  loss: { label: "Perte progressive", kcal: -300 },
  maintain: { label: "Maintien", kcal: 0 },
  performance: { label: "Performance", kcal: 250 }
};

type Sex = "female" | "male";
type Activity = keyof typeof activityFactors;
type Objective = keyof typeof objectiveAdjustments;

function computeBmi(weightKg: number, heightCm: number) {
  if (heightCm <= 0) return 0;
  return weightKg / Math.pow(heightCm / 100, 2);
}

function bmiLabel(bmi: number) {
  if (bmi <= 0) return "À calculer";
  if (bmi < 18.5) return "Poids bas";
  if (bmi < 25) return "Zone de référence";
  if (bmi < 30) return "Surpoids";
  return "Obésité";
}

function mifflin(age: number, heightCm: number, weightKg: number, sex: Sex) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === "male" ? 5 : -161));
}

export default function ProfilePage() {
  const [age, setAge] = useState(38);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(72);
  const [sex, setSex] = useState<Sex>("male");
  const [activity, setActivity] = useState<Activity>("moderate");
  const [objective, setObjective] = useState<Objective>("maintain");

  const metrics = useMemo(() => {
    const bmi = computeBmi(weight, height);
    const bmr = mifflin(age, height, weight, sex);
    const calories = Math.max(1200, Math.round(bmr * activityFactors[activity].factor + objectiveAdjustments[objective].kcal));
    const protein = Math.round(weight * (objective === "performance" ? 1.6 : 1.2));
    const fiber = 30;
    const longevityAge = Math.max(18, Math.round(age - (bmi >= 18.5 && bmi < 25 ? 2 : 0)));

    return { bmi, bmr, calories, protein, fiber, longevityAge };
  }, [activity, age, height, objective, sex, weight]);

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
          <a href="/profil">Profil</a>
          <a href="/#sources">Sources</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Profil initial</p>
          <h1>Âge, taille, poids, besoins et axe longévité.</h1>
          <p>
            Cette page calcule une estimation explicative : IMC, dépense de base, besoin énergétique,
            priorité nutritionnelle et repères simples. Les résultats restent non médicaux.
          </p>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Calcul personnalisé</p>
          <div className="metricGrid">
            <div><span>IMC</span><strong>{metrics.bmi.toFixed(1)}</strong><small>{bmiLabel(metrics.bmi)}</small></div>
            <div><span>Métabolisme</span><strong>{metrics.bmr}</strong><small>kcal / jour</small></div>
            <div><span>Besoin estimé</span><strong>{metrics.calories}</strong><small>kcal / jour</small></div>
            <div><span>Âge longévité</span><strong>{metrics.longevityAge}</strong><small>estimation prudente</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <div>
          <p className="eyebrow">Entrées profil</p>
          <h2>Renseigner le profil.</h2>
          <p>
            Les valeurs restent dans la page pour l’instant. La prochaine étape sera de les relier au cumul et aux recommandations.
          </p>
        </div>

        <div className="scenarioGrid">
          <article>
            <label htmlFor="age">Âge</label>
            <input id="age" type="number" min="16" max="100" value={age} onChange={(event) => setAge(Number(event.target.value))} />
          </article>
          <article>
            <label htmlFor="height">Taille cm</label>
            <input id="height" type="number" min="120" max="230" value={height} onChange={(event) => setHeight(Number(event.target.value))} />
          </article>
          <article>
            <label htmlFor="weight">Poids kg</label>
            <input id="weight" type="number" min="35" max="250" value={weight} onChange={(event) => setWeight(Number(event.target.value))} />
          </article>
          <article>
            <label htmlFor="sex">Sexe biologique</label>
            <select id="sex" value={sex} onChange={(event) => setSex(event.target.value as Sex)}>
              <option value="female">Femme</option>
              <option value="male">Homme</option>
            </select>
          </article>
          <article>
            <label htmlFor="activity">Activité</label>
            <select id="activity" value={activity} onChange={(event) => setActivity(event.target.value as Activity)}>
              {Object.entries(activityFactors).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </article>
          <article>
            <label htmlFor="objective">Objectif</label>
            <select id="objective" value={objective} onChange={(event) => setObjective(event.target.value as Objective)}>
              {Object.entries(objectiveAdjustments).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </article>
        </div>
      </section>

      <section className="pageSection profileFormPreview">
        <div>
          <p className="eyebrow">Repères dérivés</p>
          <h2>Priorités nutritionnelles.</h2>
          <p>
            Objectif protéique indicatif : {metrics.protein} g/jour. Fibres : {metrics.fiber} g/jour.
            Ces repères serviront ensuite à contextualiser le cumul alimentaire.
          </p>
        </div>
        <div className="scenarioGrid">
          {scenarios.map((scenario) => (
            <article key={scenario}>
              <strong>{scenario}</strong>
              <span>Score, besoins et priorités alimentaires.</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
