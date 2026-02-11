# CLAUDE.md — TargetRadar Project Configuration & Research Intelligence

> This file is read by Claude Code on every interaction. It is the single source of truth
> for project specification, architecture, domain knowledge, and AI research enhancement.
> **Every layer of analysis — from API queries to AI narratives — is guided by this document.**

---

## 1. Project Identity

- **Name:** TargetRadar
- **Tagline:** "Drug Target Validation in 30 Seconds"
- **Problem Statement:** #2 Break the Barriers (primary) + #3 Amplify Human Judgment (secondary)
- **Author:** Heinz Jungbluth — CEO Spectrix RD
- **License:** MIT
- **Repository:** Open Source

### The Barrier We're Breaking

Drug target validation requires querying 7+ specialized databases, years of domain
expertise to interpret results, and weeks of manual work to compile a report.
Enterprise tools like Clarivate or Informa Pharma Intelligence cost $50–200K/year.
Academic researchers, biotech startups, patient advocates, and science journalists
are locked out.

**TargetRadar puts this power in everyone's hands — free, open source, in 30 seconds.**

| What's Locked Away              | Who It's Locked Behind                    | How TargetRadar Breaks It                      |
|---------------------------------|-------------------------------------------|------------------------------------------------|
| Target validation data          | 7+ databases needing specialized queries  | Single search box, unified view                |
| Druggability assessment         | Senior medicinal chemists (10+ years)     | Algorithmic scoring, transparent methodology   |
| Regulatory genomics insight     | Computational genomicists + AlphaGenome   | Automated regulatory landscape analysis        |
| Scientific synthesis            | Expensive consultants ($500/hr)           | AI-generated expert narratives via Claude       |
| Professional reports            | Enterprise tools ($50–200K/year)          | Free, open source, instant .docx export        |
| Data interpretation             | PhD-level domain expertise                | AI analysis connecting dots across dimensions  |

### Who It's For

- PhD students choosing thesis targets
- Biotech investors doing due diligence
- Academic labs starting new projects
- Patient advocacy groups researching their disease
- Science journalists covering drug development
- Small pharma teams without enterprise tools
- Regulatory genomics researchers leveraging AlphaGenome insights

---

## 2. Hackathon Judging Criteria

| Criterion            | Weight | How We Win                                                  |
|----------------------|--------|-------------------------------------------------------------|
| **Demo**             | 30%    | Animated 7-axis radar, live loading, AlphaGenome integration|
| **Impact**           | 25%    | 7 real APIs, AlphaGenome regulatory genomics, pro reports   |
| **Opus 4.6 Use**    | 25%    | 5 distinct AI features, expert-level research narratives    |
| **Depth & Execution**| 20%   | TypeScript strict, 7D scoring, clean architecture           |

**Mandatory:** Everything fully open source under MIT License.

### Problem Statement Alignment

**PS2 — Break the Barriers:**
> "Take something powerful that's locked behind expertise, cost, language, or
> infrastructure and put it in everyone's hands."

We take $50–200K/year enterprise drug target validation — including cutting-edge
regulatory genomics from AlphaGenome — and make it free, instant, and accessible
to anyone with a browser.

**PS3 — Amplify Human Judgment:**
> "Build AI that makes researchers, professionals, and decision-makers dramatically
> more capable — without taking them out of the loop."

Our AI narratives synthesize across 7 data dimensions, connecting genetic evidence
with regulatory complexity, chemical tractability with structural readiness, and
preprint velocity with clinical reality — insights that raw numbers never reveal.

### Demo Strategy (30% — Invest the Most Here)

The "wow" flow:
1. User types "KRAS" in search bar
2. LIVE loading state shows each of 7 APIs completing with data counts
3. Radar chart ANIMATES into existence with all 7 dimensions filling in
4. AlphaGenome regulatory features appear with enhancer/promoter counts
5. AI narrative synthesizes regulatory insights alongside traditional dimensions
6. User downloads a professional .docx report with all 7 dimensions
7. All under 10 seconds

**The loading state IS the demo.** Show each data source completing live.
**7 axes > 6 axes.** The heptagon radar is visually distinctive and more informative.
**AlphaGenome is the differentiator.** No other hackathon project integrates it.

### AI Integration Strategy (25%)

Twelve distinct AI features, all enhanced with regulatory genomics and compound data:
1. **AI Target Intelligence Brief** — 3-paragraph synthesis across ALL 7 dimensions
2. **AI Comparison Analysis** — comparative analysis including regulatory complexity
3. **AI Next Steps Recommender** — 3 actionable steps, referencing regulatory landscape
4. **AI Drug Hypothesis Generator** — molecule type informed by regulatory data
5. **AI Report Executive Summary** — unique per target, embedded in .docx
6. **AI Compound Portfolio Analysis** — SAR trends, chemical diversity, drug-likeness, development gaps
7. **AI Pharmacology & Safety** — ADMET assessment, toxicology flags, safety signals from trial data
8. **AI Competitive Intelligence** — market landscape, competitor analysis, white space identification
9. **AI Evidence Conflicts** — cross-dimensional contradiction detection and resolution
10. **AI Mutation Impact** — variant effect prediction on drug target function
11. **AI Pathway Crosstalk** — signaling network analysis and pathway interactions
12. **AI Trial Design** — AI-recommended clinical trial strategies for the target

