import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';

// Cache-Control headers - cache for 5 minutes
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

/**
 * GET /api/shops/search-options
 * Get unique pincodes, areas, categories, and cities from AgentShop collection ONLY
 * This connects homepage search to agent shops data
 * Cities are extracted from the address field since AgentShop doesn't have a city field
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Fetch ONLY from AgentShop collection (to prevent duplicates)
    // AgentShop has 'address' field, not 'city' or 'area' - we need to extract them
    const agentShops = await AgentShop.find({})
      .select('pincode address category')
      .lean()
      .catch(() => []);

    // Extract unique values
    const pincodes = new Set<string>();
    const areas = new Set<string>();
    const categories = new Set<string>();
    const cities = new Set<string>();

    // Common Indian cities list for validation
    const commonCities = [
      'Patna', 'Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad',
      'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri',
      'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
      'Varanasi', 'Srinagar', 'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Jabalpur', 'Gwalior',
      'Jodhpur', 'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli', 'Mysore', 'Tiruchirappalli'
    ];

    agentShops.forEach((shop: any) => {
      // Pincodes
      if (shop.pincode && typeof shop.pincode === 'string' && shop.pincode.trim()) {
        pincodes.add(shop.pincode.trim());
      }

      // Categories
      if (shop.category && typeof shop.category === 'string' && shop.category.trim()) {
        categories.add(shop.category.trim());
      }

      // Extract city and area from address field
      if (shop.address && typeof shop.address === 'string' && shop.address.trim()) {
        const address = shop.address.trim();
        
        // Try multiple extraction methods
        let extractedCity = '';
        let extractedArea = '';
        
        // Method 1: Split by comma
        const commaParts = address.split(',').map((part: string) => part.trim()).filter(Boolean);
        
        if (commaParts.length > 0) {
          // Extract city from comma-separated parts
          for (let i = commaParts.length - 1; i >= 0; i--) {
            const part = commaParts[i];
            
            // Skip if it's a pincode
            if (/^\d{6}$/.test(part)) continue;
            
            // Skip common state/country names
            if (/\b(Bihar|India|INDIA|IN|State|District|Bihar State)\b/gi.test(part)) continue;
            
            // Check if part looks like a city (has letters, reasonable length)
            if (part.length >= 3 && part.length <= 30 && /[a-zA-Z]/.test(part)) {
              // Check if it matches common city names
              const partLower = part.toLowerCase();
              const isCommonCity = commonCities.some(city => 
                city.toLowerCase() === partLower || partLower.includes(city.toLowerCase())
              );
              
              if (isCommonCity || (!extractedCity && i >= commaParts.length - 2)) {
                extractedCity = part.replace(/\d{6}/g, '').trim();
                break;
              }
            }
          }
          
          // Extract area from first parts
          if (commaParts.length > 1) {
            const firstPart = commaParts[0];
            const areaIndicators = ['nagar', 'colony', 'road', 'rd', 'path', 'street', 'area', 'sector', 'block', 'ward', 'chowk', 'market'];
            const hasAreaIndicator = areaIndicators.some(indicator => 
              firstPart.toLowerCase().includes(indicator)
            );
            
            if (hasAreaIndicator || (firstPart.length >= 3 && firstPart.length <= 40)) {
              extractedArea = firstPart.replace(/\d{6}/g, '').trim();
            }
          }
        }
        
        // Method 2: Try to extract from patterns like "City Name" or "Area, City"
        if (!extractedCity && address.length > 0) {
          // Look for common city patterns in the address
          for (const city of commonCities) {
            const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
            if (cityRegex.test(address)) {
              extractedCity = city;
              break;
            }
          }
        }
        
        // Method 3: Extract city from pincode area (if pincode is known)
        // Patna pincodes: 800001-800020, etc.
        if (!extractedCity && shop.pincode) {
          const pincode = parseInt(shop.pincode);
          if (pincode >= 800001 && pincode <= 800020) {
            extractedCity = 'Patna';
          }
        }
        
        // Method 4: Extract any meaningful city-like word from address
        // If no city found yet, try to extract from last meaningful parts
        if (!extractedCity && commaParts.length >= 2) {
          // Try last 2-3 parts (excluding pincode and state)
          for (let i = Math.max(0, commaParts.length - 3); i < commaParts.length; i++) {
            const part = commaParts[i].trim();
            
            // Skip if it's pincode, state, or country
            if (/^\d{6}$/.test(part) || 
                /\b(Bihar|India|INDIA|IN|State|District)\b/gi.test(part)) {
              continue;
            }
            
            // If it's a reasonable length and has letters, it might be a city
            if (part.length >= 3 && part.length <= 30 && /^[a-zA-Z\s]+$/.test(part)) {
              extractedCity = part;
              break;
            }
          }
        }
        
        // Clean and validate extracted city
        if (extractedCity) {
          extractedCity = extractedCity
            .replace(/\d{6}/g, '')
            .replace(/\b(Bihar|India|INDIA|IN|State|District)\b/gi, '')
            .trim();
          
          if (extractedCity.length >= 2 && extractedCity.length <= 50 && /[a-zA-Z]/.test(extractedCity)) {
            cities.add(extractedCity);
          }
        }
        
        // Clean and validate extracted area
        if (extractedArea) {
          extractedArea = extractedArea
            .replace(/\d{6}/g, '')
            .trim();
          
          if (extractedArea.length >= 2 && extractedArea.length <= 50 && !extractedArea.match(/^\d+$/)) {
            areas.add(extractedArea);
          }
        }
      }
    });
    
    // Log extraction results for debugging
    console.log(`📊 Extracted from ${agentShops.length} shops:`, {
      cities: cities.size,
      areas: areas.size,
      pincodes: pincodes.size,
      categories: categories.size
    });

    // Convert to sorted arrays
    const sortedPincodes = Array.from(pincodes).sort();
    const sortedAreas = Array.from(areas).sort();
    const sortedCategories = Array.from(categories).sort();
    const sortedCities = Array.from(cities).sort();

    // Log final results
    console.log('📋 Final Search Options:', {
      cities: sortedCities,
      citiesCount: sortedCities.length,
      areas: sortedAreas.slice(0, 10), // First 10 areas
      areasCount: sortedAreas.length,
      categoriesCount: sortedCategories.length,
      pincodesCount: sortedPincodes.length,
      totalShops: agentShops.length,
    });

    return NextResponse.json({
      success: true,
      pincodes: sortedPincodes,
      areas: sortedAreas,
      categories: sortedCategories,
      cities: sortedCities, // Ensure cities array is always present
      totalShops: agentShops.length,
      debug: {
        citiesExtracted: sortedCities.length,
        shopsProcessed: agentShops.length,
      },
    }, {
      headers: CACHE_HEADERS,
    });
  } catch (error: any) {
    console.error('Error fetching search options:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch search options',
        details: error.message,
        pincodes: [],
        areas: [],
        categories: [],
        cities: [],
      },
      { status: 500 }
    );
  }
}
