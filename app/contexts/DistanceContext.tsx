'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DistanceContextType {
  distance: number; // Distance in km (0 = all shops)
  setDistance: (distance: number) => void;
  isMounted: boolean; // Track if component is mounted to avoid hydration mismatch
}

const DistanceContext = createContext<DistanceContextType | undefined>(undefined);

export function DistanceProvider({ children }: { children: ReactNode }) {
  // Always start with 0 to match server render
  const [distance, setDistanceState] = useState<number>(0);
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem('search-distance');
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
          setDistanceState(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setDistance = (newDistance: number) => {
    setDistanceState(newDistance);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('search-distance', newDistance.toString());
      } catch {
        // Ignore storage errors
      }
    }
  };

  return (
    <DistanceContext.Provider value={{ distance, setDistance, isMounted }}>
      {children}
    </DistanceContext.Provider>
  );
}

export function useDistance() {
  const context = useContext(DistanceContext);
  if (context === undefined) {
    throw new Error('useDistance must be used within a DistanceProvider');
  }
  return context;
}