Use `claude-opus-4-6` for all API calls (Opus 4.6 — the hackathon criterion model).
Cache AI responses with 5-minute TTL.
AI content clearly labeled with "AI Analysis" badge.

---

## 3. Tech Stack (Locked — Do Not Change)

| Layer             | Technology            | Reason                                        |
|-------------------|-----------------------|-----------------------------------------------|
| Framework         | Next.js 16 (App Router)| Server components, API routes, SSR           |
| Language          | TypeScript (strict)   | Type safety across API boundaries             |
| Styling           | Tailwind CSS          | Rapid, consistent styling                     |
| Components        | shadcn/ui             | Accessible, customizable primitives           |
| Charts            | Recharts              | React-native charting with animation          |
| Reports (.docx)   | docx (npm)           | Server-side Word document generation          |
| Reports (.xlsx)   | ExcelJS              | Server-side spreadsheet generation            |
| AI Narratives     | @anthropic-ai/sdk    | Claude API for expert analysis generation     |
| HTTP Client       | Native fetch          | Next.js extends fetch with caching            |
| 3D Visualization  | 3Dmol.js (CDN)       | Cinema-grade protein structure rendering       |
| Compound Images   | PubChem REST API     | Server-side SMILES → PNG proxy                |
| Regulatory Data   | Ensembl REST API     | AlphaGenome-compatible regulatory features    |

**Do NOT add:** Prisma, any database, Redux, MobX, styled-components, Material UI,
Chakra UI, axios, lodash, moment/dayjs.

---

## 4. Project Structure

