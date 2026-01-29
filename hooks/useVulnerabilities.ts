// hooks/useVulnerabilities.ts
import { useState, useEffect } from 'react';
import { ApiResponse, FilterState } from '@/lib/types';

export function useVulnerabilities(filters: FilterState, page: number = 1) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50',
          search: filters.search || '',
          severity: filters.severity.join(','),
          kaiStatusFilter: filters.kaiStatusFilter,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        const response = await fetch(`/api/vulnerabilities?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const result: ApiResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters, page]);

  return {
    vulnerabilities: data?.data || [],
    pagination: data?.pagination || { page: 1, limit: 50, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
    metrics: data?.metrics || { totalVulnerabilities: 0, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, withExploit: 0, patchAvailable: 0, filteredOutByAnalysis: 0, filteredOutByAI: 0 },
    chartData: data?.chartData || { severityDistribution: [], packageDistribution: [], monthlyTrends: [] },
    meta: data?.meta,
    isLoading,
    error,
  };
}