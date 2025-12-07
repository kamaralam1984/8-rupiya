import exifr from 'exifr';

/**
 * Interface for GPS coordinates extracted from EXIF data
 */
export interface GPSData {
  latitude: number;
  longitude: number;
}

/**
 * Interface for reverse geocoding response
 */
export interface GeocodeResult {
  fullAddress: string;
  area?: string;
  city?: string;
  pincode?: string;
}

/**
 * Extract GPS coordinates from image EXIF metadata
 * Tries multiple methods to extract GPS data from different EXIF formats
 * @param imageBuffer - Buffer containing the image data
 * @returns GPS coordinates or null if not found
 */
export async function extractGPSFromImage(imageBuffer: Buffer): Promise<GPSData | null> {
  try {
    // Method 1: Try direct GPS extraction
    let gpsData = await exifr.gps(imageBuffer);
    
    if (gpsData && typeof gpsData.latitude === 'number' && typeof gpsData.longitude === 'number') {
      console.log('✅ GPS found via direct extraction:', gpsData);
      return {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
      };
    }

    // Method 2: Try extracting all EXIF data and look for GPS
    const allExifData = await exifr.parse(imageBuffer, {
      gps: true,
      ifd1: true,
      translateKeys: false,
      translateValues: false,
      reviveValues: true,
      sanitize: false,
    });

    if (allExifData) {
      // Check for GPS in various formats
      if (allExifData.GPSLatitude && allExifData.GPSLongitude) {
        const lat = parseFloat(allExifData.GPSLatitude);
        const lon = parseFloat(allExifData.GPSLongitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          console.log('✅ GPS found in EXIF GPSLatitude/GPSLongitude:', { lat, lon });
          return { latitude: lat, longitude: lon };
        }
      }

      if (allExifData.latitude && allExifData.longitude) {
        const lat = parseFloat(allExifData.latitude);
        const lon = parseFloat(allExifData.longitude);
        if (!isNaN(lat) && !isNaN(lon)) {
          console.log('✅ GPS found in EXIF latitude/longitude:', { lat, lon });
          return { latitude: lat, longitude: lon };
        }
      }

      // Check GPS object
      if (allExifData.gps && typeof allExifData.gps === 'object') {
        if (allExifData.gps.latitude && allExifData.gps.longitude) {
          const lat = parseFloat(allExifData.gps.latitude);
          const lon = parseFloat(allExifData.gps.longitude);
          if (!isNaN(lat) && !isNaN(lon)) {
            console.log('✅ GPS found in EXIF gps object:', { lat, lon });
            return { latitude: lat, longitude: lon };
          }
        }
      }

      // Log available EXIF keys for debugging
      console.log('📋 Available EXIF keys:', Object.keys(allExifData).slice(0, 20));
      if (allExifData.GPSLatitude) console.log('📍 GPSLatitude found:', allExifData.GPSLatitude);
      if (allExifData.GPSLongitude) console.log('📍 GPSLongitude found:', allExifData.GPSLongitude);
    }

    // Method 3: Try with different options
    try {
      gpsData = await exifr.gps(imageBuffer);
      
      if (gpsData) {
        // Try to extract from the result
        const lat = gpsData.latitude;
        const lon = gpsData.longitude;
        
        if (typeof lat === 'number' && typeof lon === 'number') {
          console.log('✅ GPS found via pick method:', { lat, lon });
          return { latitude: lat, longitude: lon };
        }
      }
    } catch (pickError) {
      console.log('⚠️ Pick method failed, trying other approaches...');
    }

    console.log('❌ GPS data not found in EXIF metadata');
    return null;
  } catch (error: any) {
    console.error('Error extracting GPS from image:', error.message);
    console.error('Error details:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get address details
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Alternative: Can use Google Maps Geocoding API or OpenCage if API key is provided
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Geocoded address details
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  try {
    // Use OpenStreetMap Nominatim (free, no API key needed)
    // For production, consider using Google Maps Geocoding API or OpenCage for better accuracy
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DigitalIndiaShopDirectory/1.0', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding API request failed');
    }

    const data = await response.json();
    const addressParts = data.address || {};

    // Extract full formatted address
    const fullAddress = data.display_name || `${latitude}, ${longitude}`;

    // Extract area/locality (try multiple fields)
    const area =
      addressParts.suburb ||
      addressParts.neighbourhood ||
      addressParts.locality ||
      addressParts.city_district ||
      addressParts.town ||
      addressParts.village ||
      undefined;

    // Extract city
    const city =
      addressParts.city ||
      addressParts.town ||
      addressParts.county ||
      addressParts.state_district ||
      undefined;

    // Extract pincode (postal code)
    const pincode = addressParts.postcode || undefined;

    return {
      fullAddress,
      area,
      city,
      pincode,
    };
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    // Return fallback values
    return {
      fullAddress: `${latitude}, ${longitude}`,
      area: undefined,
      city: undefined,
      pincode: undefined,
    };
  }
}

/**
 * Alternative: Reverse geocode using Google Maps Geocoding API
 * Requires GOOGLE_MAPS_API_KEY in environment variables
 * 
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Geocoded address details
 */
export async function reverseGeocodeGoogle(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not found, falling back to OpenStreetMap');
    return reverseGeocode(latitude, longitude);
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Google Geocoding API request failed');
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('No results from Google Geocoding API');
    }

    const result = data.results[0];
    const fullAddress = result.formatted_address || `${latitude}, ${longitude}`;

    // Extract components from address_components
    const components = result.address_components || [];
    let area: string | undefined;
    let city: string | undefined;
    let pincode: string | undefined;

    for (const component of components) {
      const types = component.types || [];
      
      if (types.includes('postal_code')) {
        pincode = component.long_name;
      } else if (types.includes('locality') || types.includes('sublocality')) {
        area = component.long_name;
      } else if (types.includes('administrative_area_level_2') || types.includes('locality')) {
        if (!city) city = component.long_name;
      }
    }

    return {
      fullAddress,
      area,
      city,
      pincode,
    };
  } catch (error: any) {
    console.error('Google reverse geocoding error:', error);
    // Fallback to OpenStreetMap
    return reverseGeocode(latitude, longitude);
  }
}

