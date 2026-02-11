import Anthropic from '@anthropic-ai/sdk';
import { cacheGet, cacheSet } from '../utils/cache';
import type { TargetProfile } from '../types/target-profile';

const client = new Anthropic();

export function buildProfileSummary(profile: TargetProfile): string {
  const dims = profile.scores.dimensions;
  const rawOpen = profile.rawData.openTargets.data;
  const rawChembl = profile.rawData.chembl.data;
  const rawPubmed = profile.rawData.pubmed.data;
  const rawCT = profile.rawData.clinicalTrials.data;
  const rawBiorxiv = profile.rawData.biorxiv.data;
  const rawAlpha = profile.rawData.alphafold.data;
  const rawAG = profile.rawData.alphagenome.data;

  return `
TARGET: ${profile.gene} (${profile.approvedName})
Ensembl ID: ${profile.ensemblId}
UniProt ID: ${profile.uniprotId}

OVERALL SCORE: ${profile.scores.overall}/100

DIMENSION SCORES:
- Genetic Evidence: ${dims.geneticEvidence.score}/100 — ${dims.geneticEvidence.description}
- Chemical Tractability: ${dims.chemicalTractability.score}/100 — ${dims.chemicalTractability.description}
- Structural Readiness: ${dims.structuralReadiness.score}/100 — ${dims.structuralReadiness.description}
- Clinical History: ${dims.clinicalHistory.score}/100 — ${dims.clinicalHistory.description}
- Regulatory Genomics: ${dims.regulatoryGenomics.score}/100 — ${dims.regulatoryGenomics.description}
- Literature Depth: ${dims.literatureDepth.score}/100 — ${dims.literatureDepth.description}
- Innovation Signal: ${dims.innovationSignal.score}/100 — ${dims.innovationSignal.description}

RAW DATA HIGHLIGHTS:
- Disease associations: ${rawOpen?.diseaseAssociationCount ?? 0}
- Top disease: ${rawOpen?.topDiseaseAssociations?.[0]?.diseaseName ?? 'N/A'} (score: ${rawOpen?.topDiseaseAssociations?.[0]?.score?.toFixed(2) ?? 'N/A'})
- Tractability: ${rawOpen?.tractability?.filter(t => t.value).map(t => t.modality).join(', ') || 'None confirmed'}
- Compounds: ${rawChembl?.compoundCount ?? 0}, max phase: ${rawChembl?.maxClinicalPhase ?? 0}
- Bioactivities (pChEMBL≥6): ${rawChembl?.bioactivityCount ?? 0}
- PDB structures: ${rawAlpha?.pdbCount ?? 0}, AlphaFold pLDDT: ${rawAlpha?.avgPLDDT?.toFixed(1) ?? 'N/A'}
- Clinical trials: ${rawCT?.totalTrials ?? 0} total, ${rawCT?.activeTrials ?? 0} recruiting
- Publications: ${rawPubmed?.totalPublications?.toLocaleString() ?? 0} total, ${rawPubmed?.recentPublications?.toLocaleString() ?? 0} recent
- Preprints (90d): ${rawBiorxiv?.preprints90d ?? 0}, trend: ${rawBiorxiv?.velocityTrend ?? 'unknown'}
- Regulatory features (AlphaGenome): ${rawAG?.regulatoryFeatureCount ?? 0} total, ${rawAG?.enhancerCount ?? 0} enhancers, ${rawAG?.promoterCount ?? 0} promoters, ${rawAG?.ctcfCount ?? 0} CTCF sites
- Constrained elements: ${rawAG?.constrainedElementCount ?? 0}, regulatory complexity: ${rawAG?.regulatoryComplexity ?? 'unknown'}
- Transcripts: ${rawAG?.transcriptCount ?? 0}, expression breadth: ${rawAG?.expressionBreadth ?? 0}%

TOP COMPOUNDS:
${(rawChembl?.topCompounds ?? []).map(c =>
  `  - ${c.chemblId} (${c.preferredName ?? 'unnamed'}): Phase ${c.maxPhase}, MW=${c.molecularWeight?.toFixed(0) ?? 'N/A'}, LogP=${c.alogp?.toFixed(1) ?? 'N/A'}, TPSA=${c.psa?.toFixed(0) ?? 'N/A'}, HBA=${c.hba ?? 'N/A'}, HBD=${c.hbd ?? 'N/A'}, RO5 violations=${c.numRo5Violations ?? 'N/A'}, pChEMBL=${c.pchemblValue?.toFixed(1) ?? 'N/A'} (${c.activityType ?? 'N/A'})`
).join('\n') || '  No compound details available'}

CLINICAL TRIAL DETAILS:
- Trials by status: ${Object.entries(rawCT?.trialsByStatus ?? {}).map(([k, v]) => `${k}:${v}`).join(', ') || 'N/A'}
- Top sponsors: ${rawCT?.sponsorTrialCounts?.slice(0, 5).map(s => `${s.sponsor}(${s.count})`).join(', ') || 'N/A'}
`.trim();
}

