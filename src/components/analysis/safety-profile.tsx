'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TargetProfile } from '@/lib/types/target-profile';

type RiskLevel = 'low' | 'moderate' | 'high' | 'caution';

interface SafetySignal {
  id: string;
  title: string;
  description: string;
  risk: 'low' | 'moderate' | 'high';
  icon: 'check' | 'warning' | 'alert';
}

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  low: { label: 'Low Risk', color: '#10B981', bgColor: 'rgba(16,185,129,0.10)', borderColor: '#10B981' },
  moderate: { label: 'Moderate Risk', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.10)', borderColor: '#F59E0B' },
  caution: { label: 'Caution', color: '#F97316', bgColor: 'rgba(249,115,22,0.10)', borderColor: '#F97316' },
  high: { label: 'High Risk', color: '#EF4444', bgColor: 'rgba(239,68,68,0.10)', borderColor: '#EF4444' },
};

function assessRisk(profile: TargetProfile): RiskLevel {
  let riskScore = 0;
  const ag = profile.rawData.alphagenome.data;
  const ct = profile.rawData.clinicalTrials.data;
  const chembl = profile.rawData.chembl.data;

  // High expression breadth = systemic risk
  if ((ag?.expressionBreadth ?? 0) > 70) riskScore += 2;
  else if ((ag?.expressionBreadth ?? 0) > 40) riskScore += 1;

  // Clinical attrition signal
  const totalTrials = ct?.totalTrials ?? 0;
  const maxPhase = chembl?.maxClinicalPhase ?? 0;
  if (totalTrials > 50 && maxPhase < 3) riskScore += 3;
  else if (totalTrials > 20 && maxPhase < 4) riskScore += 2;

  // Very high disease associations = may be essential gene
  const diseaseCount = profile.rawData.openTargets.data?.diseaseAssociationCount ?? 0;
  if (diseaseCount > 200) riskScore += 1;

  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'caution';
  if (riskScore >= 1) return 'moderate';
  return 'low';
}

