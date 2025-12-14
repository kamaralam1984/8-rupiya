'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchParams {
  pincode?: string;
  area?: string;
  category?: string;
  city?: string;
  shopName?: string;
  planType?: string;
}

interface SearchContextType {
  searchParams: SearchParams;
  setSearchParams: (params: SearchParams) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParams>({});

  const clearSearch = () => {
    setSearchParams({});
  };

  const isSearchActive = Boolean(
    searchParams.pincode || searchParams.area || searchParams.category || searchParams.city || searchParams.shopName || searchParams.planType
  );

  return (
    <SearchContext.Provider value={{ searchParams, setSearchParams, clearSearch, isSearchActive }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}



