// components/dashboard/FilterPanel.tsx
'use client';

import { FilterState } from '@/lib/types';
import { Search, X } from 'lucide-react';

interface Props {
  filters: FilterState;
  updateFilters: (filters: Partial<FilterState>) => void;
}

export function FilterPanel({ filters, updateFilters }: Props) {
  const severityOptions = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const handleSeverityToggle = (severity: string) => {
    const newSeverities = filters.severity.includes(severity)
      ? filters.severity.filter((s) => s !== severity)
      : [...filters.severity, severity];
    updateFilters({ severity: newSeverities });
  };

  const hasActiveFilters = filters.search || filters.severity.length > 0;

  const getSeverityColorClasses = (severity: string, isSelected: boolean) => {
    const colorMap: Record<string, { selected: string; unselected: string }> = {
      CRITICAL: {
        selected: 'bg-red-100 text-red-700 border-red-300',
        unselected: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
      },
      HIGH: {
        selected: 'bg-orange-100 text-orange-700 border-orange-300',
        unselected: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
      },
      MEDIUM: {
        selected: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        unselected: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
      },
      LOW: {
        selected: 'bg-green-100 text-green-700 border-green-300',
        unselected: 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
      },
    };
    return isSelected ? colorMap[severity].selected : colorMap[severity].unselected;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Search & Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={() => updateFilters({ search: '', severity: [] })}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search CVE ID, package name, or description..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Severity Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Severity
        </label>
        <div className="flex flex-wrap gap-2">
          {severityOptions.map((severity) => {
            const isSelected = filters.severity.includes(severity);
            return (
              <button
                key={severity}
                onClick={() => handleSeverityToggle(severity)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${getSeverityColorClasses(severity, isSelected)}`}
              >
                {severity}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}