function buildSignals(profile: TargetProfile): SafetySignal[] {
  const signals: SafetySignal[] = [];
  const ag = profile.rawData.alphagenome.data;
  const ct = profile.rawData.clinicalTrials.data;
  const chembl = profile.rawData.chembl.data;
  const ot = profile.rawData.openTargets.data;

  // 1. Expression Breadth
  const breadth = ag?.expressionBreadth ?? 0;
  if (breadth > 70) {
    signals.push({
      id: 'expression',
      title: 'Expression Breadth',
      description: `Expression breadth is ${breadth.toFixed(0)}% (high). This gene is expressed across many tissues, increasing the risk of systemic off-target effects when modulated.`,
      risk: 'high',
      icon: 'alert',
    });
  } else if (breadth > 40) {
    signals.push({
      id: 'expression',
      title: 'Expression Breadth',
      description: `Expression breadth is ${breadth.toFixed(0)}% (moderate). The gene shows intermediate tissue selectivity. Careful dose-response studies recommended.`,
      risk: 'moderate',
      icon: 'warning',
    });
  } else {
    signals.push({
      id: 'expression',
      title: 'Expression Breadth',
      description: `Expression breadth is ${breadth.toFixed(0)}% (low). The gene appears tissue-selective, reducing the risk of widespread off-target effects.`,
      risk: 'low',
      icon: 'check',
    });
  }

  // 2. Clinical Attrition
  const totalTrials = ct?.totalTrials ?? 0;
  const maxPhase = chembl?.maxClinicalPhase ?? 0;
  if (totalTrials > 50 && maxPhase < 3) {
    signals.push({
      id: 'attrition',
      title: 'Clinical Attrition',
      description: `${totalTrials} clinical trials recorded but max phase reached is only ${maxPhase}. Massive clinical effort with limited advancement suggests potential safety or efficacy barriers.`,
      risk: 'high',
      icon: 'alert',
    });
  } else if (totalTrials > 20 && maxPhase < 4) {
    signals.push({
      id: 'attrition',
      title: 'Clinical Attrition',
      description: `${totalTrials} trials with max phase ${maxPhase}. Significant clinical activity without full approval may indicate safety/efficacy challenges.`,
      risk: 'moderate',
      icon: 'warning',
    });
  } else if (totalTrials > 0) {
    signals.push({
      id: 'attrition',
      title: 'Clinical Attrition',
      description: totalTrials > 0 && maxPhase >= 4
        ? `${totalTrials} trials with approved drug(s) (Phase ${maxPhase}). Strong clinical track record with successful regulatory outcomes.`
        : `${totalTrials} trial(s) in pipeline. Limited clinical data to assess attrition risk.`,
      risk: maxPhase >= 4 ? 'low' : 'moderate',
      icon: maxPhase >= 4 ? 'check' : 'warning',
    });
  } else {
    signals.push({
      id: 'attrition',
      title: 'Clinical Attrition',
      description: 'No clinical trials recorded. This is a pre-clinical target with no human safety data available.',
      risk: 'moderate',
      icon: 'warning',
    });
  }

  // 3. Regulatory Complexity
  const regComplexity = ag?.regulatoryComplexity ?? 'low';
  const featureCount = ag?.regulatoryFeatureCount ?? 0;
  if (regComplexity === 'high') {
    signals.push({
      id: 'regulatory',
      title: 'Regulatory Complexity',
      description: `High regulatory complexity with ${featureCount} regulatory features. Complex enhancer/promoter landscape increases the difficulty of predicting off-target transcriptional effects.`,
      risk: 'moderate',
      icon: 'warning',
    });
  } else if (regComplexity === 'moderate') {
    signals.push({
      id: 'regulatory',
      title: 'Regulatory Complexity',
      description: `Moderate regulatory complexity (${featureCount} features). Standard regulatory landscape with manageable prediction confidence.`,
      risk: 'low',
      icon: 'check',
    });
  } else {
    signals.push({
      id: 'regulatory',
      title: 'Regulatory Complexity',
      description: `Low regulatory complexity (${featureCount} features). Simple regulatory landscape — easier to predict drug effects on gene expression.`,
      risk: 'low',
      icon: 'check',
    });
  }

  // 4. Essential Gene Risk
  const diseaseCount = ot?.diseaseAssociationCount ?? 0;
  if (diseaseCount > 200) {
    signals.push({
      id: 'essential',
      title: 'Essential Gene Risk',
      description: `Associated with ${diseaseCount} diseases. Extremely high disease association count suggests this may be an essential gene — complete inhibition could have severe consequences.`,
      risk: 'high',
      icon: 'alert',
    });
  } else if (diseaseCount > 50) {
    signals.push({
      id: 'essential',
      title: 'Essential Gene Risk',
      description: `Associated with ${diseaseCount} diseases. High disease count warrants investigation of gene essentiality before pursuing full inhibition strategies.`,
      risk: 'moderate',
      icon: 'warning',
    });
  } else {
    signals.push({
      id: 'essential',
      title: 'Essential Gene Risk',
      description: `Associated with ${diseaseCount} disease(s). Limited disease breadth suggests this is unlikely to be an essential gene.`,
      risk: 'low',
      icon: 'check',
    });
  }

  // 5. Compound Selectivity
  const compounds = chembl?.topCompounds ?? [];
  const ro5Violators = compounds.filter(
    (c) => c.numRo5Violations !== null && c.numRo5Violations >= 2
  ).length;
  const totalWithData = compounds.filter((c) => c.numRo5Violations !== null).length;

  if (totalWithData > 0) {
    const violationRate = ro5Violators / totalWithData;
    if (violationRate > 0.5) {
      signals.push({
        id: 'selectivity',
        title: 'Compound Selectivity',
        description: `${ro5Violators} of ${totalWithData} compounds have 2+ RO5 violations (${(violationRate * 100).toFixed(0)}%). High violation rate raises toxicity and bioavailability concerns.`,
        risk: 'high',
        icon: 'alert',
      });
    } else if (violationRate > 0.2) {
      signals.push({
        id: 'selectivity',
        title: 'Compound Selectivity',
        description: `${ro5Violators} of ${totalWithData} compounds have 2+ RO5 violations (${(violationRate * 100).toFixed(0)}%). Moderate violation rate — lead optimization may improve drug-likeness.`,
        risk: 'moderate',
        icon: 'warning',
      });
    } else {
      signals.push({
        id: 'selectivity',
        title: 'Compound Selectivity',
        description: `Only ${ro5Violators} of ${totalWithData} compounds have 2+ RO5 violations (${(violationRate * 100).toFixed(0)}%). Most compounds are drug-like with favorable selectivity profiles.`,
        risk: 'low',
        icon: 'check',
      });
    }
  } else {
    signals.push({
      id: 'selectivity',
      title: 'Compound Selectivity',
      description: 'No compound property data available to assess drug-likeness and selectivity risk.',
      risk: 'moderate',
      icon: 'warning',
    });
  }

  return signals;
}

