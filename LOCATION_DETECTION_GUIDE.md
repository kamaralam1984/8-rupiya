# Location Detection Guide - Browser Geolocation API

Yeh guide aapko batayega ki kaise browser geolocation API use karke user ki exact location detect karein.

## Features

✅ **Browser GPS Location** - IP-based nahi, direct device GPS use karta hai  
✅ **Automatic Detection** - Page load par automatically location detect karta hai  
✅ **Manual Location** - Agar permission deny ho to manual location set kar sakte hain  
✅ **localStorage** - Location save hota hai, har baar permission nahi maangta  
✅ **Reverse Geocoding** - GPS coordinates se city, state, pincode automatically milta hai  

## Files Created

1. **`app/hooks/useUserLocation.ts`** - Main hook for location detection
2. **`app/components/LocationBanner.tsx`** - UI component for location display
3. **`app/types/index.ts`** - TypeScript types (UserLocation interface added)
4. **`app/examples/LocationExample.tsx`** - Example usage

## Quick Start

### 1. Simple Usage (Just show banner)

```tsx
// app/page.tsx or any page
import LocationBanner from './components/LocationBanner';

export default function Home() {
  return (
    <div>
      <LocationBanner />
      {/* Your page content */}
    </div>
  );
}
```

### 2. Advanced Usage (Access location data)

```tsx
'use client';

import { useUserLocation } from './hooks/useUserLocation';

export default function MyPage() {
  const { location, isLoading, error, refreshLocation } = useUserLocation();

  if (isLoading) return <div>Loading location...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!location) return <div>No location set</div>;

  return (
    <div>
      <p>City: {location.city}</p>
      <p>State: {location.state}</p>
      <p>Pincode: {location.pincode}</p>
      <p>Coordinates: {location.lat}, {location.lng}</p>
    </div>
  );
}
```

## How It Works

### Step 1: Page Load
- Component mount hote hi `useUserLocation` hook check karta hai ki `localStorage` mein saved location hai ya nahi
- Agar saved location hai, to use karta hai (permission nahi maangta)
- Agar nahi hai, to browser se GPS permission maangta hai

### Step 2: GPS Detection
- `navigator.geolocation.getCurrentPosition` se exact GPS coordinates milte hain
- `enableHighAccuracy: true` se device GPS use hota hai (WiFi/IP nahi)

### Step 3: Reverse Geocoding
- GPS coordinates ko OpenStreetMap Nominatim API se reverse geocode kiya jata hai
- City, state, pincode, full address milta hai

### Step 4: Save Location
- Location `localStorage` mein save hota hai
- Next time page load par automatically use hoga

### Step 5: Manual Location (if permission denied)
- Agar user permission deny kare ya GPS fail ho
- Manual location form dikhaya jata hai
- User city, state, pincode manually enter kar sakta hai

## API Reference

### `useUserLocation()` Hook

Returns:
- `location: UserLocation | null` - Current location data
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message (if any)
- `refreshLocation: () => void` - Function to re-detect location
- `setManualLocation: (location) => void` - Function to set manual location

### `UserLocation` Interface

```typescript
interface UserLocation {
  lat: number;              // Latitude
  lng: number;              // Longitude
  city: string;             // City name
  state: string;            // State name
  pincode?: string;         // Pincode (optional)
  fullAddress?: string;     // Full address (optional)
  source: 'geolocation' | 'manual';  // How location was set
}
```

## LocationBanner Component

### Features
- ✅ Shows current location if detected
- ✅ Shows loading state while detecting
- ✅ Shows error and manual form if permission denied
- ✅ "Change Location" button to update location
- ✅ "Refresh" button to re-detect location

### States
1. **Loading** - "Detecting your location..." (blue banner)
2. **Error** - Shows error message + "Set Location Manually" button (yellow banner)
3. **Location Set** - Shows location details + "Change Location" button (green banner)
4. **No Location** - "Set your location" button (gray banner)

## Important Notes

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge) support geolocation
- HTTPS required for geolocation (localhost works without HTTPS)
- Mobile browsers work perfectly

### Privacy
- Location permission browser se maanga jata hai
- User ko option hota hai allow/deny karne ka
- Manual location bhi set kar sakte hain

### localStorage
- Location `userLocation` key mein save hota hai
- Clear karne ke liye: `localStorage.removeItem('userLocation')`

## Troubleshooting

### Location not detecting?
1. Check browser console for errors
2. Make sure HTTPS is enabled (or using localhost)
3. Check browser location permissions in settings
4. Try manual location as fallback

### Wrong location showing?
- This uses device GPS, not IP-based location
- Make sure GPS is enabled on device
- Try "Refresh" button to re-detect

### Permission denied?
- User ne permission deny kar di hai
- Manual location form use karo
- Browser settings se permission allow karo

## Example Integration

See `app/examples/LocationExample.tsx` for complete example.

## Support

