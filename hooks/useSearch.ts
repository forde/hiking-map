import { useEffect, useRef, useCallback } from 'react';
import { Keyboard } from 'react-native';
import { useSearchStore } from '../stores/searchStore';
import { searchPlaces } from '../services/geocoding';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function useSearch() {
  const {
    query,
    results,
    isLoading,
    isFocused,
    selectedResult,
    setQuery,
    setResults,
    setIsLoading,
    setIsFocused,
    setSelectedResult,
    clearSearch,
  } = useSearchStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      const currentQuery = useSearchStore.getState().query;
      if (currentQuery.length < MIN_QUERY_LENGTH) {
        setIsLoading(false);
        return;
      }

      const data = await searchPlaces(currentQuery);

      // Guard against stale responses
      if (useSearchStore.getState().query === currentQuery) {
        setResults(data);
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, setResults, setIsLoading]);

  const selectResult = useCallback(
    (result: (typeof results)[number]) => {
      setSelectedResult(result);
      setResults([]);
      setIsFocused(false);
      Keyboard.dismiss();
    },
    [setSelectedResult, setResults, setIsFocused],
  );

  const handleClearSearch = useCallback(() => {
    clearSearch();
    Keyboard.dismiss();
  }, [clearSearch]);

  return {
    query,
    results,
    isLoading,
    isFocused,
    selectedResult,
    setQuery,
    setFocused: setIsFocused,
    selectResult,
    clearSearch: handleClearSearch,
  };
}