```
targetradar/
├── CLAUDE.md                                # THIS FILE — project intelligence
├── CHANGELOG.md
├── README.md
├── LICENSE
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .env.local
├── .gitignore
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # Home / Search
│   │   ├── globals.css
│   │   ├── analyze/[gene]/page.tsx           # Results page (7 dimensions)
│   │   ├── compare/page.tsx                  # Comparison page
│   │   ├── discover/page.tsx                 # DeepTarget Discovery (disease → targets)
│   │   ├── lab/page.tsx                      # Molecule Testing Lab
│   │   └── api/
│   │       ├── analyze/route.ts              # Main analysis (7 services)
│   │       ├── search/route.ts               # Gene autocomplete
│   │       ├── discover/route.ts             # Disease → target discovery
│   │       ├── discover/search/route.ts      # Disease autocomplete
│   │       ├── compound/image/route.ts       # PubChem 2D structure proxy
│   │       ├── lab/resolve/route.ts          # SMILES → properties via PubChem
│   │       ├── lab/sdf3d/route.ts            # SMILES → 3D SDF
│   │       ├── ai/narrative/route.ts         # AI target intelligence brief
│   │       ├── ai/compare/route.ts           # AI comparison analysis
│   │       ├── ai/next-steps/route.ts        # AI next steps recommender
│   │       ├── ai/hypothesis/route.ts        # AI drug hypothesis generator
│   │       ├── ai/deep-hypothesis/route.ts   # AI deep drug hypothesis
│   │       ├── ai/compounds/route.ts         # AI compound portfolio analysis
│   │       ├── ai/pharmacology/route.ts      # AI pharmacology & safety
│   │       ├── ai/competitive/route.ts       # AI competitive intelligence
│   │       ├── ai/conflicts/route.ts         # AI evidence conflicts
│   │       ├── ai/mutation/route.ts          # AI mutation impact
│   │       ├── ai/pathway/route.ts           # AI pathway crosstalk
│   │       ├── ai/trial-design/route.ts      # AI trial design
│   │       ├── export/docx/route.ts          # .docx report export
│   │       ├── export/xlsx/route.ts          # .xlsx data export
│   │       └── health/route.ts               # Health check (7 services)
│   ├── lib/
│   │   ├── services/
│   │   │   ├── open-targets.ts               # Genetic Evidence
│   │   │   ├── chembl.ts                     # Chemical Tractability
│   │   │   ├── pubmed.ts                     # Literature Depth
│   │   │   ├── clinical-trials.ts            # Clinical History
│   │   │   ├── biorxiv.ts                    # Innovation Signal
│   │   │   ├── alphafold.ts                  # Structural Readiness
│   │   │   ├── alphagenome.ts                # Regulatory Genomics (AlphaGenome)
│   │   │   └── ai-analysis.ts                # Claude AI features (12 endpoints)
│   │   ├── scoring/
│   │   │   ├── engine.ts                     # Orchestrator (7 dimensions)
│   │   │   ├── genetic-evidence.ts
│   │   │   ├── chemical-tractability.ts
│   │   │   ├── structural-readiness.ts
│   │   │   ├── clinical-history.ts
│   │   │   ├── literature-depth.ts
│   │   │   ├── innovation-signal.ts
│   │   │   ├── regulatory-genomics.ts        # AlphaGenome scoring
│   │   │   └── types.ts
│   │   ├── types/
│   │   │   ├── target-profile.ts             # Includes AlphaGenomeData
│   │   │   ├── api-responses.ts              # Zod schemas for all APIs
│   │   │   ├── lab.ts                        # LabMolecule types + bridge
│   │   │   ├── reports.ts
│   │   │   └── scoring.ts                    # 7 DimensionNames
│   │   ├── utils/
│   │   │   ├── api-client.ts                 # fetchWithRetry, timeout, error handling
│   │   │   ├── cache.ts                      # 5-minute TTL in-memory cache
│   │   │   ├── drug-likeness.ts              # Lipinski RO5 + Veber rules
│   │   │   ├── format.ts                     # Number formatting, linearScale
│   │   │   └── gene-aliases.ts
│   │   ├── utils.ts                          # cn() utility
│   │   └── constants.ts
│   ├── components/
│   │   ├── ui/                               # shadcn/ui (11 primitives)
│   │   ├── search/
│   │   │   ├── search-bar.tsx                # Gene autocomplete input
│   │   │   ├── search-suggestions.tsx        # Dropdown suggestions
│   │   │   └── recent-searches.tsx           # localStorage history
│   │   ├── radar/
│   │   │   ├── radar-chart.tsx               # 7-vertex heptagon
│   │   │   └── radar-tooltip.tsx
│   │   ├── dimensions/
│   │   │   ├── dimension-grid.tsx            # 7 dimension cards
│   │   │   ├── dimension-card.tsx
│   │   │   └── score-counter.tsx             # Animated 0→N counter
│   │   ├── protein/
│   │   │   ├── protein-viewer.tsx            # 3Dmol.js 3D viewer
│   │   │   ├── structure-panel.tsx           # Panel with color scheme toggles
│   │   │   └── docking-panel.tsx             # Molecular docking visualization
│   │   ├── compounds/
│   │   │   ├── compound-gallery.tsx          # 2D structure cards grid
│   │   │   └── drug-likeness-panel.tsx       # Lipinski/Veber + radar charts
│   │   ├── charts/
│   │   │   ├── bioactivity-chart.tsx         # pChEMBL histogram
│   │   │   ├── property-scatter.tsx          # MW vs LogP scatter
│   │   │   ├── phase-funnel.tsx              # Trial phase progression
│   │   │   ├── trial-status-pie.tsx          # Trial status distribution
│   │   │   ├── sponsor-bar.tsx               # Top sponsors bar chart
│   │   │   ├── trial-timeline.tsx            # Trial starts by year
│   │   │   ├── regulatory-feature-bar.tsx    # Regulatory feature distribution
│   │   │   ├── regulatory-pie.tsx            # Regulatory element categories
│   │   │   ├── conservation-gauge.tsx        # Constrained element density
│   │   │   └── genomic-landscape-radar.tsx   # Regulatory complexity radar
│   │   ├── clinical/
│   │   │   └── trials-dashboard.tsx          # Full clinical trials dashboard
│   │   ├── genomics/
│   │   │   └── regulatory-dashboard.tsx      # Regulatory genomics dashboard
│   │   ├── lab/
│   │   │   ├── molecule-form.tsx             # SMILES + property input form
│   │   │   ├── results-panel.tsx             # Drug-likeness results
│   │   │   └── molecule-history.tsx          # localStorage history sidebar
│   │   ├── reports/
│   │   │   ├── export-button.tsx             # .docx/.xlsx export dropdown
│   │   │   └── report-preview.tsx
│   │   ├── analysis/
│   │   │   └── live-loading-state.tsx        # Real-time API completion indicators
│   │   ├── ai/
│   │   │   ├── ai-badge.tsx                  # "AI Analysis" badge
│   │   │   ├── ai-section.tsx                # Reusable AI content wrapper
│   │   │   ├── target-narrative.tsx          # Intelligence brief
│   │   │   ├── comparison-narrative.tsx      # Comparison analysis
│   │   │   ├── next-steps.tsx                # Next steps recommender
│   │   │   ├── drug-hypothesis.tsx           # Drug hypothesis generator
│   │   │   ├── deep-hypothesis.tsx           # Deep drug hypothesis
│   │   │   ├── compound-analysis.tsx         # Compound portfolio analysis
│   │   │   ├── pharmacology-safety.tsx       # Pharmacology & safety
│   │   │   ├── competitive-intelligence.tsx  # Competitive intelligence
│   │   │   ├── evidence-conflicts.tsx        # Evidence conflicts
│   │   │   ├── mutation-impact.tsx           # Mutation impact prediction
│   │   │   ├── pathway-crosstalk.tsx         # Pathway crosstalk analysis
│   │   │   └── trial-design.tsx              # Trial design recommendations
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── footer.tsx
│   │       └── loading-skeleton.tsx
│   └── hooks/
│       ├── use-analysis.ts                   # Analysis data fetching
│       ├── use-search.ts                     # Gene autocomplete
│       ├── use-recent-searches.ts            # localStorage persistence
│       └── use-lab-molecules.ts              # Lab molecule persistence
```