Agar koi issue ho to:
1. Browser console check karo
2. Network tab mein API calls check karo
3. localStorage check karo (`localStorage.getItem('userLocation')`)



Yeh guide aapko batayega ki kaise browser geolocation API use karke user ki exact location detect karein.

## Features

✅ **Browser GPS Location** - IP-based nahi, direct device GPS use karta hai  
✅ **Automatic Detection** - Page load par automatically location detect karta hai  
✅ **Manual Location** - Agar permission deny ho to manual location set kar sakte hain  
✅ **localStorage** - Location save hota hai, har baar permission nahi maangta  
✅ **Reverse Geocoding** - GPS coordinates se city, state, pincode automatically milta hai  

## Files Created

1. **`app/hooks/useUserLocation.ts`** - Main hook for location detection
2. **`app/components/LocationBanner.tsx`** - UI component for location display
3. **`app/types/index.ts`** - TypeScript types (UserLocation interface added)
4. **`app/examples/LocationExample.tsx`** - Example usage

## Quick Start

### 1. Simple Usage (Just show banner)

```tsx
// app/page.tsx or any page
import LocationBanner from './components/LocationBanner';

export default function Home() {
  return (
    <div>
      <LocationBanner />
      {/* Your page content */}
    </div>
  );
}
```

### 2. Advanced Usage (Access location data)

```tsx
'use client';

import { useUserLocation } from './hooks/useUserLocation';

export default function MyPage() {
  const { location, isLoading, error, refreshLocation } = useUserLocation();

  if (isLoading) return <div>Loading location...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!location) return <div>No location set</div>;

  return (
    <div>
      <p>City: {location.city}</p>
      <p>State: {location.state}</p>
      <p>Pincode: {location.pincode}</p>
      <p>Coordinates: {location.lat}, {location.lng}</p>
    </div>
  );
}
```

## How It Works

### Step 1: Page Load
- Component mount hote hi `useUserLocation` hook check karta hai ki `localStorage` mein saved location hai ya nahi
- Agar saved location hai, to use karta hai (permission nahi maangta)
- Agar nahi hai, to browser se GPS permission maangta hai

### Step 2: GPS Detection
- `navigator.geolocation.getCurrentPosition` se exact GPS coordinates milte hain
- `enableHighAccuracy: true` se device GPS use hota hai (WiFi/IP nahi)

### Step 3: Reverse Geocoding
- GPS coordinates ko OpenStreetMap Nominatim API se reverse geocode kiya jata hai
- City, state, pincode, full address milta hai

### Step 4: Save Location
- Location `localStorage` mein save hota hai
- Next time page load par automatically use hoga

### Step 5: Manual Location (if permission denied)
- Agar user permission deny kare ya GPS fail ho
- Manual location form dikhaya jata hai
- User city, state, pincode manually enter kar sakta hai

## API Reference

### `useUserLocation()` Hook

Returns:
- `location: UserLocation | null` - Current location data
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message (if any)
- `refreshLocation: () => void` - Function to re-detect location
- `setManualLocation: (location) => void` - Function to set manual location

### `UserLocation` Interface

```typescript
interface UserLocation {
  lat: number;              // Latitude
  lng: number;              // Longitude
  city: string;             // City name
  state: string;            // State name
  pincode?: string;         // Pincode (optional)
  fullAddress?: string;     // Full address (optional)
  source: 'geolocation' | 'manual';  // How location was set
}
```

## LocationBanner Component

### Features
- ✅ Shows current location if detected
- ✅ Shows loading state while detecting
- ✅ Shows error and manual form if permission denied
- ✅ "Change Location" button to update location
- ✅ "Refresh" button to re-detect location

### States
1. **Loading** - "Detecting your location..." (blue banner)
2. **Error** - Shows error message + "Set Location Manually" button (yellow banner)
3. **Location Set** - Shows location details + "Change Location" button (green banner)
4. **No Location** - "Set your location" button (gray banner)

## Important Notes

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge) support geolocation
- HTTPS required for geolocation (localhost works without HTTPS)
- Mobile browsers work perfectly

### Privacy
- Location permission browser se maanga jata hai
- User ko option hota hai allow/deny karne ka
- Manual location bhi set kar sakte hain

### localStorage
- Location `userLocation` key mein save hota hai
- Clear karne ke liye: `localStorage.removeItem('userLocation')`

## Troubleshooting

### Location not detecting?
1. Check browser console for errors
2. Make sure HTTPS is enabled (or using localhost)
3. Check browser location permissions in settings
4. Try manual location as fallback

### Wrong location showing?
- This uses device GPS, not IP-based location
- Make sure GPS is enabled on device
- Try "Refresh" button to re-detect

### Permission denied?
- User ne permission deny kar di hai
- Manual location form use karo
- Browser settings se permission allow karo

## Example Integration

See `app/examples/LocationExample.tsx` for complete example.

## Support

Agar koi issue ho to:
1. Browser console check karo
2. Network tab mein API calls check karo
3. localStorage check karo (`localStorage.getItem('userLocation')`)



