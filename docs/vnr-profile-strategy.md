# VNR profile strategy

NutriAtlas starts from EU VNR values for the regulatory layer, then refines targets with official profile based nutrition references when available.

Hierarchy:

1. EU VNR values for labelling and adult default comparison.
2. Official profile references by age, sex, pregnancy or lactation.
3. Official upper limits when available.

VNR values are used for supplement labels, reference intake percentages and adult default mode. They are not personalized targets.

Required profile fields:

- age_years
- sex
- pregnancy
- lactation
- country
- reference_mode

Calculation rule:

- default target equals EU VNR;
- if a valid profile reference exists, target equals the profile reference;
- output must state which reference was used.

Safety rule:

If a supplement equivalent is calculated, NutriAtlas checks the official upper limit when available. If no official upper limit is available, the response must say so.

Commercial rule:

Commercial products are evaluated only after the scientific calculation. Product ranking must never modify the gap calculation.
