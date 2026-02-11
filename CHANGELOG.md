# Changelog

All notable changes to TargetRadar will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.6.0] — 2026-02-10

### Added — Molecule Testing Lab, DeepTarget Discovery, Molecular Docking & Extended AI

**Molecule Testing Lab (`/lab`):**
- New page: test custom molecules against drug-likeness rules
- SMILES string input with PubChem auto-resolve (properties auto-filled)
- Manual molecular property entry (MW, LogP, TPSA, HBA, HBD, RotB)
- Optional target gene linking with autocomplete
- Drug-likeness assessment reusing existing DrugLikenessPanel + PropertyScatter
- Chemical space comparison (user molecule overlaid on known target compounds)
- Molecule history persisted in localStorage (up to 20 entries)
- New API routes: `/api/lab/resolve` (PubChem proxy), `/api/lab/sdf3d`
- New types: `LabMolecule`, `LabFormState`, `labMoleculeToCompoundDetail()` bridge
- New components: `molecule-form.tsx`, `results-panel.tsx`, `molecule-history.tsx`
- New hook: `use-lab-molecules.ts` (localStorage persistence)

**DeepTarget Discovery (`/discover`):**
- New page: enter a disease, autonomously discover and rank all associated drug targets
- Disease search with Open Targets GraphQL autocomplete
- 8-phase animated discovery pipeline (Disease Ontology → AI Ranking)
- Autonomous scoring of top 5 targets via internal `/api/analyze` calls
- AI-generated discovery analysis narrative
- Target ranking with score bars, association scores, direct links to full analysis
- Additional unscored targets displayed as chips
- New API routes: `/api/discover` (POST), `/api/discover/search` (GET)

**Molecular Docking Panel:**
- 3D compound docking visualization in protein-viewer context
- PDB → AlphaFold fallback chain (if crystal structure 404s, tries AlphaFold prediction)
- Compound selector bar filtering by SMILES availability
- Side-by-side protein structure + compound 2D viewer
- Graceful error states for missing structures

**Extended AI Features (5 new, total 12):**
- `/api/ai/competitive` — Competitive Intelligence analysis
- `/api/ai/conflicts` — Evidence Conflicts detection across data sources
- `/api/ai/mutation` — Mutation Impact prediction
- `/api/ai/pathway` — Pathway Crosstalk analysis
- `/api/ai/trial-design` — AI Trial Design recommendations
- `/api/ai/deep-hypothesis` — Deep Drug Hypothesis generation
- New components: `competitive-intelligence.tsx`, `evidence-conflicts.tsx`, `mutation-impact.tsx`, `pathway-crosstalk.tsx`, `trial-design.tsx`, `deep-hypothesis.tsx`

**Regulatory Genomics Dashboard:**
- `regulatory-dashboard.tsx` — comprehensive regulatory landscape view
- `regulatory-feature-bar.tsx` — bar chart of feature type distribution
- `regulatory-pie.tsx` — pie chart of regulatory element categories
- `conservation-gauge.tsx` — gauge for constrained element density
- `genomic-landscape-radar.tsx` — radar chart for regulatory complexity

**Compound Image Proxy:**
- `/api/compound/image` — server-side PubChem 2D structure image proxy (PNG)
- Avoids CORS issues, 7-day cache headers, size parameter support

