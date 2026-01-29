// lib/types.ts
export interface Vulnerability {
  id: number;
  cveId: string;
  packageName: string;
  currentVersion: string;
  fixedVersion?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  cvssScore?: number;
  description: string;
  publishedDate?: string;
  lastModifiedDate?: string;
  kaiStatus?: string;
  riskFactors?: string[];
  cwe?: string[];
  referenceLinks?: string[];
  epssScore?: number;
  exploitAvailable: boolean;
  patchAvailable: boolean;
}

export interface ApiResponse {
  success: boolean;
  data: Vulnerability[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metrics: {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    withExploit: number;
    patchAvailable: number;
    filteredOutByAnalysis: number;
    filteredOutByAI: number;
  };
  chartData: {
    severityDistribution: Array<{ name: string; value: number }>;
    packageDistribution: Array<{ name: string; count: number }>;
    monthlyTrends: Array<{ month: string; CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number }>;
  };
  meta: {
    responseTime: string;
    database: string;
    cacheStatus: string;
    totalDataPoints: number;
  };
}

export interface FilterState {
  search: string;
  severity: string[];
  kaiStatusFilter: 'none' | 'analysis' | 'ai-analysis';
  sortBy: 'cveId' | 'severity' | 'cvssScore' | 'publishedDate' | 'packageName';
  sortOrder: 'asc' | 'desc';
}