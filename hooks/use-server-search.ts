import { useState, useEffect, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "./use-debounce";

interface SearchParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SearchResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    search?: string;
    status?: string;
    type?: string;
  };
}

interface UseServerSearchOptions<T> {
  endpoint: string;
  queryKey: string;
  initialParams?: SearchParams;
  debounceMs?: number;
}

export function useServerSearch<T>({
  endpoint,
  queryKey,
  initialParams = {},
  debounceMs = 300,
}: UseServerSearchOptions<T>) {
  const [searchTerm, setSearchTerm] = useState(initialParams.search || "");
  const [page, setPage] = useState(initialParams.page || 1);
  const [filters, setFilters] = useState({
    status: initialParams.status || "all",
    type: initialParams.type || "all",
    sortBy: initialParams.sortBy || "name",
    sortOrder: initialParams.sortOrder || "asc" as 'asc' | 'desc',
  });

  // Debounce search term
  const debouncedSearch = useDebounce(searchTerm, debounceMs);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.status, filters.type]);

  // Build query params
  const queryParams = new URLSearchParams();
  if (debouncedSearch) queryParams.set("q", debouncedSearch);
  if (filters.status !== "all") queryParams.set("status", filters.status);
  if (filters.type !== "all") queryParams.set("type", filters.type);
  queryParams.set("page", page.toString());
  queryParams.set("limit", (initialParams.limit || 50).toString());
  queryParams.set("sortBy", filters.sortBy);
  queryParams.set("sortOrder", filters.sortOrder);

  // Fetch data
  const { data, isLoading, error, isFetching } = useQuery<SearchResult<T>>({
    queryKey: [queryKey, queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`${endpoint}?${queryParams}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 5000, // Consider data fresh for 5 seconds
  });

  // Pagination helpers
  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.pagination.totalPages || 1)) {
      setPage(newPage);
    }
  }, [data?.pagination.totalPages]);

  const nextPage = useCallback(() => {
    if (data?.pagination.hasNextPage) {
      setPage(p => p + 1);
    }
  }, [data?.pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (data?.pagination.hasPrevPage) {
      setPage(p => p - 1);
    }
  }, [data?.pagination.hasPrevPage]);

  // Filter helpers
  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setPage(1);
    setFilters({
      status: "all",
      type: "all",
      sortBy: "name",
      sortOrder: "asc",
    });
  }, []);

  return {
    // Data
    results: data?.data || [],
    pagination: data?.pagination || {
      page: 1,
      limit: initialParams.limit || 50,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    
    // Loading states
    isLoading,
    isFetching,
    error,
    
    // Search
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    
    // Filters
    filters,
    updateFilter,
    resetFilters,
    
    // Pagination
    page,
    goToPage,
    nextPage,
    prevPage,
    
    // Metadata
    totalResults: data?.pagination.total || 0,
    isEmpty: !isLoading && (data?.data.length || 0) === 0,
  };
}