---

## 5. Data Source APIs

### 5.1 Open Targets Platform (Genetic Evidence)
- **Type:** GraphQL (POST)
- **Endpoint:** `https://api.platform.opentargets.org/api/v4/graphql`
- **No authentication required**
- **Key fields:** `datasourceScores { id score }` (NOT `componentId`)

### 5.2 ChEMBL (Chemical Tractability)
- **Type:** REST (JSON)
- **Base URL:** `https://www.ebi.ac.uk/chembl/api/data`
- **No authentication required**

### 5.3 PubMed / Entrez (Literature Depth)
- **Type:** REST
- **Base URL:** `https://eutils.ncbi.nlm.nih.gov/entrez/eutils`
- **Optional API key:** `NCBI_API_KEY`

### 5.4 ClinicalTrials.gov v2 (Clinical History)
- **Type:** REST
- **Base URL:** `https://clinicaltrials.gov/api/v2`
- **No authentication required**

### 5.5 bioRxiv (Innovation Signal)
- **Type:** REST
- **Base URL:** `https://api.biorxiv.org`
- **No authentication required**
- Fetches 5 pages (500 results) in parallel, filters client-side

### 5.6 AlphaFold DB + PDB (Structural Readiness)
- **AlphaFold:** `GET https://alphafold.ebi.ac.uk/api/prediction/{uniprot_id}`
- **PDB Search:** `POST https://search.rcsb.org/rcsbsearch/v2/query`
- **UniProt:** `GET https://rest.uniprot.org/uniprotkb/search?query=gene_exact:GENE+AND+organism_id:9606+AND+reviewed:true`
- Note: UniProt query MUST include `+AND+reviewed:true` for Swiss-Prot entries

### 5.7 AlphaGenome / Ensembl Regulation (Regulatory Genomics) — NEW

- **Type:** REST
- **Base URL:** `https://rest.ensembl.org`
- **No authentication required**
- **Rate limit:** 15 requests/second (respect with retry logic)

**Gene coordinate lookup:**
```
GET /lookup/id/{ensemblId}?expand=1
→ { seq_region_name, start, end, strand, Transcript: [...] }
```

**Regulatory features in gene region (±50kb):**
```
GET /overlap/region/homo_sapiens/{chr}:{start-50000}-{end+50000}?feature=regulatory
→ Array<{ feature_type: "Promoter" | "Enhancer" | "CTCF Binding Site" | "Open Chromatin" | ... }>
```

**Constrained elements:**
```
GET /overlap/region/homo_sapiens/{chr}:{start-10000}-{end+10000}?feature=constrained
→ Array<{ id, score }>
```

**AlphaGenome connection:** This data represents the empirical regulatory landscape
that AlphaGenome's neural network learns to predict. Our service provides the
ground-truth regulatory annotations that complement AlphaGenome's predictions:
- **Enhancers** → AlphaGenome's GENE_MASK_LFC variant-to-expression scoring
- **Promoters** → AlphaGenome's CAGE TSS predictions
- **CTCF sites** → AlphaGenome's 3D contact map predictions
- **Open chromatin** → AlphaGenome's ATAC-seq/DNase-seq modality outputs
- **Constrained elements** → Evolutionary conservation validates AlphaGenome predictions

**Future: Full AlphaGenome gRPC integration** via Python FastAPI microservice when
API key is available from `deepmind.google.com/science/alphagenome`.

---

## 6. Scoring Engine

All scoring functions are pure functions: `(rawData) => DimensionScore`
Each returns a score 0–100 with named component breakdowns.

### 6.1 Genetic Evidence (0–100)
```
diseaseAssociationCount:  0–25  (min(count, 50) / 50 * 25)
topAssociationScore:      0–25  (topScore * 25)
datasourceDiversity:      0–20  (min(uniqueSources, 12) / 12 * 20)
tractabilityBucket:       0–15  (smallMolecule=15, antibody=10, other=5, none=0)
geneticConstraint:        0–15  (based on gnomAD constraint or fallback heuristic)
```

### 6.2 Chemical Tractability (0–100)
```
maxClinicalPhase:    0–30  (maxPhase / 4 * 30)
compoundCount:       0–20  (min(count, 100) / 100 * 20)
mechanismDiversity:  0–15  (min(mechanisms, 5) / 5 * 15)
bioactivityDensity:  0–20  (min(activities, 500) / 500 * 20)
potentCompounds:     0–15  (min(pchembl7plus, 20) / 20 * 15)
```

### 6.3 Structural Readiness (0–100)
```
experimentalStructures:  0–30  (min(pdbCount, 20) / 20 * 30)
alphafoldConfidence:     0–25  (avgPLDDT / 100 * 25)
ligandBoundStructures:   0–25  (min(ligandBound, 10) / 10 * 25)
resolutionQuality:       0–20  (<2.0Å=20, <3.0Å=12, else=5)
```

