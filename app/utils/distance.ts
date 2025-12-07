/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param userLat - User's latitude in degrees
 * @param userLng - User's longitude in degrees
 * @param shopLat - Shop's latitude in degrees
 * @param shopLng - Shop's longitude in degrees
 * @returns Distance in kilometers, rounded to 1 decimal place
 */
export function calculateDistance(
  userLat: number,
  userLng: number,
  shopLat: number,
  shopLng: number
): number {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = toRadians(shopLat - userLat);
  const dLng = toRadians(shopLng - userLng);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(shopLat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate estimated travel time based on distance
 * Assumes average speed: 30 km/h for city, 60 km/h for highway
 * @param distanceKm - Distance in kilometers
 * @param isCity - Whether the route is in city (default: true)
 * @returns Estimated travel time in minutes
 */
export function calculateTravelTime(distanceKm: number, isCity: boolean = true): number {
  // Average speeds
  const citySpeed = 30; // km/h
  const highwaySpeed = 60; // km/h
  
  const speed = isCity ? citySpeed : highwaySpeed;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);
  
  // Minimum 1 minute
  return Math.max(1, timeMinutes);
}

/**
 * Format travel time for display
 * @param minutes - Travel time in minutes
 * @returns Formatted string (e.g., "5 min", "1 hour 15 min")
 */
export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
}