**New Files (30):**
- `src/app/lab/page.tsx`
- `src/app/discover/page.tsx`
- `src/app/api/lab/resolve/route.ts`
- `src/app/api/lab/sdf3d/route.ts`
- `src/app/api/discover/route.ts`
- `src/app/api/discover/search/route.ts`
- `src/app/api/compound/image/route.ts`
- `src/app/api/ai/competitive/route.ts`
- `src/app/api/ai/conflicts/route.ts`
- `src/app/api/ai/mutation/route.ts`
- `src/app/api/ai/pathway/route.ts`
- `src/app/api/ai/trial-design/route.ts`
- `src/app/api/ai/deep-hypothesis/route.ts`
- `src/components/lab/molecule-form.tsx`
- `src/components/lab/results-panel.tsx`
- `src/components/lab/molecule-history.tsx`
- `src/components/ai/competitive-intelligence.tsx`
- `src/components/ai/evidence-conflicts.tsx`
- `src/components/ai/mutation-impact.tsx`
- `src/components/ai/pathway-crosstalk.tsx`
- `src/components/ai/trial-design.tsx`
- `src/components/ai/deep-hypothesis.tsx`
- `src/components/genomics/regulatory-dashboard.tsx`
- `src/components/charts/regulatory-feature-bar.tsx`
- `src/components/charts/regulatory-pie.tsx`
- `src/components/charts/conservation-gauge.tsx`
- `src/components/charts/genomic-landscape-radar.tsx`
- `src/components/protein/docking-panel.tsx`
- `src/hooks/use-lab-molecules.ts`
- `src/lib/types/lab.ts`

---

## [0.5.1] — 2026-02-10

### Fixed — Comprehensive System-Wide Bug Fixes

**Critical Runtime Fixes:**
- Fixed `Cannot read properties of null (reading 'search')` crash when Open Targets GraphQL returns `{ data: null }`
- Fixed `graphqlFetch()` to detect and surface GraphQL `errors` array instead of silently returning null
- Fixed Lab page compound comparison (API response shape was `data.rawData` not `data.profile.rawData`)
- Fixed 14 instances of unsafe `message.content[0]` access in AI analysis (Anthropic SDK content array can be empty)
- Fixed `selectedCompound.smiles!` non-null assertion crash in docking panel → null guard

**Null Safety (API Routes):**
- `discover/route.ts`: `data.data?.disease`, `associatedTargets?.rows ?? []`, `?.count ?? 0`
- `discover/search/route.ts`: `data.data?.search?.hits ?? []`
- `chembl.ts`: `result.targets ?? []`, `mechanisms ?? []`, `page_meta?.total_count ?? 0`
- `pubmed.ts`: `json.esearchresult?.count ?? '0'`
- `alphafold.ts`: Wrapped JSON.parse in try/catch for malformed PDB search responses
- `biorxiv.ts`: Added `escapeRegex()` for gene names with regex metacharacters (e.g., `C4B(P)`)

**Null Safety (React Components):**
- `use-search.ts`: `data.results ?? []`
- `discover/page.tsx`: `data.results ?? []`, interval cleanup on unmount
- `score-counter.tsx`: Added `cancelled` flag for requestAnimationFrame cleanup

**Type Safety & Schema Corrections:**
- `api-responses.ts`: Fixed `componentId` → `id` in OpenTargets datasource score schema
- `api-responses.ts`: ChEMBL `pchembl_value`/`standard_value` accept `string | number` (API returns strings)
- `api-responses.ts`: ChEMBL `alogp`/`psa`/`molecular_weight` accept `string | number`, added `full_mwt` field
- `api-responses.ts`: Added `globalMetricValue` to AlphaFold prediction schema

**Input Validation:**
- `compound/image/route.ts`: parseInt NaN guard for `size` parameter (defaults to 300)
- `molecule-form.tsx`: Safe `parseFloat`/`parseInt` helpers prevent NaN propagation from user input
- `format.ts`: `linearScale()` division-by-zero guard (`cap <= 0` returns 0)

