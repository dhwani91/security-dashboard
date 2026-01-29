// components/dashboard/AnalysisButtons.tsx
'use client';

import { FilterState } from '@/lib/types';
import { Shield, Sparkles, X } from 'lucide-react';

interface Props {
  filters: FilterState;
  setKaiStatusFilter: (filter: FilterState['kaiStatusFilter']) => void;
  metrics: {
    filteredOutByAnalysis: number;
    filteredOutByAI: number;
    totalVulnerabilities: number;
  };
}

export function AnalysisButtons({ filters, setKaiStatusFilter, metrics }: Props) {
  const activeFilter = filters.kaiStatusFilter;

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Analysis Filters</h2>
          {activeFilter !== 'none' && (
            <button
              onClick={() => setKaiStatusFilter('none')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition"
            >
              <X className="w-4 h-4" />
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Manual Analysis Button */}
          <button
            onClick={() => setKaiStatusFilter(activeFilter === 'analysis' ? 'none' : 'analysis')}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
              activeFilter === 'analysis'
                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg scale-105'
                : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${activeFilter === 'analysis' ? 'bg-blue-500' : 'bg-blue-100'}`}>
                <Shield className={`w-6 h-6 ${activeFilter === 'analysis' ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 mb-1">Manual Analysis</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Filter out CVEs marked as "invalid - norisk"
                </p>
                <div className="text-xs text-gray-500">
                  Would filter: {metrics.filteredOutByAnalysis} CVEs
                </div>
              </div>
            </div>
            {activeFilter === 'analysis' && (
              <div className="absolute top-3 right-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </button>

          {/* AI Analysis Button */}
          <button
            onClick={() => setKaiStatusFilter(activeFilter === 'ai-analysis' ? 'none' : 'ai-analysis')}
            className={`relative p-6 rounded-xl border-2 transition-all duration-300 ${
              activeFilter === 'ai-analysis'
                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 shadow-lg scale-105'
                : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${activeFilter === 'ai-analysis' ? 'bg-purple-500' : 'bg-purple-100'}`}>
                <Sparkles className={`w-6 h-6 ${activeFilter === 'ai-analysis' ? 'text-white' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 mb-1">AI Analysis</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Filter out CVEs marked as "ai-invalid-norisk"
                </p>
                <div className="text-xs text-gray-500">
                  Would filter: {metrics.filteredOutByAI} CVEs
                </div>
              </div>
            </div>
            {activeFilter === 'ai-analysis' && (
              <div className="absolute top-3 right-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </button>
        </div>

        {/* Active Filter Indicator */}
        {activeFilter !== 'none' && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">
                  {activeFilter === 'analysis' ? 'Manual Analysis' : 'AI Analysis'} filter active
                </span>
              </div>
              <span className="text-sm text-gray-600">
                Showing {metrics.totalVulnerabilities} vulnerabilities
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}