Yeh guide aapko batayega ki kaise browser geolocation API use karke user ki exact location detect karein.

## Features

✅ **Browser GPS Location** - IP-based nahi, direct device GPS use karta hai  
✅ **Automatic Detection** - Page load par automatically location detect karta hai  
✅ **Manual Location** - Agar permission deny ho to manual location set kar sakte hain  
✅ **localStorage** - Location save hota hai, har baar permission nahi maangta  
✅ **Reverse Geocoding** - GPS coordinates se city, state, pincode automatically milta hai  

## Files Created

1. **`app/hooks/useUserLocation.ts`** - Main hook for location detection
2. **`app/components/LocationBanner.tsx`** - UI component for location display
3. **`app/types/index.ts`** - TypeScript types (UserLocation interface added)
4. **`app/examples/LocationExample.tsx`** - Example usage

## Quick Start

### 1. Simple Usage (Just show banner)

```tsx
// app/page.tsx or any page
import LocationBanner from './components/LocationBanner';

export default function Home() {
  return (
    <div>
      <LocationBanner />
      {/* Your page content */}
    </div>
  );
}
```

### 2. Advanced Usage (Access location data)

```tsx
'use client';

import { useUserLocation } from './hooks/useUserLocation';

export default function MyPage() {
  const { location, isLoading, error, refreshLocation } = useUserLocation();

  if (isLoading) return <div>Loading location...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!location) return <div>No location set</div>;

  return (
    <div>
      <p>City: {location.city}</p>
      <p>State: {location.state}</p>
      <p>Pincode: {location.pincode}</p>
      <p>Coordinates: {location.lat}, {location.lng}</p>
    </div>
  );
}
```

## How It Works

### Step 1: Page Load
- Component mount hote hi `useUserLocation` hook check karta hai ki `localStorage` mein saved location hai ya nahi
- Agar saved location hai, to use karta hai (permission nahi maangta)
- Agar nahi hai, to browser se GPS permission maangta hai

### Step 2: GPS Detection
- `navigator.geolocation.getCurrentPosition` se exact GPS coordinates milte hain
- `enableHighAccuracy: true` se device GPS use hota hai (WiFi/IP nahi)

### Step 3: Reverse Geocoding
- GPS coordinates ko OpenStreetMap Nominatim API se reverse geocode kiya jata hai
- City, state, pincode, full address milta hai

### Step 4: Save Location
- Location `localStorage` mein save hota hai
- Next time page load par automatically use hoga

### Step 5: Manual Location (if permission denied)
- Agar user permission deny kare ya GPS fail ho
- Manual location form dikhaya jata hai
- User city, state, pincode manually enter kar sakta hai

## API Reference

### `useUserLocation()` Hook

Returns:
- `location: UserLocation | null` - Current location data
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message (if any)
- `refreshLocation: () => void` - Function to re-detect location
- `setManualLocation: (location) => void` - Function to set manual location

### `UserLocation` Interface

```typescript
interface UserLocation {
  lat: number;              // Latitude
  lng: number;              // Longitude
  city: string;             // City name
  state: string;            // State name
  pincode?: string;         // Pincode (optional)
  fullAddress?: string;     // Full address (optional)
  source: 'geolocation' | 'manual';  // How location was set
}
```

## LocationBanner Component

### Features
- ✅ Shows current location if detected
- ✅ Shows loading state while detecting
- ✅ Shows error and manual form if permission denied
- ✅ "Change Location" button to update location
- ✅ "Refresh" button to re-detect location

### States
1. **Loading** - "Detecting your location..." (blue banner)
2. **Error** - Shows error message + "Set Location Manually" button (yellow banner)
3. **Location Set** - Shows location details + "Change Location" button (green banner)
4. **No Location** - "Set your location" button (gray banner)

## Important Notes

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge) support geolocation
- HTTPS required for geolocation (localhost works without HTTPS)
- Mobile browsers work perfectly

### Privacy
- Location permission browser se maanga jata hai
- User ko option hota hai allow/deny karne ka
- Manual location bhi set kar sakte hain

### localStorage
- Location `userLocation` key mein save hota hai
- Clear karne ke liye: `localStorage.removeItem('userLocation')`

## Troubleshooting

### Location not detecting?
1. Check browser console for errors
2. Make sure HTTPS is enabled (or using localhost)
3. Check browser location permissions in settings
4. Try manual location as fallback

### Wrong location showing?
- This uses device GPS, not IP-based location
- Make sure GPS is enabled on device
- Try "Refresh" button to re-detect

### Permission denied?
- User ne permission deny kar di hai
- Manual location form use karo
- Browser settings se permission allow karo

## Example Integration

See `app/examples/LocationExample.tsx` for complete example.

## Support

Agar koi issue ho to:
1. Browser console check karo
2. Network tab mein API calls check karo
3. localStorage check karo (`localStorage.getItem('userLocation')`)