### 6.4 Clinical History (0–100)
```
totalTrials:       0–20  (min(total, 100) / 100 * 20)
phaseProgression:  0–30  (phase4=1.0, phase3=0.85, phase2=0.60, phase1=0.35)
activeTrials:      0–20  (min(recruiting, 10) / 10 * 20)
sponsorDiversity:  0–15  (min(uniqueSponsors, 15) / 15 * 15)
recentActivity:    0–15  (>5 trials in 2yr → 15, else count/5 * 15)
```

### 6.5 Regulatory Genomics (0–100) — NEW (AlphaGenome)
```
regulatoryFeatures:       0–25  (min(features_in_±50kb, 50) / 50 * 25)
enhancerPromoterLandscape: 0–25  (min(enhancers + promoters, 15) / 15 * 25)
constrainedElements:      0–20  (min(constrained, 30) / 30 * 20)
expressionBreadth:        0–15  (breadth% / 100 * 15)
transcriptComplexity:     0–15  (min(transcripts, 10) / 10 * 15)
```

### 6.6 Literature Depth (0–100)
```
totalPublications:   0–25  (min(total, 5000) / 5000 * 25)
recentPublications:  0–25  (min(recent2yr, 500) / 500 * 25)
drugFocusedPubs:     0–20  (min(drugPubs, 1000) / 1000 * 20)
reviewArticles:      0–15  (min(reviews, 100) / 100 * 15)
recencyRatio:        0–15  (recent/total > 0.10 → 15, else 8)
```

### 6.7 Innovation Signal (0–100)
```
preprint90d:        0–35  (min(count90d, 20) / 20 * 35)
preprint30d:        0–25  (min(count30d, 8) / 8 * 25)
velocityTrend:      0–25  (increasing=25, stable=15, decreasing=8)
noveltyIndicators:  0–15  (min(uniqueGroups, 10) / 10 * 15)
```

### Overall Weighted Score (7 Dimensions)
```
Chemical Tractability:  0.22  (highest — most actionable)
Genetic Evidence:       0.18
Clinical History:       0.18
Structural Readiness:   0.13
Regulatory Genomics:    0.12  (NEW — AlphaGenome)
Literature Depth:       0.09
Innovation Signal:      0.08
```

---

## 7. UI Design Specifications

### Radar Chart
- 7-vertex heptagon (upgraded from hexagon)
- Semi-transparent blue fill (20% opacity)
- Solid blue stroke, animated draw-in
- Comparison mode: second target overlaid in indigo
- **Regulatory Genomics vertex labeled as "Regulatory"**

### Layout
- Max width: `max-w-7xl` (1280px)
- Dimension cards: CSS Grid — 7 cards in 4+3 or 3+2+2 layout
- Dark mode ONLY — professional scientific aesthetic

### 3D Protein Structure Viewer (v4 Elevation)
Cinema-grade protein visualization using 3Dmol.js loaded from CDN:

**Rendering:**
- Dark slate background: `#0F0F1E` to `#1A1A3E` gradient
- Anti-aliasing enabled, fog disabled for clarity
- Auto-rotation: 0.5°/frame on Y-axis

**Color Schemes:**
- **Secondary Structure:** Violet helices (`#8B5CF6`), Indigo sheets (`#6366F1`), Gray coils (`#6B7280`)
- **pLDDT Confidence:** B-factor coloring (>90 blue, 70-90 cyan, 50-70 yellow, <50 orange)
- **Hydrophobicity:** RasMol coloring scheme
- **Binding Sites:** Orange highlight (`#FF6B00`) with stick representation

**Structure Panel:**
- Color scheme toggle buttons (Structure / Confidence / Hydro)
- PDB/AlphaFold source badges
- Quality metrics bar: PDB count, best resolution (Å), pLDDT score, ligand-bound count
- Color legend for active scheme
- Graceful empty state when no structure available
- Dynamic import (SSR-disabled) via `next/dynamic`

**Data Flow:**
- Priority: experimental PDB structure > AlphaFold prediction
- PDB: `https://files.rcsb.org/download/{pdbId}.pdb`
- AlphaFold: `https://alphafold.ebi.ac.uk/files/AF-{uniprotId}-F1-model_v6.pdb`

---

## 8. Report Generation

### .docx Report (13 Sections)
1. Cover page
2. AI Executive Summary
3. Radar Chart (7 axes)
4. Score Breakdown Table (7 dimensions + components)
5. Genetic Evidence Details
6. Chemical Landscape
7. Structural Coverage
8. Clinical Trial Summary
9. **Regulatory Genomics (AlphaGenome) — NEW**
10. Literature Analysis
11. Innovation Pulse
12. Methodology
13. Data Sources & Timestamps

### .xlsx Export (8 Sheets)
1. Summary (overall + 7 dimension scores)
2. Genetic Evidence
3. Compounds
4. Clinical Trials
5. Publications
6. Preprints
7. **Regulatory Genomics — NEW**
8. Scoring Methodology (updated weights)

