function calculateFoodIntake(portions) {
  return portions.reduce((total, item) => {
    const valuePer100g = Number(item.value_per_100g || 0);
    const portionG = Number(item.portion_g || 0);
    return total + (valuePer100g * portionG) / 100;
  }, 0);
}

function selectReferenceTarget({ nutrientId, profile, vnrValues, profileReferences = [] }) {
  const profileMatch = profileReferences.find((reference) => {
    return reference.nutrient_id === nutrientId && matchesProfile(reference, profile);
  });

  if (profileMatch) {
    return { ...profileMatch, selected_reference_type: 'profile' };
  }

  const vnr = vnrValues.find((reference) => reference.id === nutrientId || reference.nutrient_id === nutrientId);
  if (!vnr) {
    return null;
  }

  return { ...vnr, selected_reference_type: 'eu_vnr' };
}

function matchesProfile(reference, profile) {
  if (!profile) return false;
  if (reference.sex && reference.sex !== profile.sex) return false;
  if (reference.pregnancy !== undefined && reference.pregnancy !== profile.pregnancy) return false;
  if (reference.lactation !== undefined && reference.lactation !== profile.lactation) return false;
  if (reference.age_min_years !== undefined && profile.age_years < reference.age_min_years) return false;
  if (reference.age_max_years !== undefined && profile.age_years > reference.age_max_years) return false;
  return true;
}

function calculateGap({ nutrientId, unit, portions, profile, vnrValues, profileReferences = [], supplement, upperLimit }) {
  const target = selectReferenceTarget({ nutrientId, profile, vnrValues, profileReferences });
  if (!target) {
    return {
      nutrient_id: nutrientId,
      status: 'missing_reference',
      warnings: ['No official reference target available for this nutrient.'],
    };
  }

  const foodIntake = calculateFoodIntake(portions);
  const targetAmount = Number(target.amount);
  const gap = Math.max(targetAmount - foodIntake, 0);
  const coveragePercent = targetAmount > 0 ? (foodIntake / targetAmount) * 100 : null;

  const result = {
    nutrient_id: nutrientId,
    unit: unit || target.unit,
    target: targetAmount,
    reference_type: target.selected_reference_type,
    food_intake: foodIntake,
    gap,
    coverage_percent: coveragePercent,
    warnings: ['Informational calculation only. Not medical advice.'],
  };

  if (supplement && gap > 0) {
    const amountPerServing = Number(supplement.amount_per_serving || 0);
    result.supplement_equivalent = amountPerServing > 0
      ? {
          servings_needed: gap / amountPerServing,
          label: 'theoretical',
          source: 'product_label',
        }
      : null;
  }

  if (upperLimit) {
    const projectedTotal = foodIntake + (supplement ? Number(supplement.amount_per_serving || 0) : 0);
    result.upper_limit_check = {
      upper_limit: Number(upperLimit.amount),
      projected_total: projectedTotal,
      exceeds_upper_limit: projectedTotal > Number(upperLimit.amount),
    };
  } else {
    result.warnings.push('No official upper intake limit provided for this calculation.');
  }

  return result;
}

module.exports = {
  calculateFoodIntake,
  selectReferenceTarget,
  calculateGap,
};