export function buildNarrativePrompt(profile: TargetProfile): string {
  return `You are a senior drug discovery scientist writing a target intelligence brief. Given the following comprehensive data across 7 dimensions for ${profile.gene}, write a 3-paragraph expert analysis that:

(1) Synthesizes the most important findings across dimensions, connecting data points that reveal insights not obvious from any single dimension. Reference specific numbers.
(2) Identifies key risks, opportunities, and any paradoxes in the data (e.g., high genetic evidence but low chemical tractability).
(3) Provides a clear recommendation on target prioritization with specific reasoning.

Write as a scientist, not a chatbot. Be direct, insightful, and specific. No disclaimers or hedging.

${buildProfileSummary(profile)}`;
}

export async function generateTargetNarrative(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-narrative-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: buildNarrativePrompt(profile),
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateComparisonAnalysis(
  profileA: TargetProfile,
  profileB: TargetProfile
): Promise<string> {
  const cacheKey = `ai-compare-${profileA.gene}-${profileB.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a senior drug discovery scientist comparing two drug targets. Write a 3-paragraph comparative analysis that:

(1) Identifies the key differences between the two targets across all dimensions, citing specific data.
(2) Explains which target is more promising for drug development and why, with nuanced reasoning.
(3) Describes scenarios where each target might be preferred (e.g., different therapeutic areas, different risk tolerances).

Be direct and specific. Reference actual numbers from the data.

TARGET A:
${buildProfileSummary(profileA)}

TARGET B:
${buildProfileSummary(profileB)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export interface NextStepsResult {
  steps: string[];
  comparisons: Array<{ gene: string; reason: string }>;
}

export async function generateNextSteps(profile: TargetProfile): Promise<NextStepsResult> {
  const cacheKey = `ai-nextsteps-v2-${profile.gene}`;
  const cached = cacheGet<NextStepsResult>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a senior drug discovery scientist. Based on the target profile below, suggest exactly 3 specific, actionable next investigation steps for ${profile.gene}. Each must reference specific data from the analysis. No generic advice like "read more papers." Format as:

1. [STEP]: [Explanation referencing specific data]
2. [STEP]: [Explanation referencing specific data]
3. [STEP]: [Explanation referencing specific data]

Also suggest 2-3 related gene targets that would be valuable to compare against ${profile.gene}, with a one-line reason for each. Format as:

COMPARE:
- GENE1: reason
- GENE2: reason
- GENE3: reason

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';

  // Split text into steps section and compare section
  const compareSplit = text.split(/\nCOMPARE:\s*\n/);
  const stepsText = compareSplit[0] ?? '';
  const compareText = compareSplit[1] ?? '';

  // Parse steps
  const steps = stepsText.split(/\n\d+\.\s+/).filter(Boolean).map((s) => s.trim());

  // Parse comparison suggestions
  const comparisons: Array<{ gene: string; reason: string }> = [];
  const compareLines = compareText.split('\n').filter((l) => l.trim().startsWith('-'));
  for (const line of compareLines) {
    const match = line.match(/^-\s*([A-Z0-9]+)\s*:\s*(.+)/);
    if (match) {
      comparisons.push({ gene: match[1], reason: match[2].trim() });
    }
  }

  const result: NextStepsResult = { steps, comparisons };
  cacheSet(cacheKey, result);
  return result;
}

export async function generateDrugHypothesis(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-hypothesis-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 768,
    messages: [{
      role: 'user',
      content: `You are a senior medicinal chemist. Based on the compound landscape for ${profile.gene}, propose a drug design hypothesis. Include:

- Molecule type (small molecule, biologic, PROTAC, etc.) and why
- Target mechanism (inhibitor, degrader, modulator, etc.)
- Potential patient population (specific disease, genetic subgroup)
- Key differentiation from existing approaches
- Major risks and how to mitigate them

Ground your hypothesis in the actual data. Be specific and creative but scientifically rigorous.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateCompoundAnalysis(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-compounds-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a senior medicinal chemist analyzing the compound portfolio for ${profile.gene}. Based on the compound data below, provide a focused analysis covering:

1. SAR (structure-activity relationship) trends across the compound set
2. Chemical diversity assessment — are compounds exploring different chemical space or clustered?
3. Drug-likeness evaluation across the portfolio (Lipinski/Veber compliance patterns)
4. Development gaps — what compound types or modalities are missing?
5. Specific recommendations for next chemistry actions

Reference specific compound IDs, molecular properties (MW, LogP, TPSA), and activity values. Be quantitative and actionable. Write 2-3 paragraphs.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generatePharmacologySafety(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-pharmsafety-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a senior pharmacologist and toxicologist. Based on the molecular properties and clinical trial data for ${profile.gene}, provide:

1. ADMET Assessment: Based on the molecular properties of the top compounds (MW, LogP, TPSA, HBD/HBA), predict likely absorption, distribution, metabolism, excretion, and toxicity profiles.
2. Toxicology Risk Flags: Identify any structural or property-based red flags (e.g., high lipophilicity, reactive functional groups implied by RO5 violations, excessive MW).
3. Pharmacology Summary: Based on mechanism classes and compound types, characterize the pharmacological landscape.
4. Safety Signals from Trials: Note the trial status distribution — completed vs terminated trials indicate safety/efficacy outcomes.

Be specific about which compounds and trial data inform your conclusions. Write 2-3 paragraphs.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateCompetitiveIntelligence(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-competitive-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are a pharmaceutical competitive intelligence analyst. Based on the clinical trial data, compound landscape, and literature for ${profile.gene}, produce a competitive landscape analysis:

1. PIPELINE OVERVIEW: Categorize known compounds by development phase (Approved → Phase III → Phase II → Phase I → Preclinical). Name specific compounds and their sponsors where available from trial data.
2. MODALITY MAP: What drug modalities are being pursued (small molecule, antibody, degrader, gene therapy, etc.)? Which is dominant? Which are underexplored?
3. WHITE SPACE ANALYSIS: Identify unexploited opportunities — missing modalities, underserved patient populations, combination strategies not yet in trials.
4. COMPETITIVE DYNAMICS: Is this a crowded field or blue-ocean? What's the differentiation potential for a new entrant?
5. STRATEGIC RECOMMENDATION: Where should a new program position itself for maximum competitive advantage?

Reference specific compound IDs, trial counts, and data points. Be quantitative. Write like a McKinsey pharma report.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateEvidenceConflicts(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-conflicts-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are a senior scientist skilled at critical evidence evaluation. Analyze the multi-dimensional data for ${profile.gene} and identify CONTRADICTIONS, TENSIONS, or PARADOXES across data sources. This is the most intellectually valuable analysis — finding where evidence conflicts and RESOLVING those conflicts with scientific reasoning.

For each conflict found (identify 2-3):
- CONFLICT: State the contradiction clearly (e.g., "High genetic evidence but low chemical tractability")
- EVIDENCE FOR: What data supports one interpretation
- EVIDENCE AGAINST: What data supports the opposite
- AI RESOLUTION: Your expert interpretation reconciling the conflict. Explain WHY the data appears contradictory and what the TRUE interpretation is. Be specific — reference timing, biology, methodology, or other factors.
- CONFIDENCE: Rate your resolution confidence (Low/Medium/High)

This analysis should produce genuine insights that wouldn't be obvious from looking at any single dimension. Think like a drug discovery board reviewing conflicting departmental assessments.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateDeepHypothesis(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-deephypothesis-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `You are a visionary drug discovery scientist generating NOVEL SCIENTIFIC HYPOTHESES by connecting dots across different data dimensions for ${profile.gene}. Do not rehash known biology — generate NEW ideas.

Cross-reference these data streams to find unexpected connections:
- Genetic evidence (disease associations, tractability)
- Chemical landscape (compound types, activity profiles)
- Structural data (binding sites, confidence)
- Clinical trial patterns (phases, sponsors, indications)
- Regulatory complexity (enhancers, promoters, expression breadth)
- Literature momentum and preprint velocity

Generate exactly 2 novel hypotheses. For each:
- HYPOTHESIS: A specific, falsifiable scientific prediction (2-3 sentences)
- EVIDENCE CHAIN: The cross-dimensional data points that connect to form this hypothesis
- TESTABLE PREDICTION: How a lab could test this hypothesis
- NOVELTY SCORE: 1-10 (10 = no existing publication connects these ideas)
- FEASIBILITY: 1-10 (10 = could be tested with standard tools/assays)

Be creative but scientifically rigorous. The best hypotheses connect seemingly unrelated observations.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateDiscoveryAnalysis(
  disease: string,
  targetSummaries: string
): Promise<string> {
  const cacheKey = `ai-discovery-${disease}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a senior drug discovery scientist. You have just run an autonomous target discovery pipeline for "${disease}" and scored multiple potential drug targets across 7 dimensions. Based on the results below:

1. EXECUTIVE RANKING: Rank the top targets by overall druggability potential. Explain WHY the #1 target is ranked first — what makes it the best opportunity?
2. PORTFOLIO STRATEGY: If building a drug discovery portfolio for this disease, which 2-3 targets would you prioritize and why? Consider risk diversification across modalities.
3. DARK HORSE: Identify the most underappreciated target — one with moderate scores but hidden potential revealed by specific dimension patterns.
4. KEY INSIGHT: What is the single most important scientific insight from comparing these targets side-by-side?

Be specific. Reference scores and data. Write like a Nature Reviews Drug Discovery editorial.

DISEASE: ${disease}

TARGET SCORES:
${targetSummaries}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateExecutiveSummary(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-execsummary-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Write a 2-paragraph executive summary for a drug target validation report on ${profile.gene} (${profile.approvedName}). This will be the opening section of a professional report.

First paragraph: Overall assessment of the target's potential, with the overall score (${profile.scores.overall}/100) contextualized. Mention the strongest and weakest dimensions with scores.

Second paragraph: Key takeaway and recommended next action. Be concise and authoritative, as if writing for a VP of Drug Discovery.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateMutationImpact(
  profile: TargetProfile,
  mutation: string
): Promise<string> {
  const cacheKey = `ai-mutation-${profile.gene}-${mutation}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a structural biologist and clinical geneticist. Analyze the mutation ${mutation} in ${profile.gene} (${profile.approvedName}) using all available evidence.

Produce a structured scientific assessment covering:

**LOCATION & STRUCTURAL IMPACT:**
- Where does this residue sit (surface/core/interface/active site/binding pocket)?
- What structural consequences does this substitution cause?
- How does it affect protein folding, stability, or dynamics?

**FUNCTIONAL CONSEQUENCE:**
- Does it affect catalytic activity, ligand binding, protein-protein interactions?
- Is this gain-of-function, loss-of-function, or neomorphic?

**CLINICAL SIGNIFICANCE:**
- Known pathogenic variant? In which diseases?
- Clinical prevalence? Germline vs somatic?

**DRUG RESISTANCE & SENSITIVITY:**
- Which existing drugs from the compound landscape would be affected?
- Does this mutation confer resistance or create new vulnerability?

**THERAPEUTIC OPPORTUNITY:**
- Does this mutation CREATE a druggable opportunity absent in wild-type?
- Recommended modality and compound design strategy.

Reference specific data from the profile. Be quantitative.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generatePathwayCrosstalk(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-pathway-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a systems biologist and signaling pathway expert. Map the signaling network around ${profile.gene} (${profile.approvedName}) and identify strategic intervention points.

Produce analysis covering:

**PATHWAY POSITION:**
- What signaling pathway(s) does ${profile.gene} belong to?
- Position: upstream (receptor/ligand), midstream (kinase/adaptor), or downstream (effector)?
- Draw the key pathway as a text diagram using arrows showing signal flow.

**UPSTREAM REGULATORS:**
- What activates ${profile.gene}? Could these be better targets?
- Redundant activation pathways (resistance mechanisms)?

**DOWNSTREAM EFFECTORS:**
- What does ${profile.gene} activate? Which effectors are essential?
- Downstream targets for combination therapy?

**CROSSTALK & FEEDBACK LOOPS:**
- Which pathways cross-talk with this one?
- Negative feedback loops undermining single-agent therapy.
- Positive feedback loops amplifying drug effects.

**RESISTANCE MECHANISMS:**
- Known bypass pathways when ${profile.gene} is inhibited.
- Predicted resistance nodes based on pathway architecture.

**SYNTHETIC LETHALITY & COMBINATIONS:**
- Genes whose co-inhibition with ${profile.gene} causes synthetic lethality.
- Rational combination therapy suggestions with mechanistic basis.

**STRATEGIC RECOMMENDATION:**
- Best node to target and why. Optimal combination strategy.

Use compound and clinical trial data to ground analysis in therapeutic context.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}

export async function generateTrialDesign(profile: TargetProfile): Promise<string> {
  const cacheKey = `ai-trialdesign-${profile.gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are a clinical development strategist designing the optimal Phase I/II clinical trial for a new ${profile.gene}-targeting therapy. Use the real data to design a scientifically rigorous trial.

**TRIAL SYNOPSIS:**
- Trial title (ClinicalTrials.gov convention)
- Phase: I/II (dose escalation + expansion)
- Estimated duration

**INDICATION & PATIENT POPULATION:**
- Primary indication (from strongest disease associations)
- Key inclusion/exclusion criteria
- Biomarker stratification strategy
- Estimated eligible population

**INVESTIGATIONAL AGENT:**
- Recommended modality based on compound landscape
- Mechanism of action
- Dose rationale from existing potency data (reference pChEMBL values)

**ENDPOINTS:**
- Primary endpoint (justified from historical trial data)
- Key secondary endpoints
- Exploratory/translational biomarker endpoints

**DESIGN:**
- Dose escalation design (3+3, BOIN, mTPI-2)
- Expansion cohort design
- Sample size with statistical justification
- Enrollment timeline

**REGULATORY STRATEGY:**
- FDA pathway (accelerated, breakthrough, standard)
- Comparable approved therapies for benchmarking
- Key regulatory risks

**COMPETITIVE DIFFERENTIATION:**
- How this differs from ${profile.rawData.clinicalTrials.data?.totalTrials ?? 0} existing trials
- What gap this addresses

Reference actual data from the profile throughout.

${buildProfileSummary(profile)}`
    }],
  });

  const block = message.content[0];
  const text = block?.type === 'text' ? block.text : '';
  cacheSet(cacheKey, text);
  return text;
}
