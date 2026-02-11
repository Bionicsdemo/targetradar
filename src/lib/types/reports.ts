export interface ReportOptions {
  includeAiSummary: boolean;
  includeRawData: boolean;
  includeMethodology: boolean;
}

export interface DocxSection {
  title: string;
  content: string;
  data?: Record<string, unknown>;
}