function SignalIcon({ type }: { type: 'check' | 'warning' | 'alert' }) {
  if (type === 'check') {
    return (
      <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (type === 'warning') {
    return (
      <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 9v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const SIGNAL_RISK_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#10B981' },
  moderate: { label: 'Moderate', color: '#F59E0B' },
  high: { label: 'High', color: '#EF4444' },
};

interface SafetyProfileProps {
  profile: TargetProfile;
  className?: string;
}

export function SafetyProfile({ profile, className }: SafetyProfileProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const risk = assessRisk(profile);
  const signals = buildSignals(profile);
  const config = RISK_CONFIG[risk];

  const highCount = signals.filter((s) => s.risk === 'high').length;
  const modCount = signals.filter((s) => s.risk === 'moderate').length;

  return (
    <div
      className={cn('rounded-xl border border-white/5 overflow-hidden', className)}
      style={{ backgroundColor: 'var(--surface-1)', borderLeftWidth: '3px', borderLeftColor: config.borderColor }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-5 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Shield icon */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.bgColor }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={2}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-sm font-semibold text-white">Target Safety Assessment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {highCount > 0 && <span className="text-red-400">{highCount} high risk</span>}
              {highCount > 0 && modCount > 0 && <span> &middot; </span>}
              {modCount > 0 && <span className="text-amber-400">{modCount} moderate</span>}
              {highCount === 0 && modCount === 0 && <span className="text-emerald-400">All signals favorable</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-2.5 py-1 text-xs font-bold rounded-lg"
            style={{ backgroundColor: config.bgColor, color: config.color }}
          >
            {config.label}
          </span>
          <svg
            className={cn('w-4 h-4 text-slate-500 transition-transform duration-200', isExpanded && 'rotate-180')}
            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-3 animate-fade-in-up">
          {/* Signal cards */}
          {signals.map((signal) => {
            const riskInfo = SIGNAL_RISK_LABEL[signal.risk];
            return (
              <div
                key={signal.id}
                className="flex gap-3 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <SignalIcon type={signal.icon} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{signal.title}</span>
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-semibold rounded"
                      style={{ backgroundColor: riskInfo.color + '20', color: riskInfo.color }}
                    >
                      {riskInfo.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{signal.description}</p>
                </div>
              </div>
            );
          })}

          {/* Methodology note */}
          <p className="text-[10px] text-slate-600 leading-relaxed pt-2 border-t border-white/5">
            Safety signals are derived from expression breadth, clinical attrition patterns, regulatory complexity,
            disease association breadth, and compound drug-likeness. This is a computational assessment &mdash;
            not a substitute for formal toxicology studies.
          </p>
        </div>
      )}
    </div>
  );
}
