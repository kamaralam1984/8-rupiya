'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Location } from '../types';
import {
  detectBrowserLocation,
  getDefaultLocation,
  loadStoredLocation,
  persistLocation,
} from '../utils/locationUtils';
import type { PatnaLocation } from '../utils/locationUtils';

interface LocationContextType {
  location: Location;
  setLocation: (location: Location) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const defaultLocation: Location = {
  ...getDefaultLocation(),
  source: 'manual',
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Location>(defaultLocation);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = loadStoredLocation();
    if (stored) {
      setLocation({ ...stored, source: stored.source ?? 'manual' });
      return;
    }

    const detect = async () => {
      try {
        const detected = await detectBrowserLocation();
        if (detected) {
          setLocation({ ...detected, source: 'auto' });
        }
      } catch (error) {
        console.warn('Automatic location detection failed:', error);
      }
    };

    detect();
  }, []);

  useEffect(() => {
    if (!location.pincode) return;
    persistLocation(location as PatnaLocation);
  }, [location]);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

