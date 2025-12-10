/**
 * Script to generate 100 agent shops from all over Bihar
 * Each shop with proper location coordinates and images
 */

// Load environment variables FIRST
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try multiple env file locations
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.error('❌ No .env.local or .env file found!');
  process.exit(1);
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables!');
  process.exit(1);
}

// Use dynamic imports to load modules after env is set
async function generateAgentShops() {
  const mongoose = (await import('mongoose')).default;
  const { default: connectDB } = await import('../lib/mongodb');
  const { default: AgentShop } = await import('../lib/models/AgentShop');
  const { default: Agent } = await import('../lib/models/Agent');
  
  // Generate unique slug function (without external dependencies)
  function generateUniqueSlug(name: string, existingSlugs?: Set<string>): string {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-') // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    if (!baseSlug) {
      baseSlug = 'item';
    }

    let uniqueSlug = baseSlug;
    let counter = 0;
    const MAX_ATTEMPTS = 100;

    const generateSuffix = () => Math.random().toString(36).substring(2, 8);

    while (existingSlugs && existingSlugs.has(uniqueSlug) && counter < MAX_ATTEMPTS) {
      uniqueSlug = `${baseSlug}-${generateSuffix()}`;
      counter++;
    }

    if (existingSlugs && existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    return uniqueSlug;
  }

  // Bihar Districts with their major areas and coordinates (distributed across Bihar)
  const BIHAR_LOCATIONS = [
    // Patna District
    { district: 'Patna', area: 'Bailey Road', lat: 25.6093, lng: 85.1235 },
    { district: 'Patna', area: 'Boring Road', lat: 25.6150, lng: 85.1300 },
    { district: 'Patna', area: 'Kankarbagh', lat: 25.6000, lng: 85.1500 },
    { district: 'Patna', area: 'Rajendra Nagar', lat: 25.6200, lng: 85.1400 },
    { district: 'Patna', area: 'Exhibition Road', lat: 25.6100, lng: 85.1200 },
    { district: 'Patna', area: 'Fraser Road', lat: 25.6050, lng: 85.1250 },
    { district: 'Patna', area: 'Ashiana Nagar', lat: 25.5950, lng: 85.1350 },
    { district: 'Patna', area: 'Danapur', lat: 25.6400, lng: 85.0500 },
    
    // Gaya District
    { district: 'Gaya', area: 'Bodh Gaya', lat: 24.6951, lng: 84.9914 },
    { district: 'Gaya', area: 'Gaya City', lat: 24.7969, lng: 85.0039 },
    { district: 'Gaya', area: 'Tekari', lat: 24.9333, lng: 84.8333 },
    { district: 'Gaya', area: 'Sherghati', lat: 24.5667, lng: 84.7833 },
    
    // Muzaffarpur District
    { district: 'Muzaffarpur', area: 'Muzaffarpur City', lat: 26.1209, lng: 85.3647 },
    { district: 'Muzaffarpur', area: 'Motihari', lat: 26.6500, lng: 84.9167 },
    { district: 'Muzaffarpur', area: 'Sitamarhi', lat: 26.6000, lng: 85.4833 },
    { district: 'Muzaffarpur', area: 'Hajipur', lat: 25.6833, lng: 85.2167 },
    
    // Bhagalpur District
    { district: 'Bhagalpur', area: 'Bhagalpur City', lat: 25.2530, lng: 87.0040 },
    { district: 'Bhagalpur', area: 'Banka', lat: 24.8833, lng: 86.9167 },
    { district: 'Bhagalpur', area: 'Kahalgaon', lat: 25.2667, lng: 87.2333 },
    
    // Darbhanga District
    { district: 'Darbhanga', area: 'Darbhanga City', lat: 26.1520, lng: 85.8970 },
    { district: 'Darbhanga', area: 'Madhubani', lat: 26.3667, lng: 86.0833 },
    { district: 'Darbhanga', area: 'Samastipur', lat: 25.8500, lng: 85.7833 },
    
    // Purnia District
    { district: 'Purnia', area: 'Purnia City', lat: 25.7833, lng: 87.4667 },
    { district: 'Purnia', area: 'Katihar', lat: 25.5333, lng: 87.5833 },
    { district: 'Purnia', area: 'Kishanganj', lat: 26.1000, lng: 87.9333 },
    
    // Saran District
    { district: 'Saran', area: 'Chhapra', lat: 25.7833, lng: 84.7333 },
    { district: 'Saran', area: 'Siwan', lat: 26.2167, lng: 84.3667 },
    { district: 'Saran', area: 'Gopalganj', lat: 26.4667, lng: 84.4333 },
    
    // Vaishali District
    { district: 'Vaishali', area: 'Hajipur', lat: 25.6833, lng: 85.2167 },
    { district: 'Vaishali', area: 'Mahua', lat: 26.0167, lng: 85.2833 },
    
    // Nalanda District
    { district: 'Nalanda', area: 'Bihar Sharif', lat: 25.2000, lng: 85.5167 },
    { district: 'Nalanda', area: 'Rajgir', lat: 25.0167, lng: 85.4167 },
    
    // Rohtas District
    { district: 'Rohtas', area: 'Sasaram', lat: 24.9500, lng: 84.0167 },
    { district: 'Rohtas', area: 'Dehri', lat: 24.9000, lng: 84.1833 },
    
    // Buxar District
    { district: 'Buxar', area: 'Buxar City', lat: 25.5667, lng: 83.9833 },
    { district: 'Buxar', area: 'Dumraon', lat: 25.5500, lng: 84.1500 },
    
    // Bhojpur District
    { district: 'Bhojpur', area: 'Arrah', lat: 25.5500, lng: 84.6667 },
    { district: 'Bhojpur', area: 'Jagdishpur', lat: 25.4667, lng: 84.4167 },
    
    // Jehanabad District
    { district: 'Jehanabad', area: 'Jehanabad City', lat: 25.2167, lng: 84.9833 },
    { district: 'Jehanabad', area: 'Ghoshi', lat: 25.0833, lng: 84.8333 },
    
    // Aurangabad District
    { district: 'Aurangabad', area: 'Aurangabad City', lat: 24.7500, lng: 84.3667 },
    { district: 'Aurangabad', area: 'Rafiganj', lat: 24.8167, lng: 84.6333 },
    
    // Nawada District
    { district: 'Nawada', area: 'Nawada City', lat: 24.8833, lng: 85.5333 },
    { district: 'Nawada', area: 'Rajauli', lat: 24.7833, lng: 85.4167 },
    
    // Jamui District
    { district: 'Jamui', area: 'Jamui City', lat: 24.9167, lng: 86.2167 },
    { district: 'Jamui', area: 'Lakhisarai', lat: 25.1667, lng: 86.0833 },
    
    // Lakhisarai District
    { district: 'Lakhisarai', area: 'Lakhisarai City', lat: 25.1667, lng: 86.0833 },
    { district: 'Lakhisarai', area: 'Barahiya', lat: 25.2833, lng: 86.0167 },
    
    // Sheikhpura District
    { district: 'Sheikhpura', area: 'Sheikhpura City', lat: 25.1333, lng: 85.8333 },
    { district: 'Sheikhpura', area: 'Barbigha', lat: 25.0333, lng: 85.7167 },
    
    // Begusarai District
    { district: 'Begusarai', area: 'Begusarai City', lat: 25.4167, lng: 86.1333 },
    { district: 'Begusarai', area: 'Barauni', lat: 25.4667, lng: 86.0167 },
    
    // Khagaria District
    { district: 'Khagaria', area: 'Khagaria City', lat: 25.5000, lng: 86.4667 },
    { district: 'Khagaria', area: 'Gogri', lat: 25.4167, lng: 86.3333 },
    
    // Munger District
    { district: 'Munger', area: 'Munger City', lat: 25.3833, lng: 86.4667 },
    { district: 'Munger', area: 'Jamalpur', lat: 25.3167, lng: 86.5000 },
    
    // Saharsa District
    { district: 'Saharsa', area: 'Saharsa City', lat: 25.8833, lng: 86.6000 },
    { district: 'Saharsa', area: 'Simri Bakhtiarpur', lat: 25.7500, lng: 86.6833 },
    
    // Madhepura District
    { district: 'Madhepura', area: 'Madhepura City', lat: 25.9167, lng: 86.7833 },
    { district: 'Madhepura', area: 'Murliganj', lat: 25.9000, lng: 86.9833 },
    
    // Supaul District
    { district: 'Supaul', area: 'Supaul City', lat: 26.1167, lng: 86.6000 },
    { district: 'Supaul', area: 'Nirmali', lat: 26.3167, lng: 86.5833 },
    
    // Araria District
    { district: 'Araria', area: 'Araria City', lat: 26.1500, lng: 87.5167 },
    { district: 'Araria', area: 'Forbesganj', lat: 26.3000, lng: 87.2500 },
    
    // Kishanganj District
    { district: 'Kishanganj', area: 'Kishanganj City', lat: 26.1000, lng: 87.9333 },
    { district: 'Kishanganj', area: 'Bahadurganj', lat: 26.2667, lng: 87.8167 },
    
    // Katihar District
    { district: 'Katihar', area: 'Katihar City', lat: 25.5333, lng: 87.5833 },
    { district: 'Katihar', area: 'Barsoi', lat: 25.6833, lng: 87.8500 },
    
    // Madhubani District
    { district: 'Madhubani', area: 'Madhubani City', lat: 26.3667, lng: 86.0833 },
    { district: 'Madhubani', area: 'Jhanjharpur', lat: 26.2667, lng: 86.2833 },
    
    // Sitamarhi District
    { district: 'Sitamarhi', area: 'Sitamarhi City', lat: 26.6000, lng: 85.4833 },
    { district: 'Sitamarhi', area: 'Dumra', lat: 26.5500, lng: 85.4167 },
    
    // Sheohar District
    { district: 'Sheohar', area: 'Sheohar City', lat: 26.5167, lng: 85.2833 },
    
    // East Champaran District
    { district: 'East Champaran', area: 'Motihari', lat: 26.6500, lng: 84.9167 },
    { district: 'East Champaran', area: 'Raxaul', lat: 26.9833, lng: 84.8500 },
    
    // West Champaran District
    { district: 'West Champaran', area: 'Bettiah', lat: 26.8000, lng: 84.5000 },
    { district: 'West Champaran', area: 'Bagaha', lat: 27.1000, lng: 84.0833 },
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
    'Bihar', 'Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur',
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
    'Pramod Kumar', 'Sanjay Kumar', 'Vijay Kumar', 'Rajesh Kumar', 'Mahesh Kumar',
  ];

  // Generate random phone number
  function generatePhone(): string {
    const prefixes = ['7004', '7005', '7006', '7007', '7008', '7009', '8002', '8003', '8004', '8005', '9006', '9007'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(100000 + Math.random() * 900000);
    return `+91${prefix}${number}`;
  }

  // Generate random pincode
  function generatePincode(): string {
    // Bihar pincodes range from 800000 to 855000
    return Math.floor(800000 + Math.random() * 55000).toString();
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
      lat: parseFloat((baseLat + latVariation).toFixed(6)),
      lng: parseFloat((baseLng + lngVariation).toFixed(6)),
    };
  }

  // Generate image URL (using placeholder or random image)
  function generateImageUrl(category: string): string {
    // Use placeholder images or random image URLs
    const imageIds = [
      '1500000000000', '1510000000000', '1520000000000', '1530000000000', '1540000000000',
      '1550000000000', '1560000000000', '1570000000000', '1580000000000', '1590000000000',
    ];
    const imageId = imageIds[Math.floor(Math.random() * imageIds.length)];
    return `https://images.unsplash.com/photo-${imageId}?w=400&h=300&fit=crop`;
  }

  console.log('🔄 Starting Agent Shops generation for Bihar...');

  try {
    await connectDB();
    console.log('✅ MongoDB Connected');

    // Get or create a default agent
    let defaultAgent = await Agent.findOne({ email: 'agent@bihar.com' });
    if (!defaultAgent) {
      // Generate unique agent code
      const existingCodes = await Agent.find({}, 'agentCode').lean();
      const usedCodes = new Set(existingCodes.map((a: any) => a.agentCode));
      let agentCode = 'AG001';
      let counter = 1;
      while (usedCodes.has(agentCode)) {
        counter++;
        agentCode = `AG${counter.toString().padStart(3, '0')}`;
      }
      
      defaultAgent = await Agent.create({
        name: 'Bihar Agent',
        email: 'agent@bihar.com',
        phone: '+919876543210',
        passwordHash: 'password123', // Will be hashed automatically by pre-save hook
        agentCode,
        totalShops: 0,
        totalEarnings: 0,
      });
      console.log(`✅ Created default agent with code: ${agentCode}`);
    } else {
      console.log(`✅ Using existing agent: ${defaultAgent.agentCode}`);
    }

    // Get existing shop URLs to avoid duplicates
    const existingShops = await AgentShop.find({}, 'shopUrl').lean();
    const existingSlugs = new Set<string>(
      existingShops.map((shop: any) => shop.shopUrl).filter(Boolean)
    );

    // Shuffle locations to get random distribution
    const shuffledLocations = [...BIHAR_LOCATIONS].sort(() => Math.random() - 0.5);
    
    let createdShops = 0;
    let failedShops = 0;
    const totalShops = 100;

    // Create 100 shops
    for (let i = 0; i < totalShops && i < shuffledLocations.length; i++) {
      const location = shuffledLocations[i];
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const ownerName = OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)];
      const shopName = generateShopName(category, location.area);
      const coordinates = generateCoordinates(location.lat, location.lng);
      const mobile = generatePhone();
      const pincode = generatePincode();
      const imageUrl = generateImageUrl(category);

      // Generate unique slug
      const shopUrl = generateUniqueSlug(shopName, existingSlugs);
      existingSlugs.add(shopUrl);

      const shopData = {
        shopName,
        ownerName,
        category,
        mobile,
        pincode,
        address: `${location.area}, ${location.district}, Bihar - ${pincode}`,
        district: location.district,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        photoUrl: imageUrl,
        shopUrl,
        agentId: defaultAgent._id,
        paymentStatus: 'PAID' as const,
        paymentMode: 'CASH' as const,
        receiptNo: `REC${Date.now()}${i}`,
        amount: 100,
        sendSmsReceipt: false,
        paymentExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        lastPaymentDate: new Date(),
        visitorCount: Math.floor(Math.random() * 1000),
        planType: 'BASIC' as const,
        planAmount: 100,
        agentCommission: 20, // ₹20 commission for Basic plan
        createdAt: new Date(),
      };

      try {
        await AgentShop.create(shopData);
        createdShops++;
        console.log(`✅ [${i + 1}/${totalShops}] Created: ${shopName} (${category}) - ${location.area}, ${location.district}`);
      } catch (error: any) {
        failedShops++;
        console.error(`❌ [${i + 1}/${totalShops}] Failed: ${shopName} - ${error.message}`);
      }
    }

    // If we need more shops, cycle through locations again
    if (createdShops < totalShops) {
      const remaining = totalShops - createdShops;
      for (let i = 0; i < remaining; i++) {
        const location = shuffledLocations[i % shuffledLocations.length];
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const ownerName = OWNER_NAMES[Math.floor(Math.random() * OWNER_NAMES.length)];
        const shopName = generateShopName(category, location.area) + ` ${i + 1}`;
        const coordinates = generateCoordinates(location.lat, location.lng);
        const mobile = generatePhone();
        const pincode = generatePincode();
        const imageUrl = generateImageUrl(category);

        const shopUrl = generateUniqueSlug(shopName, existingSlugs);
        existingSlugs.add(shopUrl);

        const shopData = {
          shopName,
          ownerName,
          category,
          mobile,
          pincode,
          address: `${location.area}, ${location.district}, Bihar - ${pincode}`,
          district: location.district,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          photoUrl: imageUrl,
          shopUrl,
          agentId: defaultAgent._id,
          paymentStatus: 'PAID' as const,
          paymentMode: 'CASH' as const,
          receiptNo: `REC${Date.now()}${createdShops + i}`,
          amount: 100,
          sendSmsReceipt: false,
          paymentExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          lastPaymentDate: new Date(),
          visitorCount: Math.floor(Math.random() * 1000),
          planType: 'BASIC' as const,
          planAmount: 100,
          agentCommission: 20, // ₹20 commission for Basic plan
          createdAt: new Date(),
        };

        try {
          await AgentShop.create(shopData);
          createdShops++;
          console.log(`✅ [${createdShops}/${totalShops}] Created: ${shopName} (${category}) - ${location.area}, ${location.district}`);
        } catch (error: any) {
          failedShops++;
          console.error(`❌ [${createdShops + failedShops}/${totalShops}] Failed: ${shopName} - ${error.message}`);
        }
      }
    }

    console.log('\n============================================================');
    console.log('📊 SUMMARY');
    console.log('============================================================');
    console.log(`✅ Successfully created: ${createdShops} agent shops`);
    console.log(`❌ Failed to create: ${failedShops} shops`);
    console.log(`📦 Total processed: ${createdShops + failedShops} shops`);
    console.log(`📍 Locations covered: ${new Set(shuffledLocations.slice(0, totalShops).map(l => l.district)).size} districts`);
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
generateAgentShops().catch(console.error);
