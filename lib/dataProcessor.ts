// lib/dataProcessor.ts

import { Vulnerability, FilterState, SeverityDistribution, DashboardMetrics } from './types';

export class DataProcessor {
  private static severityOrder = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    UNKNOWN: 0,
  };

  static normalizeVulnerability(raw: any): Vulnerability {
    return {
      cveId: raw.cveId || raw.id || 'UNKNOWN',
      packageName: raw.packageName || raw.package || 'Unknown Package',
      currentVersion: raw.currentVersion || raw.version || 'Unknown',
      fixedVersion: raw.fixedVersion || raw.fixed_version,
      severity: (raw.severity || 'UNKNOWN').toUpperCase() as Vulnerability['severity'],
      cvssScore: raw.cvssScore || raw.cvss_score || raw.score,
      description: raw.description || 'No description available',
      publishedDate: raw.publishedDate || raw.published_date || raw.publishedAt,
      lastModifiedDate: raw.lastModifiedDate || raw.last_modified || raw.updatedAt,
      kaiStatus: raw.kaiStatus || raw.kai_status,
      riskFactors: raw.riskFactors || raw.risk_factors || [],
      cwe: raw.cwe || [],
      references: raw.references || [],
      epssScore: raw.epssScore || raw.epss_score,
      exploitAvailable: raw.exploitAvailable || raw.exploit_available || false,
      patchAvailable: raw.patchAvailable || raw.patch_available || false,
    };
  }

  static filterVulnerabilities(
    vulnerabilities: Vulnerability[],
    filters: FilterState
  ): Vulnerability[] {
    return vulnerabilities.filter((vuln) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          vuln.cveId.toLowerCase().includes(searchLower) ||
          vuln.packageName.toLowerCase().includes(searchLower) ||
          vuln.description.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Severity filter
      if (filters.severity.length > 0 && !filters.severity.includes(vuln.severity)) {
        return false;
      }

      // KaiStatus filter
      if (filters.kaiStatusFilter === 'analysis') {
        if (vuln.kaiStatus === 'invalid - norisk' || vuln.kaiStatus === 'invalid-norisk') {
          return false;
        }
      }
      if (filters.kaiStatusFilter === 'ai-analysis') {
        if (vuln.kaiStatus === 'ai-invalid-norisk') {
          return false;
        }
      }

      // Risk factors filter
      if (filters.riskFactors.length > 0) {
        const hasMatchingRiskFactor = filters.riskFactors.some((rf) =>
          vuln.riskFactors?.includes(rf)
        );
        if (!hasMatchingRiskFactor) return false;
      }

      // Date range filter
      if (filters.dateRange && vuln.publishedDate) {
        const publishedDate = new Date(vuln.publishedDate);
        if (
          publishedDate < filters.dateRange.start ||
          publishedDate > filters.dateRange.end
        ) {
          return false;
        }
      }

      return true;
    });
  }

  static sortVulnerabilities(
    vulnerabilities: Vulnerability[],
    sortBy: FilterState['sortBy'],
    sortOrder: FilterState['sortOrder']
  ): Vulnerability[] {
    const sorted = [...vulnerabilities].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'cveId':
          comparison = a.cveId.localeCompare(b.cveId);
          break;
        case 'severity':
          comparison =
            this.severityOrder[a.severity] - this.severityOrder[b.severity];
          break;
        case 'cvssScore':
          comparison = (a.cvssScore || 0) - (b.cvssScore || 0);
          break;
        case 'publishedDate':
          const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
          const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        case 'packageName':
          comparison = a.packageName.localeCompare(b.packageName);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  static calculateMetrics(
    vulnerabilities: Vulnerability[],
    originalCount: number
  ): DashboardMetrics {
    const invalidNorisk = vulnerabilities.filter(
      (v) => v.kaiStatus === 'invalid - norisk' || v.kaiStatus === 'invalid-norisk'
    ).length;
    const aiInvalidNorisk = vulnerabilities.filter(
      (v) => v.kaiStatus === 'ai-invalid-norisk'
    ).length;

    return {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount: vulnerabilities.filter((v) => v.severity === 'CRITICAL').length,
      highCount: vulnerabilities.filter((v) => v.severity === 'HIGH').length,
      mediumCount: vulnerabilities.filter((v) => v.severity === 'MEDIUM').length,
      lowCount: vulnerabilities.filter((v) => v.severity === 'LOW').length,
      withExploit: vulnerabilities.filter((v) => v.exploitAvailable).length,
      filteredOutByAnalysis: invalidNorisk,
      filteredOutByAI: aiInvalidNorisk,
      patchAvailable: vulnerabilities.filter((v) => v.patchAvailable).length,
    };
  }

  static getSeverityDistribution(vulnerabilities: Vulnerability[]): SeverityDistribution {
    return {
      CRITICAL: vulnerabilities.filter((v) => v.severity === 'CRITICAL').length,
      HIGH: vulnerabilities.filter((v) => v.severity === 'HIGH').length,
      MEDIUM: vulnerabilities.filter((v) => v.severity === 'MEDIUM').length,
      LOW: vulnerabilities.filter((v) => v.severity === 'LOW').length,
      UNKNOWN: vulnerabilities.filter((v) => v.severity === 'UNKNOWN').length,
    };
  }

  static getRiskFactorFrequency(vulnerabilities: Vulnerability[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    vulnerabilities.forEach((vuln) => {
      vuln.riskFactors?.forEach((factor) => {
        frequency[factor] = (frequency[factor] || 0) + 1;
      });
    });

    return frequency;
  }

  static getTrendData(vulnerabilities: Vulnerability[]) {
    const trends: Record<string, Record<string, number>> = {};

    vulnerabilities.forEach((vuln) => {
      if (!vuln.publishedDate) return;

      const date = new Date(vuln.publishedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!trends[monthKey]) {
        trends[monthKey] = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      }

      trends[monthKey][vuln.severity] = (trends[monthKey][vuln.severity] || 0) + 1;
    });

    return Object.entries(trends)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}