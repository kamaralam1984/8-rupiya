'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Location } from '../types';
import {
  detectBrowserLocation,
  getDefaultLocation,
  getPatnaLocations,
  loadStoredLocation,
  persistLocation,
} from '../utils/locationUtils';
import type { PatnaLocation } from '../utils/locationUtils';
import { calculateDistance } from '../utils/distance';

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

    // Always try to detect current location first on page load
    const detectCurrentLocation = async () => {
      try {
        // Check if geolocation is supported
        if (!('geolocation' in navigator)) {
          console.warn('Geolocation not supported');
          loadFallbackLocation();
          return;
        }

        // Check permission status first
        let permissionGranted = false;
        if ('permissions' in navigator) {
          try {
            const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
            permissionGranted = result.state === 'granted';
            
            // If permission is prompt, we'll still try to get location (browser will show prompt)
            if (result.state === 'prompt') {
              // Continue to request location
            } else if (result.state === 'denied') {
              // Permission denied, use fallback
              loadFallbackLocation();
              return;
            }
          } catch (e) {
            // Permissions API not supported, continue normally
          }
        }

        // Try to get GPS coordinates directly
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true, // Use GPS, not WiFi/IP
              timeout: 15000,
              maximumAge: 0, // Don't use cached location
            });
          });

          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          // Check if coordinates are within Patna bounds
          const isWithinPatna = (
            userLat >= 25.3 && userLat <= 25.8 &&
            userLng >= 84.9 && userLng <= 85.4
          );

          // Find nearest Patna location based on GPS coordinates
          if (isWithinPatna) {
            const locations = getPatnaLocations();
            
            // Find nearest location by calculating distance to all locations
            let nearest = locations[0];
            let minDistance = Infinity;
            
            for (const loc of locations) {
              const locLat = loc.latitude || 25.5941; // Patna center
              const locLon = loc.longitude || 85.1376;
              const distance = calculateDistance(userLat, userLng, locLat, locLon);
              if (distance < minDistance) {
                minDistance = distance;
                nearest = loc;
              }
            }

            // Set nearest location with actual GPS coordinates
            const locationWithCoords = {
              ...nearest,
              latitude: userLat,
              longitude: userLng,
              source: 'auto' as const,
            };
            setLocation(locationWithCoords);
            return; // Exit early if detected successfully
          }

          // Outside Patna - still use GPS coordinates for nearby shops
          const customLocation: Location = {
            id: `custom-${userLat}-${userLng}`,
            city: 'Current Location',
            state: 'Bihar',
            country: 'IN',
            displayName: `Current Location (${userLat.toFixed(4)}, ${userLng.toFixed(4)})`,
            latitude: userLat,
            longitude: userLng,
            source: 'auto',
          };
          setLocation(customLocation);
          return;
        } catch (geoError: any) {
          // GPS permission denied or error
          console.warn('GPS location access denied or failed:', geoError);
          loadFallbackLocation();
        }
      } catch (error) {
        console.warn('Automatic location detection failed:', error);
        loadFallbackLocation();
      }
    };

    const loadFallbackLocation = () => {
      // Fallback to stored location if auto-detection failed
      const stored = loadStoredLocation();
      if (stored) {
        setLocation({ ...stored, source: stored.source ?? 'manual' });
        return;
      }

      // Final fallback to default location
      setLocation({ ...getDefaultLocation(), source: 'manual' });
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      detectCurrentLocation();
    }, 100);

    return () => clearTimeout(timer);
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

