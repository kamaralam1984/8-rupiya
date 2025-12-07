'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserLocation } from '../types';

// localStorage key for saving user location
const STORAGE_KEY = 'userLocation';

// Reverse geocoding using OpenStreetMap Nominatim API (free)
const reverseGeocode = async (lat: number, lng: number): Promise<Partial<UserLocation>> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract city, state, pincode from address
    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.suburb || 
      address.county || 
      'Unknown';
    
    const state = 
      address.state || 
      address.state_district || 
      'Unknown';
    
    const pincode = address.postcode || undefined;
    
    const fullAddress = data.display_name || undefined;

    return {
      city,
      state,
      pincode,
      fullAddress,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Return basic info even if reverse geocoding fails
    return {
      city: 'Unknown',
      state: 'Unknown',
    };
  }
};

// localStorage se saved location load karna
const loadSavedLocation = (): UserLocation | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as UserLocation;
    }
  } catch (error) {
    console.error('Error loading saved location:', error);
  }
  
  return null;
};

// Location ko localStorage mein save karna
const saveLocation = (location: UserLocation): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

interface UseUserLocationReturn {
  location: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => void;
  setManualLocation: (location: Omit<UserLocation, 'source'> & { source?: 'manual' }) => void;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Browser se GPS location detect karna
  const detectLocation = useCallback(async () => {
    // Check karo ki browser geolocation support karta hai ya nahi
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Your browser does not support geolocation');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Browser se GPS coordinates le rahe hain
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true, // GPS use karo, WiFi/IP nahi
            timeout: 15000,
            maximumAge: 0, // Cached location use mat karo
          }
        );
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Reverse geocoding se city, state, pincode le rahe hain
      const addressData = await reverseGeocode(lat, lng);

      const userLocation: UserLocation = {
        lat,
        lng,
        city: addressData.city || 'Unknown',
        state: addressData.state || 'Unknown',
        pincode: addressData.pincode,
        fullAddress: addressData.fullAddress,
        source: 'geolocation',
      };

      // Location ko state aur localStorage mein save karo
      setLocation(userLocation);
      saveLocation(userLocation);
      setError(null);
    } catch (err: any) {
      // Agar user ne permission deny kar di ya error aaya
      console.error('Geolocation error:', err);
      
      if (err.code === 1) {
        // Permission denied
        setError('Location permission denied. Please set location manually.');
      } else if (err.code === 2) {
        // Position unavailable
        setError('Unable to detect your location. Please set location manually.');
      } else if (err.code === 3) {
        // Timeout
        setError('Location detection timed out. Please set location manually.');
      } else {
        setError('Failed to detect location. Please set location manually.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual location set karna
  const setManualLocation = useCallback((manualLocation: Omit<UserLocation, 'source'> & { source?: 'manual' }) => {
    const userLocation: UserLocation = {
      ...manualLocation,
      source: 'manual',
    };

    setLocation(userLocation);
    saveLocation(userLocation);
    setError(null);
  }, []);

  // Location refresh karna (dusri baar detect karna)
  const refreshLocation = useCallback(() => {
    detectLocation();
  }, [detectLocation]);

  // Component mount hone par location detect karo
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Pehle check karo ki koi saved location hai ya nahi
    const saved = loadSavedLocation();
    
    if (saved) {
      // Agar saved location hai to use karo, dobara permission mat maango
      setLocation(saved);
      setIsLoading(false);
      return;
    }

    // Agar saved location nahi hai to browser se location detect karo
    detectLocation();
  }, [detectLocation]);

  return {
    location,
    isLoading,
    error,
    refreshLocation,
    setManualLocation,
  };
}

