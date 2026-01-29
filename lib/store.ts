// lib/store.ts

import { create } from 'zustand';
import { Vulnerability, FilterState, DashboardMetrics } from './types';
import { DataProcessor } from './dataProcessor';

interface VulnerabilityStore {
  // Raw data
  allVulnerabilities: Vulnerability[];
  isLoading: boolean;
  error: string | null;

  // Filtered data
  filteredVulnerabilities: Vulnerability[];
  metrics: DashboardMetrics | null;

  // Filters
  filters: FilterState;

  // Actions
  setVulnerabilities: (vulns: Vulnerability[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setKaiStatusFilter: (filter: FilterState['kaiStatusFilter']) => void;
  applyFilters: () => void;
}

const defaultFilters: FilterState = {
  search: '',
  severity: [],
  kaiStatusFilter: 'none',
  riskFactors: [],
  sortBy: 'severity',
  sortOrder: 'desc',
};

export const useVulnerabilityStore = create<VulnerabilityStore>((set, get) => ({
  allVulnerabilities: [],
  isLoading: false,
  error: null,
  filteredVulnerabilities: [],
  metrics: null,
  filters: defaultFilters,

  setVulnerabilities: (vulns) => {
    set({ allVulnerabilities: vulns });
    get().applyFilters();
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  updateFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
    get().applyFilters();
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },

  setKaiStatusFilter: (filter) => {
    set((state) => ({
      filters: { ...state.filters, kaiStatusFilter: filter },
    }));
    get().applyFilters();
  },

  applyFilters: () => {
    const { allVulnerabilities, filters } = get();
    
    // Apply filters
    let filtered = DataProcessor.filterVulnerabilities(allVulnerabilities, filters);
    
    // Apply sorting
    filtered = DataProcessor.sortVulnerabilities(filtered, filters.sortBy, filters.sortOrder);
    
    // Calculate metrics
    const metrics = DataProcessor.calculateMetrics(filtered, allVulnerabilities.length);

    set({ 
      filteredVulnerabilities: filtered,
      metrics,
    });
  },
}));