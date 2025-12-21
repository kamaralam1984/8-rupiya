'use client';

import { useEffect, useState } from 'react';
import { useAgentAuth } from '@/app/contexts/AgentAuthContext';

/**
 * Component to track and send agent's location periodically
 * Should be added to agent dashboard/layout
 */
export default function AgentLocationTracker() {
  const { agent, token } = useAgentAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agent || !token) {
      return;
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Function to update location
    const updateLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse geocode to get address details
            let addressData: { address?: string; city?: string; area?: string; pincode?: string } = {};
            
            try {
              // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key)
              // Add small delay to respect rate limits (1 request per second)
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const geocodeResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': '8Rupiya-AgentTracker/1.0',
                    'Accept-Language': 'en',
                  },
                }
              );

              if (geocodeResponse.ok) {
                const geocodeData = await geocodeResponse.json();
                const addr = geocodeData.address || {};
                
                // Extract pincode with validation
                let extractedPincode = addr.postcode || 
                                     addr.postal_code || 
                                     (geocodeData.extratags?.postal_code) ||
                                     undefined;
                
                // Validate Indian pincode format (6 digits)
                if (extractedPincode && !/^\d{6}$/.test(String(extractedPincode).trim())) {
                  extractedPincode = undefined;
                } else if (extractedPincode) {
                  extractedPincode = String(extractedPincode).trim();
                }
                
                // Extract address components with better Indian address handling
                addressData = {
                  address: geocodeData.display_name || undefined,
                  // For Indian addresses, try multiple fields
                  city: addr.city || 
                        addr.town || 
                        addr.village || 
                        addr.county || 
                        addr.state_district || 
                        addr.district ||
                        undefined,
                  area: addr.suburb || 
                        addr.neighbourhood || 
                        addr.locality || 
                        addr.city_district || 
                        addr.quarter ||
                        addr.road ||
                        undefined,
                  pincode: extractedPincode,
                };
              }
            } catch (geocodeError) {
              // If reverse geocoding fails, continue with just coordinates
              // Server-side will try again
              if (process.env.NODE_ENV === 'development') {
                console.warn('Client-side reverse geocoding failed:', geocodeError);
              }
            }

            // Send location with address data
            const response = await fetch('/api/agent/location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude,
                longitude,
                ...addressData,
              }),
            });

            const data = await response.json();
            if (!data.success) {
              if (process.env.NODE_ENV === 'development') {
                console.error('Failed to update location:', data.error);
              }
            }
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Location update error:', err);
            }
          }
        },
        (err) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Geolocation error:', err);
          }
          setError('Failed to get location');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    // Update location immediately
    updateLocation();

    // Update location every 30 seconds
    const interval = setInterval(updateLocation, 30000);

    // Also update on page visibility change (when user comes back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLocation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [agent, token]);

  // This component doesn't render anything visible
  // It just tracks location in the background
  return null;
}