**UI Fixes:**
- Fixed Tailwind dynamic border classes not being compiled (explicit class name map in `ai-section.tsx`)
- Drug-likeness panel: filters to small molecules only (RO5 doesn't apply to antibodies), sorts by fewest violations, shows violation count badge
- Added `id`/`name` attributes to all 13 form inputs across 5 files (fixes browser autofill warnings)
- `EARLY_PHASE1` clinical trials now scored (was being ignored)

**Infrastructure:**
- Added `AbortSignal.timeout(20_000)` to internal discover→analyze fetch calls
- PDB→AlphaFold fallback chain for unavailable crystal structures
- All `JSON.parse` calls wrapped in try/catch

### Verified
- TypeScript: 0 errors
- Production build: 29 routes, clean compilation
- All pages return 200: `/`, `/analyze/EGFR`, `/lab`, `/compare`, `/discover`
- All API endpoints tested: health, search, analyze (EGFR, TP53, BRCA1, KRAS, PCSK9), compound image, lab resolve

---

## [0.5.0] — 2026-02-10

### Added — Compound Intelligence, Clinical Analytics & AI Pharmacology

**Compound Intelligence (Phase 1-2):**
- Expanded ChEMBL service to fetch full molecule details (MW, LogP, TPSA, HBA, HBD, RO5 violations, SMILES, aromatic rings, rotatable bonds)
- Fetches top activities with pChEMBL ≥ 7 and resolves top 8 unique compounds in parallel
- 2D structure images from ChEMBL SVG API with dark-mode inversion filter
- New `CompoundDetail` and `CompoundActivity` types
- **Compound Gallery** — responsive grid of compound cards with 2D structures, phase badges, molecular properties, expandable detail tables
- **Drug-Likeness Panel** — Lipinski Rule of 5 + Veber rules assessment per compound, mini radar charts (5 axes: MW, LogP, TPSA, HBD, HBA), visual rule checkers
- **Bioactivity Histogram** — pChEMBL distribution in ranges [5-6), [6-7), [7-8), [8-9), [9+]
- **MW vs LogP Scatter Plot** — chemical space visualization with drug-like zone overlay, dots colored by clinical phase

**Clinical Trials Dashboard (Phase 3):**
- Expanded ClinicalTrials.gov data extraction (enrollment, conditions, interventions)
- Aggregated trialsByStatus and sponsorTrialCounts
- **Phase Funnel** — horizontal bar chart showing Phase 1→2→3→4 progression
- **Trial Status Pie** — pie chart with status-based colors (Recruiting/Active/Completed/Terminated)
- **Sponsor Diversity** — top 5 sponsors bar chart
- **Trial Timeline** — area chart of trial starts by year
- Top 5 trial detail cards with NCT ID, phase/status badges, enrollment, conditions, interventions

**AI Pharmacology & Compound Analysis (Phase 4):**
- **AI Compound Portfolio Analysis** — SAR trends, chemical diversity, drug-likeness assessment, development gaps
- **AI Pharmacology & Safety** — ADMET assessment, toxicology flags, pharmacology summary, safety signals from trial data
- Two new API routes: `/api/ai/compounds` and `/api/ai/pharmacology`
- Expanded `buildProfileSummary()` with full compound details and trial analytics

**New Files (14):**
- `src/components/compounds/compound-gallery.tsx`
- `src/components/compounds/drug-likeness-panel.tsx`
- `src/components/charts/bioactivity-chart.tsx`
- `src/components/charts/property-scatter.tsx`
- `src/components/charts/phase-funnel.tsx`
- `src/components/charts/trial-status-pie.tsx`
- `src/components/charts/sponsor-bar.tsx`
- `src/components/charts/trial-timeline.tsx`
- `src/components/clinical/trials-dashboard.tsx`
- `src/lib/utils/drug-likeness.ts`
- `src/app/api/ai/compounds/route.ts`
- `src/app/api/ai/pharmacology/route.ts`
- `src/components/ai/compound-analysis.tsx`
- `src/components/ai/pharmacology-safety.tsx`

---

## [0.4.0] — 2026-02-10

### Added — Cinema-Grade 3D Protein Visualization (v4 Elevation)
- **3Dmol.js integration** — interactive 3D protein structure rendering loaded from CDN
- New component `protein-viewer.tsx` — cinema-grade molecular viewer with:
  - Secondary structure coloring: violet helices (#8B5CF6), indigo sheets (#6366F1), gray coils (#6B7280)
  - pLDDT confidence coloring (B-factor based)
  - Hydrophobicity coloring (RasMol scheme)
  - Binding site highlighting in orange (#FF6B00) with stick representation
  - Auto-rotation (0.5°/frame Y-axis), dark slate background (#0F0F1E)
  - Choreographed loading stages with animated progress bar
  - Error handling with retry button
- New component `structure-panel.tsx` — full UI wrapper with:
  - Color scheme toggle (Structure / Confidence / Hydro)
  - PDB/AlphaFold source badges
  - Quality metrics bar (PDB count, resolution, pLDDT, ligand-bound)
  - Color legend for active scheme
  - Graceful empty state for targets without structures
  - Dynamic import (SSR-disabled) via `next/dynamic`
- Structure panel integrated into analysis results page below radar chart
- CSS animations for loading bar in globals.css
- Updated CLAUDE.md with 3D visualization architecture
- Updated README.md with 3D features and tech stack

---

## [0.3.0] — 2026-02-10

### Added — AlphaGenome Integration
- **7th dimension: Regulatory Genomics** powered by AlphaGenome / Ensembl Regulation API
- New service `alphagenome.ts` — queries Ensembl REST for regulatory features, constrained elements, gene coordinates
- New scorer `regulatory-genomics.ts` — 5-component scoring (0-100) for regulatory landscape
- `AlphaGenomeData` type with 12 fields (enhancers, promoters, CTCF, constrained elements, etc.)
- 7-vertex heptagon radar chart (upgraded from hexagon)
- AlphaGenome data in all AI narratives (7-dimensional synthesis)
- 8th xlsx sheet: Regulatory Genomics
- 13th docx section: Regulatory Genomics
- Enhanced CLAUDE.md with deep domain knowledge (drug discovery framework, modality selection, analytical patterns)
- Updated scoring weights: Chemical 22%, Genetic 18%, Clinical 18%, Structural 13%, Regulatory 12%, Literature 9%, Innovation 8%

### Test Results (7/7 services, 0 errors)
- EGFR: 87/100 — 90 regulatory features, 66 enhancers, 4 promoters, 20 CTCF, 180 constrained
- KRAS: 78/100 — 17 features, 12E/2P/3C, 46 constrained, complexity: high
- BRCA1: 67/100 — 39 features, 23E/9P/7C, 99 constrained, 47 transcripts
- TP53: 66/100 — 40 features, 13E/13P/14C, 41 constrained, 39 transcripts
- PCSK9: 79/100 — 25 features, 16E/4P/5C, 39 constrained
- ZNF835 (novel): 14/100 — 11 features, 1E/1P/6C, 5 constrained (graceful low scores)

---

## [0.2.0] — 2026-02-10

### Added — Full Platform Build
- Complete 6-dimension analysis with live APIs
- 5 AI features (Claude Sonnet 4.5)
- .docx and .xlsx report generation
- Animated radar chart, live loading state
- Comparison mode with overlaid radar charts

### Fixed
- Open Targets `componentId` → `id` in datasourceScores
- UniProt `+AND+reviewed:true` for Swiss-Prot entries
- AlphaFold `globalMetricValue` field
- bioRxiv 5 pages parallel for better coverage

---

## [0.1.0] — 2026-02-10

### Added
- Project initialization with complete architecture documentation
- `CLAUDE.md` — comprehensive project configuration (500+ lines)
- `LICENSE` — MIT License (Heinz Jungbluth — CEO Spectrix RD)
- `CHANGELOG.md` — this file with full roadmap
- Architecture Decision Records (ADR-001 through ADR-007)

---

## Roadmap

### [0.2.0] — Foundation (Day 1 AM)

- [x] Next.js 14+ project setup with TypeScript strict mode
- [x] Tailwind CSS + shadcn/ui component library initialization
- [x] Install all dependencies (recharts, @anthropic-ai/sdk, docx, exceljs, zod)
- [x] Core type definitions (`ServiceResult<T>`, `AnalysisResult`, `DimensionScore`)
- [x] Open Targets service — GraphQL queries, gene resolution, disease associations
- [x] ChEMBL service — target search, mechanisms, bioactivity, compound details
- [x] PubMed service — search counts, date filtering, drug-focused queries
- [x] ClinicalTrials.gov service — study search, phase/status filtering
- [x] bioRxiv service — date-range fetching, client-side keyword filtering
- [x] AlphaFold + PDB service — structure counts, confidence scores, UniProt resolution
- [x] Scoring engine — 6 pure scoring functions with exact algorithms
- [x] Scoring engine orchestrator — weighted overall score calculation
- [x] `POST /api/analyze` — parallel API fetching, scoring, caching
- [x] `GET /api/search` — gene name autocomplete via Open Targets
- [x] `GET /api/health` — service health check endpoint
- [x] In-memory cache with 5-minute TTL
- [x] API client utilities (timeout, retry, error handling)

### [0.3.0] — Core UI (Day 1 PM)

- [x] Home page — hero section, search bar, user personas, recent searches
- [x] Search bar component with autocomplete dropdown
- [x] Animated radar chart (Recharts) — draw-in animation, hover tooltips
- [x] LIVE loading state — real-time API completion indicators with data counts
- [x] Results page — overall score, radar chart, 6 dimension cards
- [x] Dimension card component with score, description, expand trigger
- [x] Dimension grid (2×3 desktop, 1-column mobile)
- [x] Score count-up animation (0 → final value)
- [x] Staggered card reveal animation
- [x] Header and footer layout components
- [x] Loading skeleton components
- [x] Full search → loading → results flow tested with EGFR

### [0.4.0] — AI Integration (Day 2 AM)

- [x] Anthropic SDK client setup (`ai-analysis.ts`)
- [x] AI Target Intelligence Brief — 3-paragraph expert synthesis
- [x] AI Comparison Analysis — comparative analysis with data citations
- [x] AI Next Steps Recommender — 3 actionable investigation steps
- [x] AI Drug Hypothesis Generator — molecule type, mechanism, population
- [x] AI Report Executive Summary — unique per target
- [x] `POST /api/ai/narrative` — target intelligence brief endpoint
- [x] `POST /api/ai/compare` — comparison analysis endpoint
- [x] `POST /api/ai/next-steps` — next steps endpoint
- [x] `POST /api/ai/hypothesis` — drug hypothesis endpoint
- [x] AI content components with "AI Analysis" badges
- [x] AI narrative smooth reveal animation
- [x] AI response caching (5-minute TTL)
- [x] Prompt engineering refinement for scientific quality

### [0.5.0] — Deep Drill-Downs + Reports (Day 2 PM)

- [x] Genetic Evidence detail panel — disease association table, evidence breakdown
- [x] Chemical Tractability detail panel — compound table, bioactivity chart
- [x] Structural Readiness detail panel — PDB list, AlphaFold visualization
- [x] Clinical History detail panel — phase funnel, timeline, sponsors, active trials
- [x] Literature Depth detail panel — publication timeline, top journals
- [x] Innovation Signal detail panel — preprint feed, velocity chart
- [x] .docx report generator (12 sections, AI executive summary, embedded chart)
- [x] .xlsx export generator (7 sheets, formatted)
- [x] `POST /api/export/docx` endpoint
- [x] `POST /api/export/xlsx` endpoint
- [x] Export button component with dropdown (Word, Excel)

### [0.6.0] — Comparison, Demo Polish & Animation (Day 3 AM)

- [x] Comparison page — dual target analysis, overlaid radar chart
- [x] Comparison table — side-by-side scores
- [x] AI comparative narrative in comparison view
- [ ] Animation polish pass — all transitions reviewed and refined
- [ ] Demo mode — pre-warm caches for EGFR, KRAS, BRCA1
- [x] Recent searches — localStorage persistence
- [x] Search history display on home page

### [1.0.0] — Production Release (Day 3 PM)

- [x] Error handling polish — all error states designed
- [x] Empty state for novel/obscure genes
- [ ] Mobile responsive polish (375px)
- [ ] Performance optimization — bundle size, lazy loading
- [x] README.md — hero, screenshots, setup, architecture, contributing
- [ ] Vercel deployment configuration
- [ ] Final testing with all 7 test targets
- [ ] Demo flow rehearsal and timing

---

## Architecture Decision Records

### ADR-001: No Database
**Decision:** No database. All data is fetched live from public APIs with a 5-minute in-memory cache.
**Rationale:** Freshness over persistence. Drug target data changes frequently. Caching handles repeated queries during demos. Eliminates infrastructure complexity.

### ADR-002: Dark Mode Only
**Decision:** Dark mode is the only mode. No light mode toggle.
**Rationale:** Scientific tools (terminals, BLAST, genome browsers) are traditionally dark. Radar chart aesthetics are dramatically better on dark backgrounds. Reduces design surface area.

### ADR-003: Client-Side bioRxiv Filtering
**Decision:** Fetch bioRxiv preprints by date range and filter client-side for gene name mentions.
**Rationale:** bioRxiv API does not support keyword search. Date-range fetching with client-side title/abstract filtering is the only viable approach. Limited to 90-day windows to keep response times reasonable.

### ADR-004: Scoring Transparency
**Decision:** Show full component breakdowns for every dimension score.
**Rationale:** Scientists will scrutinize scores. Transparency builds trust. Users can see exactly why a target scored 72 — which components contributed and which were weak.

### ADR-005: Weighted Overall Score
**Decision:** Chemical Tractability gets the highest weight (0.25).
**Rationale:** Druggability is the most actionable dimension for drug development decisions. Genetic evidence and clinical history share second place (0.20 each). Literature and innovation signal are supporting evidence (0.10 each).

### ADR-006: AI Narrative via Anthropic API
**Decision:** Use Claude (`claude-sonnet-4-5-20250929`) for all AI features. Five distinct integrations.
**Rationale:** AI integration is 25% of the hackathon judging criteria. The narrative that connects dots across dimensions is the "wow" moment. Five features show creative, deep integration beyond a basic chatbot wrapper.

### ADR-007: Demo-First Design
**Decision:** Every design decision prioritizes demo impact.
**Rationale:** Demo is 30% of judging — the single biggest category. The loading state showing real-time API completion IS the demo. Animations make it feel alive. Pre-warmed caches ensure smooth live demos.

---

## Known Limitations

1. **bioRxiv search:** Client-side filtering is imprecise; may miss preprints that discuss a gene without mentioning it in the title/abstract.
2. **AlphaFold coverage:** Not all proteins have AlphaFold predictions. Graceful fallback to PDB-only scoring.
3. **PubMed rate limits:** 3 requests/second without API key, 10/sec with. Multiple queries per target may hit limits for rapid sequential searches.
4. **Gene name ambiguity:** Some gene symbols are common English words (e.g., "REST", "WAS"). Searches use targeted database queries to minimize false positives.
5. **Human-only:** Currently optimized for human (Homo sapiens, organism_id: 9606) drug targets only.
6. **Historical bias:** Well-studied targets (EGFR, TP53) will always score higher on literature dimensions. This reflects reality but may undervalue novel targets. The Innovation Signal dimension partially compensates.
7. **Clinical trial sample:** Phase/status/sponsor data computed from first 50 studies returned by API. TotalTrials count is accurate but breakdowns may underrepresent high-volume targets.
8. **PDB heuristics:** Ligand-bound structure count and best resolution are estimated from total PDB count rather than queried from RCSB metadata.
9. **Innovation Signal floor:** bioRxiv API returns generic recent preprints filtered client-side. Gene-specific preprint counts are systematically low across all targets.
