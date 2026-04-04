import { create } from 'zustand';
import type { NominatimResult } from '../services/geocoding';

interface SearchState {
  query: string;
  results: NominatimResult[];
  isLoading: boolean;
  isFocused: boolean;
  selectedResult: NominatimResult | null;
  setQuery: (query: string) => void;
  setResults: (results: NominatimResult[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsFocused: (focused: boolean) => void;
  setSelectedResult: (result: NominatimResult | null) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  isFocused: false,
  selectedResult: null,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsFocused: (isFocused) => set({ isFocused }),
  setSelectedResult: (selectedResult) => set({ selectedResult }),
  clearSearch: () =>
    set({
      query: '',
      results: [],
      isLoading: false,
      selectedResult: null,
    }),
}));
