// Common gene aliases for improved search resolution
const GENE_ALIASES: Record<string, string> = {
  'HER2': 'ERBB2',
  'NEU': 'ERBB2',
  'P53': 'TP53',
  'RAS': 'KRAS',
  'NRAS': 'NRAS',
  'HRAS': 'HRAS',
  'BCL2': 'BCL2',
  'MYC': 'MYC',
  'AKT': 'AKT1',
  'RAF': 'BRAF',
  'MEK': 'MAP2K1',
  'ERK': 'MAPK1',
  'JAK': 'JAK2',
  'STAT': 'STAT3',
  'PD1': 'PDCD1',
  'PDL1': 'CD274',
  'CTLA4': 'CTLA4',
  'ALK': 'ALK',
  'ROS1': 'ROS1',
  'RET': 'RET',
  'FLT3': 'FLT3',
  'IDH1': 'IDH1',
  'IDH2': 'IDH2',
  'PIK3CA': 'PIK3CA',
  'MTOR': 'MTOR',
  'CDK4': 'CDK4',
  'CDK6': 'CDK6',
  'PARP': 'PARP1',
};

export function resolveGeneAlias(input: string): string {
  const normalized = input.trim().toUpperCase();
  return GENE_ALIASES[normalized] ?? normalized;
}

export function isValidGeneSymbol(input: string): boolean {
  const normalized = input.trim().toUpperCase();
  return /^[A-Z][A-Z0-9]{1,15}$/.test(normalized);
}
