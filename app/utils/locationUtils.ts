import rawLocations from '../patna_full_locations.json';
import type { Location } from '../types';

export interface PatnaLocationRecord {
  Location: string;
  Pincode: number;
  State: string;
  District: string;
}

export interface PatnaLocation extends Location {
  pincode: number;
  district: string;
  state: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const normalizeLocation = (entry: PatnaLocationRecord): PatnaLocation => {
  const locationSlug = slugify(entry.Location);
  return {
    id: `${locationSlug}-${entry.Pincode}`,
    city: entry.Location,
    state: entry.State,
    country: 'IN',
    displayName: `${entry.Location}, ${entry.District}`,
    pincode: entry.Pincode,
    district: entry.District,
  };
};

const patnaLocations: PatnaLocation[] = (rawLocations as PatnaLocationRecord[]).map(normalizeLocation);

export const getPatnaLocations = () => patnaLocations;

export const getDefaultLocation = (): PatnaLocation => patnaLocations[0];

export const findLocationByPincode = (pincode: string | number) => {
  const sanitized = typeof pincode === 'number' ? pincode.toString() : pincode;
  const trimmed = sanitized.replace(/\D+/g, '').slice(0, 6);
  if (!trimmed) return undefined;
  return patnaLocations.find((loc) => loc.pincode.toString() === trimmed);
};

export const findLocationByName = (name: string) => {
  const normalized = slugify(name);
  return patnaLocations.find(
    (loc) => slugify(loc.city) === normalized || slugify(loc.displayName) === normalized
  );
};

export const searchLocations = (query: string, limit = 50) => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return patnaLocations.slice(0, limit);
  }

  return patnaLocations
    .filter(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.pincode.toString().includes(q)
    )
    .slice(0, limit);
};

type ReverseAddress = {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  neighbourhood?: string;
  county?: string;
  state_district?: string;
  district?: string;
};

export const matchAddressToLocation = (address?: ReverseAddress) => {
  if (!address) return undefined;

  if (address.postcode) {
    const pincodeMatch = findLocationByPincode(address.postcode);
    if (pincodeMatch) return pincodeMatch;
  }

  const candidates = [
    address.city,
    address.town,
    address.village,
    address.suburb,
    address.neighbourhood,
    address.district,
    address.state_district,
    address.county,
  ].filter(Boolean) as string[];

  for (const name of candidates) {
    const match = findLocationByName(name);
    if (match) return match;
  }

  return undefined;
};

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

const getBrowserPosition = () =>
  new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });

export const detectBrowserLocation = async () => {
  const position = await getBrowserPosition();
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(position.coords.latitude),
    lon: String(position.coords.longitude),
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    headers: {
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch reverse geocode details.');
  }

  const data = await response.json();
  return matchAddressToLocation(data.address);
};

const STORAGE_KEY = 'preferred-location';

export const loadStoredLocation = (): PatnaLocation | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PatnaLocation) : null;
  } catch {
    return null;
  }
};

export const persistLocation = (location: PatnaLocation) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // ignore storage errors
  }
};