---

## 9. Coding Standards

- TypeScript strict mode, **zero `any` types**
- Interfaces over type aliases for object shapes
- Server Components by default; `'use client'` only when needed
- All API fetches parallel via `Promise.allSettled()`
- Graceful degradation: if 1/7 APIs fail, other 6 still work
- 15-second timeout per API call
- 1 retry on 5xx errors
- In-memory cache with 5-minute TTL
- `@/` absolute imports (maps to `./src/`)

---

## 10. Domain Knowledge for AI Enhancement

> **This section transforms Claude from a generic AI into a senior drug discovery
> scientist.** Every AI narrative, comparison, and recommendation benefits from this
> context. This is what makes TargetRadar's AI analysis world-class.

### 10.1 Drug Discovery Framework

The drug discovery pipeline has critical decision gates:

```
Target ID → Target Validation → Hit Finding → Lead Optimization → Preclinical → IND → Phase I → Phase II → Phase III → Approval
```

TargetRadar focuses on the **Target Validation** gate — the most important and
most poorly supported decision in the pipeline. A wrong target wastes $1B+ and 10+ years.

### 10.2 What Makes a Good Drug Target

1. **Strong genetic evidence** — GWAS hits, Mendelian disease genes, functional
   genomics screens. The more independent genetic evidence, the higher the
   probability of clinical success (Nelson et al., Nature Genetics 2015).

2. **Chemical tractability** — Can we make a drug against it? Needs a binding
   pocket (small molecule), an extracellular domain (antibody), or a degradable
   surface (PROTAC). Targets with existing tool compounds are de-risked.

3. **Structural clarity** — X-ray/cryo-EM structures enable structure-based drug
   design. AlphaFold predictions help but experimental structures with ligands
   are gold standard.

4. **Clinical precedent** — Targets with clinical trial data (even failed trials)
   provide safety/efficacy signals. Phase II+ evidence is strong validation.

5. **Regulatory complexity (AlphaGenome)** — Genes with complex regulatory landscapes
   (many enhancers, multiple promoters, CTCF insulation) are harder to modulate
   but may offer tissue-specific intervention opportunities. AlphaGenome predicts
   how variants in these regions affect gene expression.

6. **Literature momentum** — Well-published targets have more reagents, assays,
   and community knowledge. But beware of overcrowded fields.

7. **Innovation trajectory** — Rising preprint activity signals emerging interest
   before it appears in peer-reviewed literature.

### 10.3 Key Analytical Frameworks for AI Narratives

When generating AI narratives, apply these scientific frameworks:

**The Druggability Triangle:**
- Genetic evidence → Confidence that modulation will affect disease
- Chemical tractability → Technical feasibility of making a drug
- Clinical safety → Evidence that modulation is tolerable
→ All three must align for a viable drug target.

**The Innovation Paradox:**
- Well-validated targets (high genetic + clinical evidence) are often
  commercially crowded and patent-encumbered
- Novel targets (high innovation signal, low clinical) offer blue-ocean
  opportunity but carry higher biological risk
→ The ideal target has strong genetics but unexploited chemistry.

**Regulatory Landscape Interpretation (AlphaGenome-informed):**
- High regulatory complexity (many enhancers/promoters) suggests:
  - Tissue-specific expression → potential for selective modulation
  - Complex transcriptional control → harder to predict drug effects
  - Rich variant landscape → opportunities for precision medicine
- Low regulatory complexity suggests:
  - Constitutive/housekeeping expression → broad effects, potential toxicity
  - Simpler biology → more predictable drug response
- AlphaGenome's GENE_MASK_LFC score predicts how regulatory variants
  change gene expression — key for understanding genetic risk factors

**Cross-Dimensional Signals:**
- High genetic + low chemical → "undrugged" opportunity, needs novel modality
- High structural + low clinical → ready for drug design, needs clinical investment
- High innovation + low literature → emerging field, first-mover advantage
- High regulatory complexity + high genetic → precision medicine opportunity
- High clinical + low genetic → may be targeting wrong pathway/mechanism

### 10.4 Modality Selection Logic

When the AI generates drug hypotheses, apply this decision tree:

```
IF target has binding pocket (structural readiness > 60) AND enzyme/GPCR/kinase:
  → Small molecule inhibitor/modulator
ELIF target is extracellular (receptor/ligand) AND antibody tractability confirmed:
  → Monoclonal antibody or ADC
ELIF target is intracellular AND lacks pocket (structural < 40):
  → PROTAC/molecular glue degrader
ELIF target is transcription factor with complex regulatory landscape:
  → Antisense oligonucleotide or gene therapy
ELIF target has high regulatory complexity AND tissue-specific expression:
  → Regulatory RNA modulator or enhancer targeting
ELSE:
  → Novel modality (gene therapy, base editing, RNAi)
```

### 10.5 Target Reference Data

Expected dimension profiles for benchmark targets:

