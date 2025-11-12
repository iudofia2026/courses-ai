/**
 * useSearch hook provides course search functionality with React Query.
 * Handles search requests, pagination, caching, and error handling.
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  SearchRequest,
  SearchResponse,
  SearchResult,
  SuggestionRequest,
  SuggestionResponse,
  SearchFilter,
  CourseDetailRequest,
  CourseDetailResponse,
} from '../types';
import { apiClient } from '../services/api';

interface UseSearchOptions {
  seasonCode?: string;
  enableAutoSearch?: boolean;
  debounceMs?: number;
  cacheTime?: number;
}

interface UseSearchState {
  query: string;
  filters: SearchFilter[];
  isLoading: boolean;
  error: string | null;
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  isFetching: boolean;
}

interface UseSearchActions {
  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilter[]) => void;
  addFilter: (filter: SearchFilter) => void;
  removeFilter: (field: string, value?: any) => void;
  clearFilters: () => void;
  search: (query?: string, filters?: SearchFilter[]) => Promise<void>;
  loadMore: () => void;
  refetch: () => void;
  clearResults: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchState & UseSearchActions {
  const {
    seasonCode,
    enableAutoSearch = true,
    debounceMs = 500,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([]);

  // Build search request
  const buildSearchRequest = useCallback((
    searchQuery: string,
    searchFilters: SearchFilter[]
  ): SearchRequest => {
    return {
      user_query: searchQuery || undefined,
      structured_query: searchQuery ? {
        query: searchQuery,
        filters: searchFilters,
        season_code: seasonCode,
        limit: 20,
        offset: 0,
        sort_by: 'relevance',
        sort_direction: 'desc',
        include_full_sections: false,
      } : undefined,
      use_ai_parsing: true,
      season_code: seasonCode,
      max_results: 50,
    };
  }, [seasonCode]);

  // Basic search query
  const {
    data: searchResponse,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery<SearchResponse>({
    queryKey: ['search', searchQuery, searchFilters, seasonCode],
    queryFn: async () => {
      if (!searchQuery && searchFilters.length === 0) {
        return {
          results: [],
          total_count: 0,
          has_more: false,
          next_offset: null,
          query_time_ms: 0,
          metadata: {},
        };
      }

      const request = buildSearchRequest(searchQuery, searchFilters);
      return apiClient.searchCourses(request);
    },
    enabled: enableAutoSearch ? (searchQuery.length > 0 || searchFilters.length > 0) : false,
    staleTime: cacheTime,
    gcTime: cacheTime * 2,
    retry: 2,
  });

  // Infinite scroll for search results
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<SearchResponse>({
    queryKey: ['search-infinite', searchQuery, searchFilters, seasonCode],
    queryFn: async ({ pageParam = 0 }) => {
      if (!searchQuery && searchFilters.length === 0) {
        return {
          results: [],
          total_count: 0,
          has_more: false,
          next_offset: null,
          query_time_ms: 0,
          metadata: {},
        };
      }

      const request: SearchRequest = {
        user_query: searchQuery || undefined,
        structured_query: searchQuery ? {
          query: searchQuery,
          filters: searchFilters,
          season_code: seasonCode,
          limit: 20,
          offset: pageParam,
          sort_by: 'relevance',
          sort_direction: 'desc',
          include_full_sections: false,
        } : undefined,
        use_ai_parsing: true,
        season_code: seasonCode,
        max_results: 50,
      };

      const response = await apiClient.searchCourses(request);
      return {
        ...response,
        next_offset: pageParam + response.results.length,
      };
    },
    enabled: enableAutoSearch ? (searchQuery.length > 0 || searchFilters.length > 0) : false,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.has_more ? lastPage.next_offset : undefined;
    },
    staleTime: cacheTime,
    gcTime: cacheTime * 2,
    retry: 2,
  });

  // Search suggestions
  const {
    data: suggestionsData,
    isLoading: isLoadingSuggestions,
  } = useQuery<SuggestionResponse>({
    queryKey: ['search-suggestions', query, seasonCode],
    queryFn: async () => {
      if (query.length < 2) {
        return {
          suggestions: [],
          query_time_ms: 0,
          metadata: {},
        };
      }

      const request: SuggestionRequest = {
        partial_query: query,
        season_code: seasonCode,
        limit: 8,
      };

      return apiClient.getSearchSuggestions(request);
    },
    enabled: query.length >= 2,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debounced search trigger
  const debouncedSearch = useCallback(
    (newQuery: string, newFilters: SearchFilter[]) => {
      setSearchQuery(newQuery);
      setSearchFilters(newFilters);
    },
    []
  );

  // Handle query change with debouncing
  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        debouncedSearch(newQuery, filters);
      }, debounceMs);

      return () => clearTimeout(timer);
    } else {
      debouncedSearch(newQuery, filters);
    }
  }, [filters, debouncedSearch, debounceMs]);

  // Handle filters change
  const handleSetFilters = useCallback((newFilters: SearchFilter[]) => {
    setFilters(newFilters);
    debouncedSearch(query, newFilters);
  }, [query, debouncedSearch]);

  // Add single filter
  const addFilter = useCallback((filter: SearchFilter) => {
    const existingIndex = filters.findIndex(
      (f) => f.field === filter.field && f.value === filter.value
    );

    if (existingIndex === -1) {
      handleSetFilters([...filters, filter]);
    }
  }, [filters, handleSetFilters]);

  // Remove filter
  const removeFilter = useCallback((field: string, value?: any) => {
    const newFilters = filters.filter((f) => {
      if (value !== undefined) {
        return !(f.field === field && f.value === value);
      }
      return f.field !== field;
    });
    handleSetFilters(newFilters);
  }, [filters, handleSetFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    handleSetFilters([]);
  }, [handleSetFilters]);

  // Manual search
  const search = useCallback(async (newQuery?: string, newFilters?: SearchFilter[]) => {
    const finalQuery = newQuery !== undefined ? newQuery : query;
    const finalFilters = newFilters !== undefined ? newFilters : filters;

    setQuery(finalQuery);
    setFilters(finalFilters);
    setSearchQuery(finalQuery);
    setSearchFilters(finalFilters);

    await refetch();
  }, [query, filters, refetch]);

  // Load more results (for infinite scroll)
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Clear results
  const clearResults = useCallback(() => {
    setQuery('');
    setFilters([]);
    setSearchQuery('');
    setSearchFilters([]);
  }, []);

  // Computed values
  const results = useMemo(() => {
    if (infiniteData) {
      return infiniteData.pages.flatMap(page => page.results);
    }
    return searchResponse?.results || [];
  }, [infiniteData, searchResponse]);

  const totalCount = useMemo(() => {
    if (infiniteData) {
      return infiniteData.pages[0]?.total_count || 0;
    }
    return searchResponse?.total_count || 0;
  }, [infiniteData, searchResponse]);

  const hasMore = useMemo(() => {
    if (infiniteData) {
      return infiniteData.pages[infiniteData.pages.length - 1]?.has_more || false;
    }
    return searchResponse?.has_more || false;
  }, [infiniteData, searchResponse]);

  const errorMessage = useMemo(() => {
    if (error) {
      return error instanceof Error ? error.message : 'Search failed';
    }
    return null;
  }, [error]);

  return {
    // State
    query,
    filters,
    isLoading: isLoading || isFetching,
    error: errorMessage,
    results,
    totalCount,
    hasMore,
    isFetching: isFetchingNextPage || isFetching,

    // Actions
    setQuery: handleSetQuery,
    setFilters: handleSetFilters,
    addFilter,
    removeFilter,
    clearFilters,
    search,
    loadMore,
    refetch,
    clearResults,
  };
}
