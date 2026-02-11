# TargetRadar

**Drug Target Validation in 30 Seconds**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.6.0-green.svg)](CHANGELOG.md)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://typescriptlang.org)
[![AlphaGenome](https://img.shields.io/badge/AlphaGenome-Integrated-4285F4)](https://github.com/google-deepmind/alphagenome_research)

---

## The Problem

Drug target validation requires querying 7+ specialized databases, years of domain expertise to interpret results, and weeks of manual work to compile a report. Enterprise tools like Clarivate or Informa Pharma Intelligence cost **$50-200K/year**.

Academic researchers, biotech startups, patient advocates, and science journalists are **locked out**.

## The Solution

**TargetRadar puts enterprise-grade target validation in everyone's hands -- free, open source, in 30 seconds.**

Search any gene target. Get a comprehensive **7-dimension analysis** -- including **AlphaGenome-powered regulatory genomics** -- with real-time data from public APIs, AI-powered scientific narratives, and professional downloadable reports. No account needed. No paywall.

---

## Who Is This For?

- **PhD Students** -- Choose thesis targets with confidence
- **Biotech Investors** -- Due diligence on target pipelines
- **Academic Labs** -- Prioritize new research projects
- **Patient Advocacy Groups** -- Understand disease target landscapes
- **Science Journalists** -- Research drug development stories
- **Small Pharma Teams** -- Enterprise insights without enterprise cost
- **Regulatory Genomics Researchers** -- AlphaGenome-compatible regulatory landscape analysis

---

## Features

### Seven-Dimension Scoring
Every target is scored across 7 dimensions (0-100 each) with transparent, auditable component breakdowns:

| Dimension | Data Source | What It Measures |
|-----------|-----------|-----------------|
| Genetic Evidence | Open Targets | Disease associations, evidence diversity, tractability |
| Chemical Tractability | ChEMBL | Compounds, mechanisms, bioactivity, clinical phases |
| Structural Readiness | AlphaFold/PDB | 3D structures, resolution, AlphaFold confidence |
| Clinical History | ClinicalTrials.gov | Trial count, phase progression, active studies |
| **Regulatory Genomics** | **AlphaGenome / Ensembl** | **Enhancers, promoters, CTCF sites, constrained elements, expression breadth** |
| Literature Depth | PubMed | Publication volume, recency, drug-focus, reviews |
| Innovation Signal | bioRxiv | Preprint velocity, research group diversity |

### AlphaGenome Integration
Inspired by [Google DeepMind's AlphaGenome](https://github.com/google-deepmind/alphagenome_research) -- the state-of-the-art model for DNA regulatory variant-effect prediction. TargetRadar maps the regulatory landscape around each target:
- **Enhancer landscape** -- distal regulatory elements controlling tissue-specific expression
- **Promoter architecture** -- transcription initiation sites and their complexity
- **CTCF binding sites** -- chromatin insulator elements defining topological domains
- **Constrained elements** -- evolutionarily conserved regulatory sequences
- **Transcript complexity** -- alternative splicing and isoform diversity

### AI-Powered Analysis (12 Features)
1. **Target Intelligence Brief** -- 3-paragraph expert synthesis across all 7 dimensions
2. **Comparison Analysis** -- Side-by-side analysis of two targets with regulatory insights
3. **Next Steps Recommender** -- 3 specific, actionable investigation steps
4. **Drug Hypothesis Generator** -- Molecule type, mechanism, patient population
5. **Report Executive Summary** -- Unique AI-generated summary per target
6. **Compound Portfolio Analysis** -- SAR trends, chemical diversity, drug-likeness assessment, development gaps
7. **Pharmacology & Safety** -- ADMET assessment, toxicology flags, pharmacology summary, safety signals
8. **Competitive Intelligence** -- Market landscape, competitor analysis, white space identification
9. **Evidence Conflicts** -- Cross-dimensional contradiction detection and resolution
10. **Mutation Impact** -- Variant effect prediction on drug target function
11. **Pathway Crosstalk** -- Signaling network analysis and pathway interactions
12. **Trial Design** -- AI-recommended clinical trial strategies for the target

### Molecule Testing Lab
Test your own molecules against drug-likeness rules and compare them to known compounds:
- **SMILES Resolution** -- Enter a SMILES string, auto-resolve properties via PubChem
- **Manual Entry** -- Input molecular properties directly (MW, LogP, TPSA, HBA, HBD, RotB)
- **Drug-Likeness Assessment** -- Instant Lipinski RO5 + Veber rules evaluation with radar chart
- **Chemical Space Comparison** -- Overlay your molecule on known target compounds (MW vs LogP scatter)
- **Molecule History** -- All tested molecules persisted in localStorage

### DeepTarget Discovery
Enter a disease name and let AI autonomously discover, evaluate, and rank every potential drug target:
- **Disease Search** -- Autocomplete from Open Targets disease ontology
- **8-Phase Pipeline** -- Animated discovery from Disease Ontology Mapping through AI Ranking
- **Autonomous Scoring** -- Top 5 targets automatically scored across all 7 dimensions
- **AI Discovery Analysis** -- Synthesized narrative explaining target rankings
- **Direct Links** -- Click any discovered target for full analysis

### Molecular Docking Panel
- **3D Compound Visualization** -- Docking panel with protein structure and compound viewer
- **PDB/AlphaFold Fallback** -- Automatically falls back to AlphaFold prediction if crystal structure unavailable
- **Compound Selector** -- Browse and select from known compounds for visualization

### Compound Intelligence
- **Compound Gallery** -- 2D structure images from ChEMBL, phase badges, molecular properties
- **Drug-Likeness Assessment** -- Lipinski Rule of 5 + Veber rules with mini radar charts
- **Bioactivity Distribution** -- pChEMBL histogram across potency ranges
- **Chemical Space** -- MW vs LogP scatter plot with drug-like zone overlay

### Clinical Trials Dashboard
- **Phase Funnel** -- Trial progression from Phase 1 through Phase 4
- **Status Distribution** -- Pie chart of trial statuses (Recruiting, Active, Completed, etc.)
- **Sponsor Diversity** -- Top 5 sponsors bar chart
- **Trial Timeline** -- Area chart of trial starts by year
- **Trial Cards** -- Top 5 trials with NCT ID, enrollment, conditions, interventions

### Cinema-Grade 3D Protein Visualization
Interactive 3D protein structure viewer powered by 3Dmol.js:
- **Experimental PDB structures** with priority over AlphaFold predictions
- **Three color schemes** -- Secondary structure (violet/indigo/gray), pLDDT confidence, hydrophobicity
- **Binding site highlighting** in orange with stick representation
- **Auto-rotation** with dark cinematic background
- **Quality metrics** -- PDB count, best resolution, pLDDT score, ligand-bound structures

### Professional Reports
- **.docx** -- 13-section Word report with AI executive summary and regulatory genomics
- **.xlsx** -- 8-sheet Excel workbook with all data and methodology

### Comparison Mode
Overlay two targets on a single 7-axis radar chart with AI-generated comparative analysis and dimension-by-dimension scoring table.

---

## Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd targetradar

# Install dependencies
npm install

# Set your Anthropic API key (required for AI features)
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and search for a gene target.

### Pages

| Route | Description |
|-------|-------------|
| `/` | Home -- search for any gene target |
| `/analyze/[gene]` | Full 7-dimension analysis with AI insights |
| `/compare` | Side-by-side comparison of two targets |
| `/discover` | DeepTarget Discovery -- AI-driven disease-to-target pipeline |
| `/lab` | Molecule Testing Lab -- test your own molecules against drug-likeness rules |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for AI) | Anthropic API key for Claude-powered analysis |
| `NCBI_API_KEY` | No | PubMed rate limit boost (10/sec vs 3/sec) |
| `NEXT_PUBLIC_APP_URL` | No | App URL (defaults to http://localhost:3000) |

---

## Architecture

```
Pages: Home | Analyze | Compare | Discover | Lab
                    |
          Gene/Disease Resolution
                    |
         Parallel API Fetching (7 sources)
                    |
      Scoring Engine (7 dimensions) + AI Analysis (12 features)
                    |
     Radar Chart | 3D Viewer | Compound Intelligence | Reports
```

29 API routes power the backend, handling everything from gene resolution and multi-source data fetching to AI narrative generation and report export.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Charts | Recharts |
| 3D Visualization | 3Dmol.js (CDN) |
| Reports | docx, ExcelJS |
| AI | @anthropic-ai/sdk (Claude Opus 4.6) |
| Regulatory Data | Ensembl REST API (AlphaGenome-compatible) |
| Compound Images | PubChem REST API (server-side proxy) |

### Scoring Methodology

The overall score is a weighted average of 7 dimensions:
- **Chemical Tractability**: 22% (most actionable)
- **Genetic Evidence**: 18%
- **Clinical History**: 18%
- **Structural Readiness**: 13%
- **Regulatory Genomics**: 12% (AlphaGenome)
- **Literature Depth**: 9%
- **Innovation Signal**: 8%

Each dimension score (0-100) is calculated from 4-5 components with defined caps and thresholds. All scoring functions are pure, testable, and transparent.

---

## API Data Sources

All data is fetched live from free public APIs:

- [Open Targets Platform](https://platform.opentargets.org/) -- Genetic evidence, disease associations
- [ChEMBL](https://www.ebi.ac.uk/chembl/) -- Chemical compounds, bioactivity, mechanisms
- [PubMed/NCBI](https://pubmed.ncbi.nlm.nih.gov/) -- Scientific publications
- [ClinicalTrials.gov](https://clinicaltrials.gov/) -- Clinical trial data
- [bioRxiv](https://www.biorxiv.org/) -- Preprints and emerging research
- [AlphaFold DB](https://alphafold.ebi.ac.uk/) / [PDB](https://www.rcsb.org/) -- Protein structures
- [Ensembl Regulation](https://rest.ensembl.org/) -- Regulatory features, constrained elements (AlphaGenome-compatible)
- [PubChem](https://pubchem.ncbi.nlm.nih.gov/) -- SMILES resolution, 2D structure images, molecular properties

---

## Test Targets

| Target | Overall | Genetic | Chemical | Structural | Clinical | Regulatory | Literature | Innovation |
|--------|---------|---------|----------|------------|----------|------------|------------|------------|
| EGFR | 89 | High | High | High | High | Moderate | High | Low |
| TP53 | 66 | High | Low | Moderate | Moderate | High | High | Low |
| BRCA1 | 67 | High | Low | Moderate | Moderate | High | High | Low |
| KRAS | ~78 | High | Moderate | High | High | Moderate | High | Low |
| PCSK9 | ~79 | High | High | Moderate | High | Moderate | Moderate | Low |

---

## License

MIT License -- see [LICENSE](LICENSE) for details.

Copyright (c) 2026 Heinz Jungbluth -- CEO Spectrix RD

---

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
