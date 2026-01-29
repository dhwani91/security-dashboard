// app/page.tsx
'use client';

import { useState } from 'react';
import { useVulnerabilities} from '@/hooks/useVulnerabilities';
import { FilterState } from '@/lib/types';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { SeverityChart } from '@/components/dashboard/SeverityChart';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { PackageChart } from '@/components/dashboard/PackageChart';
import { AnalysisButtons } from '@/components/dashboard/AnalysisButtons';
import { FilterPanel } from '@/components/dashboard/FilterPanel';

export default function DashboardPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: [],
    kaiStatusFilter: 'none',
    sortBy: 'severity',
    sortOrder: 'desc',
  });

  const { vulnerabilities, metrics, chartData, isLoading, error } = useVulnerabilities(filters, 1);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-gray-600 mt-2">
            Make sure you've run: <code className="bg-gray-100 px-2 py-1 rounded">npm run setup</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Security Vulnerability Dashboard
              </h1>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && vulnerabilities.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vulnerability data...</p>
            </div>
          </div>
        )}

        {!isLoading && vulnerabilities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No data available. Run <code>npm run setup</code> to import data.</p>
          </div>
        )}

        {(vulnerabilities.length > 0 || !isLoading) && (
          <>
            {/* Analysis Buttons */}
            <AnalysisButtons 
              filters={filters}
              setKaiStatusFilter={(filter) => updateFilters({ kaiStatusFilter: filter })}
              metrics={metrics}
            />

            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />

            {/* Filter Panel */}
            <FilterPanel filters={filters} updateFilters={updateFilters} />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SeverityChart chartData={chartData} />
              <PackageChart chartData={chartData} />
            </div>
            
            <div className="mb-8">
              <TrendChart chartData={chartData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}