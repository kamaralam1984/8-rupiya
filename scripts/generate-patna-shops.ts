/**
 * Script to generate 100 shops per plan type (700 total shops)
 * Distributed across all Patna pincodes with proper coordinates
 */

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import AdminShop from '../lib/models/Shop';
import AgentShop from '../lib/models/AgentShop';
import Agent from '../lib/models/Agent';
import { PRICING_PLANS, PlanType } from '../app/utils/pricing';

// Load Patna locations from JSON file
const patnaLocationsPath = path.join(process.cwd(), 'app', 'patna_full_locations.json');
const patnaLocations = JSON.parse(fs.readFileSync(patnaLocationsPath, 'utf-8'));

// Plan types
const PLAN_TYPES: PlanType[] = ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_BAR', 'BANNER', 'HERO'];

// Shop categories (common ones)
const CATEGORIES = [
  'Grocery', 'Restaurants', 'Electronics', 'Clothing Stores', 'Medical',
  'Pharmacies', 'Hardware Stores', 'Furniture Stores', 'Mobile Phones',
  'Footwear', 'Jewelry Stores', 'Beauty & Personal Care', 'Sports & Fitness',
  'Home Services', 'Automotive', 'Education', 'Salons', 'Gyms', 'Hotels'
];

// Shop name prefixes and suffixes
const SHOP_PREFIXES = [
  'Shree', 'Shri', 'New', 'Modern', 'City', 'Patna', 'Bihar', 'Royal',
  'Super', 'Mega', 'Prime', 'Elite', 'Gold', 'Silver', 'Best', 'Top'
];

const SHOP_SUFFIXES = [
  'Store', 'Shop', 'Mart', 'Center', 'Point', 'House', 'Palace', 'Bazaar',
  'Market', 'Emporium', 'Showroom', 'Outlet', 'Plaza', 'Mall'
];

// Owner name templates
const OWNER_NAMES = [
  'Raj Kumar', 'Amit Kumar', 'Ravi Shankar', 'Vikash Kumar', 'Suresh Kumar',
  'Manoj Kumar', 'Pankaj Kumar', 'Anil Kumar', 'Sunil Kumar', 'Ramesh Kumar',
  'Kiran Devi', 'Priya Kumari', 'Sunita Devi', 'Anita Devi', 'Rekha Devi',
  'Mohammad Ali', 'Hasan Raza', 'Shahid Khan', 'Imran Khan', 'Asif Ali'
];

// Generate random number between min and max
function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random float between min and max
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Generate shop name
function generateShopName(category: string): string {
  const prefix = SHOP_PREFIXES[random(0, SHOP_PREFIXES.length - 1)];
  const suffix = SHOP_SUFFIXES[random(0, SHOP_SUFFIXES.length - 1)];
  return `${prefix} ${category} ${suffix}`;
}

// Generate owner name
function generateOwnerName(): string {
  return OWNER_NAMES[random(0, OWNER_NAMES.length - 1)];
}

// Generate mobile number
function generateMobile(): string {
  const prefixes = ['7004', '7005', '7006', '7007', '7008', '7009', '8002', '8003', '8004', '8005'];
  const prefix = prefixes[random(0, prefixes.length - 1)];
  const suffix = String(random(100000, 999999));
  return `+91${prefix}${suffix}`;
}

// Generate coordinates for a pincode (approximate Patna area)
// Patna bounds: lat 25.3-25.8, lng 84.9-85.4
function generateCoordinatesForPincode(pincode: number): { lat: number; lng: number } {
  // Use pincode as seed for consistent coordinates per pincode
  const seed = pincode % 1000;
  const lat = 25.3 + (seed / 1000) * 0.5; // 25.3 to 25.8
  const lng = 84.9 + ((seed * 7) % 1000) / 1000 * 0.5; // 84.9 to 85.4
  
  // Add small random variation (±0.01)
  return {
    lat: parseFloat((lat + randomFloat(-0.01, 0.01)).toFixed(6)),
    lng: parseFloat((lng + randomFloat(-0.01, 0.01)).toFixed(6))
  };
}

// Generate address
function generateAddress(location: string, pincode: number): string {
  const streetNumbers = ['123', '456', '789', '12A', '34B', '56C', '78D'];
  const streetNames = ['Main Road', 'Market Road', 'Station Road', 'Gandhi Nagar', 'Rajendra Path'];
  const street = streetNames[random(0, streetNames.length - 1)];
  const number = streetNumbers[random(0, streetNumbers.length - 1)];
  return `${number}, ${street}, ${location}, Patna - ${pincode}, Bihar`;
}

// Get unique pincodes from locations
function getUniquePincodes(): Array<{ pincode: number; location: string }> {
  const pincodeMap = new Map<number, string>();
  patnaLocations.forEach((loc: any) => {
    if (!pincodeMap.has(loc.Pincode)) {
      pincodeMap.set(loc.Pincode, loc.Location);
    }
  });
  return Array.from(pincodeMap.entries()).map(([pincode, location]) => ({
    pincode,
    location
  }));
}