| Target | Genetic | Chemical | Structural | Clinical | Regulatory | Literature | Innovation | Why                                      |
|--------|---------|----------|------------|----------|------------|------------|------------|------------------------------------------|
| EGFR   | 80+     | 90+      | 80+        | 90+      | 60-70      | 80+        | 30-50      | Poster child — approved TKIs, antibodies |
| KRAS   | 80+     | 60-70    | 70+        | 80+      | 50-60      | 70+        | 40-60      | Long "undruggable" history, sotorasib    |
| BRCA1  | 80+     | 30-40    | 50+        | 40-60    | 70-80      | 70+        | 20-40      | Tumor suppressor, PARP inhibitor target  |
| TP53   | 80+     | 20-30    | 60+        | 40-50    | 70-80      | 80+        | 30-50      | Most mutated gene in cancer, hard to drug |
| PCSK9  | 70+     | 80+      | 60+        | 80+      | 40-50      | 60+        | 20-30      | Validated — evolocumab/alirocumab approved|
| APOE   | 80+     | 20-30    | 50+        | 30-50    | 60-70      | 60+        | 30-50      | Alzheimer's risk gene, undrugged          |

---

## 11. AI Prompt Engineering Patterns

### Narrative Generation Best Practices

When generating AI content for TargetRadar, Claude should:

1. **Be a scientist, not a chatbot.** No disclaimers ("I should note..."),
   no hedging ("It's worth considering..."), no fluff. Write like a Nature
   Reviews Drug Discovery paper.

2. **Reference specific numbers.** "EGFR has 847 disease associations with
   a top score of 0.93 for lung carcinoma" — not "EGFR has many disease
   associations."

3. **Connect dimensions.** The value of 7-dimensional analysis is in the
   connections: "The high structural readiness (82/100) combined with 47
   regulatory features and a complex enhancer landscape suggests that while
   structure-based drug design is feasible, tissue-selective modulation via
   regulatory targeting represents an orthogonal opportunity."

4. **Identify paradoxes.** The most insightful analysis comes from tensions
   in the data: "Despite 156 clinical trials (87/100 Clinical History),
   KRAS's Chemical Tractability score of only 65/100 reflects the protein's
   historically 'undruggable' nature — a gap that sotorasib only partially closes."

5. **Provide actionable recommendations.** End with what to DO next, not
   what to think.

6. **Integrate regulatory genomics.** Always mention the regulatory landscape
   when it reveals something non-obvious: enhancer density, expression breadth,
   constrained elements suggesting functional importance.

### AI Feature Prompts Reference

All AI features should reference 7 dimensions (including Regulatory Genomics)
and use `claude-opus-4-6` with cached responses (5-min TTL).

---

## 12. AlphaGenome Integration Architecture

### Current Implementation (Ensembl REST)
```
Ensembl REST API → Regulatory Features + Constrained Elements + Gene Info
→ AlphaGenomeData { regulatoryFeatureCount, enhancerCount, promoterCount, ... }
→ scoreRegulatoryGenomics() → DimensionScore (0-100)
```

### Future Full Integration (Python gRPC)
```
pip install alphagenome
→ Python FastAPI microservice (port 8001)
→ model.score_variant() with GENE_MASK_LFC scorer
→ Variant-to-gene expression predictions at single-base resolution
→ 12 modality outputs (ATAC-seq, CAGE, RNA-seq, histone marks, ...)
→ Next.js API route calls Python service
→ Enhanced AlphaGenomeData with predicted variant effects
```

### Why AlphaGenome Matters for Drug Discovery
1. **Variant interpretation:** Predicts functional impact of GWAS variants
2. **Tissue-specific effects:** Different regulatory landscapes across tissues
3. **Enhancer targeting:** Identifies tissue-specific enhancers for selective modulation
4. **Gene regulation:** Predicts how regulatory mutations change expression
5. **Drug safety:** Understanding off-target regulatory effects

---

## 13. Performance Targets

| Metric              | Target    |
|---------------------|-----------|
| Autocomplete        | < 300ms   |
| Full analysis (7D)  | < 6s      |
| Radar render        | < 100ms   |
| .docx generation    | < 3s      |
| .xlsx generation    | < 2s      |
| Lighthouse score    | > 90      |

---

## 14. Environment Variables

