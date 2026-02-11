import { CLINICAL_TRIALS_BASE_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import type { ServiceResult, ClinicalTrialsData } from '../types/target-profile';
import { daysAgo } from '../utils/format';

interface CTStudy {
  protocolSection: {
    identificationModule?: {
      nctId: string;
      briefTitle: string;
      organization?: { fullName: string };
    };
    designModule?: {
      phases?: string[];
      enrollmentInfo?: {
        count?: number;
        type?: string;
      };
    };
    statusModule?: {
      overallStatus: string;
      startDateStruct?: { date?: string };
    };
    conditionsModule?: {
      conditions?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type?: string;
        name?: string;
      }>;
    };
  };
}

interface CTResponse {
  totalCount: number;
  studies: CTStudy[];
}

async function ctFetch(params: string): Promise<CTResponse> {
  const url = `${CLINICAL_TRIALS_BASE_URL}/studies?${params}`;
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`ClinicalTrials API error: ${response.status}`);
  return response.json() as Promise<CTResponse>;
}

function extractPhase(phases: string[] | undefined): string {
  if (!phases || phases.length === 0) return 'N/A';
  return phases[0];
}

export async function fetchClinicalTrialsData(gene: string): Promise<ServiceResult<ClinicalTrialsData>> {
  const startTime = Date.now();
  const cacheKey = `ct-data-${gene}`;
  const cached = cacheGet<ClinicalTrialsData>(cacheKey);
  if (cached) return createServiceResult('ClinicalTrials.gov', cached, startTime, true);

  try {
    const baseParams = `query.term=${encodeURIComponent(gene)}&countTotal=true&pageSize=50`;

    const [allResult, recruitingResult] = await Promise.allSettled([
      ctFetch(baseParams),
      ctFetch(`${baseParams}&filter.overallStatus=RECRUITING`),
    ]);

    const allStudies = allResult.status === 'fulfilled' ? allResult.value : { totalCount: 0, studies: [] };
    const recruitingStudies = recruitingResult.status === 'fulfilled' ? recruitingResult.value : { totalCount: 0, studies: [] };

    const trialsByPhase: Record<string, number> = {};
    const trialsByStatus: Record<string, number> = {};
    const sponsorCounts = new Map<string, number>();
    const twoYearsAgoStr = daysAgo(730);

    let recentTrials = 0;

    const studies = allStudies.studies.map((s) => {
      const phase = extractPhase(s.protocolSection.designModule?.phases);
      trialsByPhase[phase] = (trialsByPhase[phase] || 0) + 1;

      const status = s.protocolSection.statusModule?.overallStatus ?? 'Unknown';
      trialsByStatus[status] = (trialsByStatus[status] || 0) + 1;

      const sponsor = s.protocolSection.identificationModule?.organization?.fullName ?? 'Unknown';
      sponsorCounts.set(sponsor, (sponsorCounts.get(sponsor) || 0) + 1);

      const startDate = s.protocolSection.statusModule?.startDateStruct?.date ?? '';
      if (startDate >= twoYearsAgoStr) recentTrials++;

      const enrollment = s.protocolSection.designModule?.enrollmentInfo?.count ?? null;
      const conditions = s.protocolSection.conditionsModule?.conditions ?? [];
      const interventions = (s.protocolSection.armsInterventionsModule?.interventions ?? [])
        .map((i) => i.name ?? i.type ?? '')
        .filter(Boolean);

      return {
        nctId: s.protocolSection.identificationModule?.nctId ?? '',
        title: s.protocolSection.identificationModule?.briefTitle ?? '',
        phase,
        status,
        sponsor,
        startDate,
        enrollment,
        conditions,
        interventions,
      };
    });

    const sponsorTrialCounts = Array.from(sponsorCounts.entries())
      .map(([sponsor, count]) => ({ sponsor, count }))
      .sort((a, b) => b.count - a.count);

    const data: ClinicalTrialsData = {
      totalTrials: allStudies.totalCount,
      trialsByPhase,
      trialsByStatus,
      activeTrials: recruitingStudies.totalCount,
      sponsors: sponsorTrialCounts.slice(0, 20).map((s) => s.sponsor),
      sponsorTrialCounts,
      recentTrials,
      studies,
    };

    cacheSet(cacheKey, data);
    return createServiceResult('ClinicalTrials.gov', data, startTime);
  } catch (err) {
    return createErrorResult<ClinicalTrialsData>(
      'ClinicalTrials.gov',
      err instanceof Error ? err.message : 'Unknown error',
      startTime
    );
  }
}
