/**
 * Utility to parse GPS coordinates from image overlay text
 * Some GPS camera apps add coordinates as text overlay on the image
 * This function attempts to extract coordinates from common patterns
 */

/**
 * Extract GPS coordinates from text (like image overlay text)
 * Looks for patterns like:
 * - "Lat 25.593994° Long 85.106053°"
 * - "25.593994, 85.106053"
 * - "Latitude: 25.593994, Longitude: 85.106053"
 * etc.
 */
export function parseCoordinatesFromText(text: string): { latitude: number; longitude: number } | null {
  try {
    // Pattern 1: "Lat 25.593994° Long 85.106053°" or "Lat 25.593994 Long 85.106053"
    const pattern1 = /Lat[itude:]*\s*([+-]?\d+\.?\d*)[°\s]*Long[itude:]*\s*([+-]?\d+\.?\d*)[°]?/i;
    let match = text.match(pattern1);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { latitude: lat, longitude: lon };
      }
    }

    // Pattern 2: "25.593994, 85.106053" or "25.593994,85.106053"
    const pattern2 = /([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/;
    match = text.match(pattern2);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      // Check if values are in valid GPS range
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        // For India, typical coordinates are around 8-37°N and 68-97°E
        // If both are positive and in this range, assume lat,lon order
        if (lat > 0 && lat < 40 && lon > 0 && lon < 100) {
          return { latitude: lat, longitude: lon };
        }
        // If first is smaller, might be lon,lat - swap them
        if (lat < lon && lat > 0 && lat < 100 && lon > 0 && lon < 40) {
          return { latitude: lon, longitude: lat };
        }
      }
    }

    // Pattern 3: "GPS: 25.593994, 85.106053"
    const pattern3 = /GPS[:\s]*([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/i;
    match = text.match(pattern3);
    if (match) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        return { latitude: lat, longitude: lon };
      }
    }

    return null;
  } catch (error) {
    console.error('Error parsing coordinates from text:', error);
    return null;
  }
}

/**
 * Extract text from image using OCR-like approach
 * This is a simplified version - for production, use a proper OCR library
 * For now, we'll try to extract coordinates from image metadata or use client-side extraction
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<string> {
  // This is a placeholder - in production, you'd use:
  // - Tesseract.js for client-side OCR
  // - Google Cloud Vision API
  // - AWS Textract
  // For now, we'll return empty and let the client handle it
  return '';
}