// Generate shops for a plan type
async function generateShopsForPlan(planType: PlanType, count: number = 100) {
  const uniquePincodes = getUniquePincodes();
  const shopsPerPincode = Math.ceil(count / uniquePincodes.length);
  const planDetails = PRICING_PLANS[planType];
  
  console.log(`\n📦 Generating ${count} shops for ${planDetails.name}...`);
  
  const shops = [];
  let shopCount = 0;
  
  for (const { pincode, location } of uniquePincodes) {
    if (shopCount >= count) break;
    
    const shopsForThisPincode = Math.min(shopsPerPincode, count - shopCount);
    const coords = generateCoordinatesForPincode(pincode);
    
    for (let i = 0; i < shopsForThisPincode; i++) {
      const category = CATEGORIES[random(0, CATEGORIES.length - 1)];
      const shopName = generateShopName(category);
      const ownerName = generateOwnerName();
      const mobile = generateMobile();
      const address = generateAddress(location, pincode);
      const photoUrl = `https://images.unsplash.com/photo-${random(1500000000000, 1600000000000)}?w=400&h=300&fit=crop`;
      
      // Calculate dates
      const now = new Date();
      const paymentDate = new Date(now.getTime() - random(0, 30) * 24 * 60 * 60 * 1000); // Random date in last 30 days
      const expiryDate = new Date(paymentDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      // Create shop data
      const shopData = {
        shopName,
        ownerName,
        category,
        mobile,
        pincode: String(pincode),
        address,
        fullAddress: address,
        city: 'Patna',
        area: location,
        district: 'Patna',
        latitude: coords.lat,
        longitude: coords.lng,
        photoUrl,
        iconUrl: photoUrl,
        planType,
        planAmount: planDetails.amount,
        planStartDate: paymentDate,
        planEndDate: expiryDate,
        priorityRank: planDetails.priorityRank,
        isHomePageBanner: planDetails.canBeHomePageBanner,
        isTopSlider: planDetails.canBeTopSlider,
        isLeftBar: planDetails.canBeLeftBar,
        isRightBar: planDetails.canBeRightBar,
        isHero: planDetails.canBeHero,
        visitorCount: random(0, 500),
        lastPaymentDate: paymentDate,
        paymentExpiryDate: expiryDate,
        createdAt: paymentDate,
      };
      
      shops.push(shopData);
      shopCount++;
    }
  }
  
  // Insert into AdminShop collection
  console.log(`  ✓ Creating ${shops.length} shops in AdminShop collection...`);
  await AdminShop.insertMany(shops);
  console.log(`  ✓ Successfully created ${shops.length} AdminShop records`);
  
  // Get or create a system agent for these shops
  let systemAgent = await Agent.findOne({ agentCode: 'SYSTEM' });
  if (!systemAgent) {
    // Password will be hashed by pre-save hook
    systemAgent = await Agent.create({
      agentCode: 'SYSTEM',
      name: 'System Generated',
      email: 'system@digitalindia.com',
      phone: '+911234567890',
      passwordHash: 'system123', // Will be hashed by pre-save hook
      totalShops: 0,
      totalEarnings: 0,
    });
  }
  
  // Create corresponding AgentShop records (for tracking)
  const agentShops = shops.map((shop, index) => ({
    shopName: shop.shopName,
    ownerName: shop.ownerName,
    mobile: shop.mobile,
    category: shop.category,
    pincode: shop.pincode,
    address: shop.address,
    photoUrl: shop.photoUrl,
    latitude: shop.latitude,
    longitude: shop.longitude,
    paymentStatus: 'PAID' as const,
    paymentMode: 'CASH' as const,
    receiptNo: `REC${planType}${String(index + 1).padStart(4, '0')}`,
    amount: shop.planAmount,
    planType: shop.planType,
    planAmount: shop.planAmount,
    agentCommission: planDetails.agentCommission,
    district: shop.district,
    paymentExpiryDate: shop.paymentExpiryDate,
    lastPaymentDate: shop.lastPaymentDate,
    visitorCount: shop.visitorCount,
    sendSmsReceipt: false,
    agentId: systemAgent._id, // System agent ID
    createdAt: shop.createdAt,
  }));
  
  console.log(`  ✓ Creating ${agentShops.length} shops in AgentShop collection...`);
  await AgentShop.insertMany(agentShops);
  console.log(`  ✓ Successfully created ${agentShops.length} AgentShop records`);
  
  return shops.length;
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting shop generation script...');
    console.log('📊 Plan types:', PLAN_TYPES.join(', '));
    console.log('🎯 Target: 100 shops per plan = 700 total shops\n');
    
    await connectDB();
    console.log('✓ Connected to MongoDB\n');
    
    // Check existing shops count
    const existingAdminShops = await AdminShop.countDocuments();
    const existingAgentShops = await AgentShop.countDocuments();
    console.log(`📊 Existing shops: ${existingAdminShops} AdminShop, ${existingAgentShops} AgentShop`);
    
    if (existingAdminShops > 0 || existingAgentShops > 0) {
      console.log('⚠️  Warning: Existing shops found. New shops will be added to the database.');
      console.log('   To start fresh, delete existing shops first.\n');
    }
    
    let totalShops = 0;
    
    for (const planType of PLAN_TYPES) {
      const count = await generateShopsForPlan(planType, 100);
      totalShops += count;
    }
    
    console.log(`\n✅ Successfully generated ${totalShops} shops across ${PLAN_TYPES.length} plan types!`);
    console.log(`\n📈 Summary:`);
    PLAN_TYPES.forEach(planType => {
      console.log(`  - ${PRICING_PLANS[planType].name}: 100 shops`);
    });
    
    // Final counts
    const finalAdminShops = await AdminShop.countDocuments();
    const finalAgentShops = await AgentShop.countDocuments();
    console.log(`\n📊 Final counts: ${finalAdminShops} AdminShop, ${finalAgentShops} AgentShop`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating shops:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export default main;