```bash
ANTHROPIC_API_KEY=     # REQUIRED for AI features (25% of judging)
NCBI_API_KEY=          # Optional: PubMed rate limit boost
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 15. Deployment Checklist

- [x] All 7 data services returning real data (incl. AlphaGenome/Ensembl)
- [x] Scoring engine producing correct scores for 7 dimensions
- [x] Radar chart animation with 7-vertex heptagon
- [x] AI narratives referencing regulatory genomics data (16 AI features, Opus 4.6)
- [x] .docx report with 7 dimension breakdowns
- [x] .xlsx export with 10 sheets (incl. Drug-Likeness, Score Components Detail)
- [x] Comparison mode with 7-axis overlaid radar charts
- [x] Loading state showing 7 API completions in real-time
- [x] Cinema-grade 3D protein visualization (3Dmol.js)
- [x] Structure panel with color scheme toggles and quality metrics
- [x] Compound gallery with 2D structures and molecular properties
- [x] Drug-likeness assessment (Lipinski RO5 + Veber rules + radar charts)
- [x] Bioactivity histogram and MW vs LogP scatter plot
- [x] Clinical trials dashboard (phase funnel, status pie, sponsors, timeline)
- [x] AI compound portfolio analysis and pharmacology/safety assessment
- [x] Molecule Testing Lab (`/lab`) — SMILES resolve, drug-likeness, chemical space
- [x] DeepTarget Discovery (`/discover`) — disease → autonomous target ranking
- [x] Molecular docking panel with PDB→AlphaFold fallback
- [x] Regulatory genomics dashboard (feature bar, pie, conservation gauge, radar)
- [x] Compound image proxy (PubChem 2D PNG, server-side)
- [x] Comprehensive null safety audit (40+ fixes across API routes + components)
- [x] Zod schemas match actual API field names and types
- [x] GraphQL error detection in graphqlFetch
- [x] All form inputs have id/name attributes (accessibility)
- [x] TypeScript strict mode, zero errors (`tsc --noEmit`)
- [x] Production build succeeds (`next build`) — 32 routes, 0 errors
- [x] All 5 test targets verified (EGFR 89, TP53 68, BRCA1 67, KRAS 80, PCSK9 78)
- [x] Demo mode pre-warming EGFR, KRAS, BRCA1 caches (`/api/warmup`)
- [x] Mobile responsive at 375px width (13 files audited, hamburger nav)
- [x] Deployed to DigitalOcean: `http://138.68.7.97:4000` (pm2, auto-restart)
- [x] GitHub: `https://github.com/Bionicsdemo/targetradar`
- [x] Real co-crystal docking via `/api/docking` (RCSB GraphQL ligand search)
- [x] Compound images: PubChem PNG → CDK Depict SVG → SmilesDrawer fallback chain
- [x] AlphaFold v6 migration (v4 returns 404)
- [x] vitest: 92 tests passing
- [x] Natural language search (`/api/ai/interpret`)
- [x] AI streaming (`/api/ai/narrative/stream`)
- [x] Score methodology panel (transparent formula + weights)
- [x] Example targets + stats banner on landing page
- [x] Custom favicon
- [x] Enhanced .docx report (979 lines, 13 sections)
- [x] Enhanced .xlsx report (10 sheets, conditional formatting, drug-likeness)
- [ ] Demo video recorded (3 minutes, Loom)
- [ ] Submission on CV platform

---

## 16. Known API Gotchas (Learned from Testing)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Open Targets 400 error | `componentId` → must be `id` in datasourceScores | Fixed in GraphQL query |
| Open Targets `data: null` | GraphQL returns 200 with `{data: null, errors:[...]}` | Optional chaining `result.data?.search?.hits` + GraphQL error check |
| UniProt wrong ID | Returns TrEMBL entries | Add `+AND+reviewed:true` |
| AlphaFold pLDDT = 0 | Field is `globalMetricValue` not `confidenceAvgLocalScore` | Check both fields |
| bioRxiv 0 results | Only 1 page = 100 results from 16K+ | Fetch 5 pages in parallel |
| bioRxiv regex crash | Gene names like `C4B(P)` break `new RegExp()` | `escapeRegex()` before RegExp construction |
| Ensembl 429 rate limit | >15 req/sec | Use retry logic with backoff |
| ChEMBL string numbers | `pchembl_value`, `standard_value`, `alogp`, `psa`, `full_mwt` returned as strings | `parseFloat()` with NaN guard |
| ChEMBL null properties | Antibodies/biologics have `molecule_properties: null` | Skip in drug-likeness, filter to small molecules for RO5 |
| Anthropic empty content | `message.content` can be empty array `[]` | `const block = content[0]; block?.type === 'text'` |
| PDB structure 404 | Some PDB IDs are obsolete or unavailable | Fallback chain: PDB → AlphaFold → error state |
| AlphaFold v4 → v6 | AlphaFold DB upgraded, `model_v4.pdb` returns 404 | Use `model_v6.pdb` everywhere |
| ChEMBL image API 405 | ChEMBL SVG image endpoint returns 405 for all requests | Bypass ChEMBL, use PubChem PNG + CDK Depict SVG fallback |
| PDB search antibodies | Full-text gene search returns antibody Fab fragments, not kinase structures | Search by UniProt accession + filter for non-polymer entities |
| RCSB buffer ligands | PDB structures contain GOL, PEG, SO4, EDO etc. as "ligands" | Exclude 39 common buffers, require MW > 200 Da for drug-like |
| Tailwind class purging | Dynamic classes like `border-${color}` not compiled | Explicit class name maps with full Tailwind classes |
| Recharts Tooltip types | `value` is `number | undefined`, `name` is `string | undefined` | Type guards before using formatter params |
