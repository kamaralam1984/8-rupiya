/**
 * Script to generate shops for all districts and areas of Bihar
 * 2 shops per area, each from different categories, with proper location coordinates
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try multiple env file locations
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envPath}`);
    break;
  }
}

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import AdminShop from '../lib/models/Shop';
import { textToSlug } from '../lib/utils/slugGenerator';

// Bihar Districts with their major areas and approximate coordinates
const BIHAR_DISTRICTS = [
  {
    district: 'Patna',
    areas: [
      { name: 'Bailey Road', lat: 25.6093, lng: 85.1235 },
      { name: 'Boring Road', lat: 25.6150, lng: 85.1300 },
      { name: 'Kankarbagh', lat: 25.6000, lng: 85.1500 },
      { name: 'Rajendra Nagar', lat: 25.6200, lng: 85.1400 },
      { name: 'Exhibition Road', lat: 25.6100, lng: 85.1200 },
      { name: 'Fraser Road', lat: 25.6050, lng: 85.1250 },
      { name: 'Ashiana Nagar', lat: 25.5950, lng: 85.1350 },
      { name: 'Danapur', lat: 25.6400, lng: 85.0500 },
      { name: 'Phulwari Sharif', lat: 25.5800, lng: 85.1000 },
      { name: 'Patliputra', lat: 25.6250, lng: 85.1550 },
    ],
  },
  {
    district: 'Gaya',
    areas: [
      { name: 'Bodh Gaya', lat: 24.6951, lng: 84.9914 },
      { name: 'Gaya City', lat: 24.7969, lng: 85.0039 },
      { name: 'Tekari', lat: 24.9333, lng: 84.8333 },
      { name: 'Sherghati', lat: 24.5667, lng: 84.7833 },
      { name: 'Manpur', lat: 24.7167, lng: 85.0167 },
    ],
  },
  {
    district: 'Muzaffarpur',
    areas: [
      { name: 'Muzaffarpur City', lat: 26.1209, lng: 85.3647 },
      { name: 'Motihari', lat: 26.6500, lng: 84.9167 },
      { name: 'Sitamarhi', lat: 26.6000, lng: 85.4833 },
      { name: 'Hajipur', lat: 25.6833, lng: 85.2167 },
      { name: 'Chhapra', lat: 25.7833, lng: 84.7333 },
    ],
  },
  {
    district: 'Bhagalpur',
    areas: [
      { name: 'Bhagalpur City', lat: 25.2530, lng: 87.0040 },
      { name: 'Banka', lat: 24.8833, lng: 86.9167 },
      { name: 'Kahalgaon', lat: 25.2667, lng: 87.2333 },
      { name: 'Naugachia', lat: 25.4000, lng: 87.1000 },
    ],
  },
  {
    district: 'Darbhanga',
    areas: [
      { name: 'Darbhanga City', lat: 26.1520, lng: 85.8970 },
      { name: 'Madhubani', lat: 26.3667, lng: 86.0833 },
      { name: 'Samastipur', lat: 25.8500, lng: 85.7833 },
      { name: 'Jhanjharpur', lat: 26.2667, lng: 86.2833 },
    ],
  },
  {
    district: 'Purnia',
    areas: [
      { name: 'Purnia City', lat: 25.7833, lng: 87.4667 },
      { name: 'Katihar', lat: 25.5333, lng: 87.5833 },
      { name: 'Kishanganj', lat: 26.1000, lng: 87.9333 },
      { name: 'Araria', lat: 26.1500, lng: 87.5167 },
    ],
  },
  {
    district: 'Saran',
    areas: [
      { name: 'Chhapra', lat: 25.7833, lng: 84.7333 },
      { name: 'Siwan', lat: 26.2167, lng: 84.3667 },
      { name: 'Gopalganj', lat: 26.4667, lng: 84.4333 },
      { name: 'Marhaura', lat: 25.8500, lng: 84.8500 },
    ],
  },
  {
    district: 'Vaishali',
    areas: [
      { name: 'Hajipur', lat: 25.6833, lng: 85.2167 },
      { name: 'Mahua', lat: 26.0167, lng: 85.2833 },
      { name: 'Lalganj', lat: 25.8667, lng: 85.1833 },
      { name: 'Raghopur', lat: 25.7500, lng: 85.1500 },
    ],
  },
  {
    district: 'Nalanda',
    areas: [
      { name: 'Bihar Sharif', lat: 25.2000, lng: 85.5167 },
      { name: 'Rajgir', lat: 25.0167, lng: 85.4167 },
      { name: 'Hilsa', lat: 25.3167, lng: 85.2833 },
      { name: 'Islampur', lat: 25.1500, lng: 85.2000 },
    ],
  },
  {
    district: 'Rohtas',
    areas: [
      { name: 'Sasaram', lat: 24.9500, lng: 84.0167 },
      { name: 'Dehri', lat: 24.9000, lng: 84.1833 },
      { name: 'Bikramganj', lat: 25.1667, lng: 84.2500 },
      { name: 'Dawath', lat: 24.8500, lng: 84.0833 },
    ],
  },
  {
    district: 'Buxar',
    areas: [
      { name: 'Buxar City', lat: 25.5667, lng: 83.9833 },
      { name: 'Dumraon', lat: 25.5500, lng: 84.1500 },
      { name: 'Rajpur', lat: 25.5000, lng: 84.0000 },
    ],
  },
  {
    district: 'Bhojpur',
    areas: [
      { name: 'Arrah', lat: 25.5500, lng: 84.6667 },
      { name: 'Jagdishpur', lat: 25.4667, lng: 84.4167 },
      { name: 'Piro', lat: 25.3333, lng: 84.4167 },
    ],
  },
  {
    district: 'Jehanabad',
    areas: [
      { name: 'Jehanabad City', lat: 25.2167, lng: 84.9833 },
      { name: 'Ghoshi', lat: 25.0833, lng: 84.8333 },
      { name: 'Makhdumpur', lat: 25.1000, lng: 84.9500 },
    ],
  },
  {
    district: 'Aurangabad',
    areas: [
      { name: 'Aurangabad City', lat: 24.7500, lng: 84.3667 },
      { name: 'Rafiganj', lat: 24.8167, lng: 84.6333 },
      { name: 'Daudnagar', lat: 25.0333, lng: 84.4000 },
    ],
  },
  {
    district: 'Nawada',
    areas: [
      { name: 'Nawada City', lat: 24.8833, lng: 85.5333 },
      { name: 'Rajauli', lat: 24.7833, lng: 85.4167 },
      { name: 'Hisua', lat: 24.8333, lng: 85.4167 },
    ],
  },
  {
    district: 'Jamui',
    areas: [
      { name: 'Jamui City', lat: 24.9167, lng: 86.2167 },
      { name: 'Lakhisarai', lat: 25.1667, lng: 86.0833 },
      { name: 'Sikandra', lat: 24.7500, lng: 86.0833 },
    ],
  },
  {
    district: 'Lakhisarai',
    areas: [
      { name: 'Lakhisarai City', lat: 25.1667, lng: 86.0833 },
      { name: 'Barahiya', lat: 25.2833, lng: 86.0167 },
      { name: 'Pipariya', lat: 25.2000, lng: 86.1500 },
    ],
  },
  {
    district: 'Sheikhpura',
    areas: [
      { name: 'Sheikhpura City', lat: 25.1333, lng: 85.8333 },
      { name: 'Barbigha', lat: 25.0333, lng: 85.7167 },
      { name: 'Shekhopur', lat: 25.0833, lng: 85.9000 },
    ],
  },
  {
    district: 'Begusarai',
    areas: [
      { name: 'Begusarai City', lat: 25.4167, lng: 86.1333 },
      { name: 'Barauni', lat: 25.4667, lng: 86.0167 },
      { name: 'Teghra', lat: 25.3500, lng: 85.9333 },
    ],
  },
  {
    district: 'Khagaria',
    areas: [
      { name: 'Khagaria City', lat: 25.5000, lng: 86.4667 },
      { name: 'Gogri', lat: 25.4167, lng: 86.3333 },
      { name: 'Alauli', lat: 25.3500, lng: 86.4167 },
    ],
  },
  {
    district: 'Munger',
    areas: [
      { name: 'Munger City', lat: 25.3833, lng: 86.4667 },
      { name: 'Jamalpur', lat: 25.3167, lng: 86.5000 },
      { name: 'Kharagpur', lat: 25.1167, lng: 86.5500 },
    ],
  },
  {
    district: 'Saharsa',
    areas: [
      { name: 'Saharsa City', lat: 25.8833, lng: 86.6000 },
      { name: 'Simri Bakhtiarpur', lat: 25.7500, lng: 86.6833 },
      { name: 'Mahishi', lat: 25.9667, lng: 86.5333 },
    ],
  },
  {
    district: 'Madhepura',
    areas: [
      { name: 'Madhepura City', lat: 25.9167, lng: 86.7833 },
      { name: 'Murliganj', lat: 25.9000, lng: 86.9833 },
      { name: 'Uda Kishanganj', lat: 26.0167, lng: 86.8500 },
    ],
  },
  {
    district: 'Supaul',
    areas: [
      { name: 'Supaul City', lat: 26.1167, lng: 86.6000 },
      { name: 'Nirmali', lat: 26.3167, lng: 86.5833 },
      { name: 'Tribeniganj', lat: 26.1333, lng: 86.7500 },
    ],
  },
  {
    district: 'Araria',
    areas: [
      { name: 'Araria City', lat: 26.1500, lng: 87.5167 },
      { name: 'Forbesganj', lat: 26.3000, lng: 87.2500 },
      { name: 'Jogbani', lat: 26.4167, lng: 87.2500 },
    ],
  },
  {
    district: 'Kishanganj',
    areas: [
      { name: 'Kishanganj City', lat: 26.1000, lng: 87.9333 },
      { name: 'Bahadurganj', lat: 26.2667, lng: 87.8167 },
      { name: 'Thakurganj', lat: 26.4333, lng: 88.1333 },
    ],
  },
  {
    district: 'Katihar',
    areas: [
      { name: 'Katihar City', lat: 25.5333, lng: 87.5833 },
      { name: 'Barsoi', lat: 25.6833, lng: 87.8500 },
      { name: 'Korha', lat: 25.4833, lng: 87.4167 },
    ],
  },
  {
    district: 'Madhubani',
    areas: [
      { name: 'Madhubani City', lat: 26.3667, lng: 86.0833 },
      { name: 'Jhanjharpur', lat: 26.2667, lng: 86.2833 },
      { name: 'Benipatti', lat: 26.2833, lng: 85.9167 },
    ],
  },
  {
    district: 'Sitamarhi',
    areas: [
      { name: 'Sitamarhi City', lat: 26.6000, lng: 85.4833 },
      { name: 'Dumra', lat: 26.5500, lng: 85.4167 },
      { name: 'Belsand', lat: 26.4500, lng: 85.4000 },
    ],
  },
  {
    district: 'Sheohar',
    areas: [
      { name: 'Sheohar City', lat: 26.5167, lng: 85.2833 },
      { name: 'Piprahi', lat: 26.4667, lng: 85.2500 },
      { name: 'Tariani', lat: 26.5500, lng: 85.3167 },
    ],
  },
  {
    district: 'East Champaran',
    areas: [
      { name: 'Motihari', lat: 26.6500, lng: 84.9167 },
      { name: 'Raxaul', lat: 26.9833, lng: 84.8500 },
      { name: 'Areraj', lat: 26.5500, lng: 84.6667 },
    ],
  },
  {
    district: 'West Champaran',
    areas: [
      { name: 'Bettiah', lat: 26.8000, lng: 84.5000 },
      { name: 'Bagaha', lat: 27.1000, lng: 84.0833 },
      { name: 'Narkatiaganj', lat: 27.0167, lng: 84.4167 },
    ],
  },
  {
    district: 'Siwan',
    areas: [
      { name: 'Siwan City', lat: 26.2167, lng: 84.3667 },
      { name: 'Maharajganj', lat: 26.1167, lng: 84.2667 },
      { name: 'Darauli', lat: 26.1500, lng: 84.4500 },
    ],
  },
  {
    district: 'Gopalganj',
    areas: [
      { name: 'Gopalganj City', lat: 26.4667, lng: 84.4333 },
      { name: 'Barauli', lat: 26.4000, lng: 84.5833 },
      { name: 'Kuchaikote', lat: 26.3500, lng: 84.5000 },
    ],
  },
  {
    district: 'Samastipur',
    areas: [
      { name: 'Samastipur City', lat: 25.8500, lng: 85.7833 },
      { name: 'Dalsinghsarai', lat: 25.6667, lng: 85.8333 },
      { name: 'Rosera', lat: 25.7167, lng: 85.6667 },
    ],
  },
  {
    district: 'Vaishali',
    areas: [
      { name: 'Hajipur', lat: 25.6833, lng: 85.2167 },
      { name: 'Lalganj', lat: 25.8667, lng: 85.1833 },
      { name: 'Mahua', lat: 26.0167, lng: 85.2833 },
    ],
  },
];

// Shop categories
const CATEGORIES = [
  'Grocery',
  'Restaurants',
  'Electronics',
  'Clothing Stores',
  'Medical',
  'Pharmacies',
  'Hardware Stores',
  'Furniture Stores',
  'Mobile Phones',
  'Footwear',
  'Jewelry Stores',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Home Services',
  'Automotive',
  'Education',
  'Salons',
  'Gyms',
  'Hotels',
  'Banks',
  'Real Estate',
  'Travel & Tourism',
  'Pet Shops',
  'Stationery',
  'Books',
];

// Shop name templates
const SHOP_PREFIXES = [
  'Shree', 'Shri', 'New', 'Modern', 'City', 'Royal', 'Super', 'Mega',
  'Prime', 'Elite', 'Gold', 'Silver', 'Best', 'Top', 'Grand', 'Premium',
];

const SHOP_SUFFIXES = [
  'Store', 'Shop', 'Mart', 'Center', 'Point', 'House', 'Palace', 'Bazaar',
  'Market', 'Emporium', 'Showroom', 'Outlet', 'Plaza', 'Mall', 'World',
];

// Owner names
const OWNER_NAMES = [
  'Raj Kumar', 'Amit Kumar', 'Ravi Shankar', 'Vikash Kumar', 'Suresh Kumar',
  'Manoj Kumar', 'Pankaj Kumar', 'Anil Kumar', 'Sunil Kumar', 'Ramesh Kumar',
  'Kiran Devi', 'Priya Kumari', 'Sunita Devi', 'Anita Devi', 'Rekha Devi',
  'Mohammad Ali', 'Hasan Raza', 'Shahid Khan', 'Imran Khan', 'Asif Ali',
  'Deepak Singh', 'Vikram Singh', 'Ajay Kumar', 'Nitin Kumar', 'Rahul Kumar',
];

// Generate random phone number
function generatePhone(): string {
  const prefixes = ['91', '91'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${number}`;
}

// Generate random pincode
function generatePincode(): string {
  return Math.floor(800000 + Math.random() * 200000).toString();
}

// Generate shop name
function generateShopName(category: string, area: string): string {
  const prefix = SHOP_PREFIXES[Math.floor(Math.random() * SHOP_PREFIXES.length)];
  const suffix = SHOP_SUFFIXES[Math.floor(Math.random() * SHOP_SUFFIXES.length)];
  const areaName = area.split(' ')[0]; // First word of area
  return `${prefix} ${category} ${suffix} ${areaName}`;
}

// Generate coordinates with slight variation
function generateCoordinates(baseLat: number, baseLng: number): { lat: number; lng: number } {
  // Add random variation of ±0.01 degrees (approximately ±1 km)
  const latVariation = (Math.random() - 0.5) * 0.02;
  const lngVariation = (Math.random() - 0.5) * 0.02;
  return {
    lat: baseLat + latVariation,
    lng: baseLng + lngVariation,
  };
}

// Placeholder image URL
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=Shop+Image';

// Generate unique slug helper function
function generateUniqueSlug(shopName: string, existingSlugs: Set<string>): string {
  let baseSlug = textToSlug(shopName);
  let slug = baseSlug;
  let counter = 1;
  
  // If slug exists, add a counter suffix
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

async function generateBiharShops() {
  console.log('🔄 Starting Bihar shops generation...');

  try {
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Get existing shop URLs to avoid duplicates
    const existingShops = await AdminShop.find({}, 'shopUrl').lean();
    const existingSlugs = new Set<string>(
      existingShops.map((shop: any) => shop.shopUrl).filter(Boolean)
    );

    let totalShops = 0;
    let createdShops = 0;
    let failedShops = 0;

    // Process each district
    for (const districtData of BIHAR_DISTRICTS) {
      console.log(`\n📍 Processing District: ${districtData.district}`);

      // Process each area in the district
      for (const areaData of districtData.areas) {
        console.log(`  🏘️  Processing Area: ${areaData.name}`);

        // Select 2 different categories for this area
        const selectedCategories = CATEGORIES
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        // Create 2 shops for this area
        for (let i = 0; i < 2; i++) {
          const category = selectedCategories[i];
          const ownerName = OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)];
          const shopName = generateShopName(category, areaData.name);
          const coordinates = generateCoordinates(areaData.lat, areaData.lng);
          const mobile = generatePhone();
          const pincode = generatePincode();

          // Generate unique slug
          const shopUrl = generateUniqueSlug(shopName, existingSlugs);
          existingSlugs.add(shopUrl);

          const shopData = {
            shopName,
            ownerName,
            category,
            mobile,
            area: areaData.name,
            fullAddress: `${areaData.name}, ${districtData.district}, Bihar`,
            city: districtData.district,
            district: districtData.district,
            pincode,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            photoUrl: PLACEHOLDER_IMAGE,
            iconUrl: PLACEHOLDER_IMAGE,
            shopUrl,
            paymentStatus: 'PAID' as const,
            paymentExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            lastPaymentDate: new Date(),
            visitorCount: Math.floor(Math.random() * 1000),
            planType: 'BASIC' as const,
            planAmount: 100,
            planStartDate: new Date(),
            planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            priorityRank: 0,
            isHomePageBanner: false,
            isTopSlider: false,
            isLeftBar: false,
            isRightBar: false,
            isHero: false,
            createdAt: new Date(),
          };

          try {
            await AdminShop.create(shopData);
            createdShops++;
            totalShops++;
            console.log(`    ✅ Created: ${shopName} (${category})`);
          } catch (error: any) {
            failedShops++;
            console.error(`    ❌ Failed: ${shopName} - ${error.message}`);
          }
        }
      }
    }

    console.log('\n============================================================');
    console.log('📊 SUMMARY');
    console.log('============================================================');
    console.log(`✅ Successfully created: ${createdShops} shops`);
    console.log(`❌ Failed to create: ${failedShops} shops`);
    console.log(`📦 Total processed: ${totalShops} shops`);
    console.log('============================================================');

  } catch (error) {
    console.error('Fatal error during script execution:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('✅ Script completed. MongoDB connection closed.');
    }
  }
}

// Run the script
generateBiharShops();

