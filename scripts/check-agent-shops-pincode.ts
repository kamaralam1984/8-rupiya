/**
 * Script to check if agent shops are being saved with pincode correctly
 * Run: npx tsx scripts/check-agent-shops-pincode.ts
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('✅ Loaded .env.local');
} else if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('✅ Loaded .env');
} else {
  console.log('⚠️ No .env.local or .env file found');
}

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function checkAgentShops() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Dynamically import modules AFTER env vars are loaded
    const { default: connectDB } = await import('../lib/mongodb');
    const { default: AgentShop } = await import('../lib/models/AgentShop');
    
    await connectDB();

    // Get all agent shops
    const AgentShopModel = await AgentShop;
    const allShops = await AgentShopModel.find({}).select('shopName pincode area address paymentStatus createdAt').lean();
    
    console.log(`\n📊 Total Agent Shops: ${allShops.length}`);
    
    // Group by pincode
    const shopsByPincode: Record<string, any[]> = {};
    const shopsWithoutPincode: any[] = [];
    const shopsByPaymentStatus: Record<string, number> = {};
    
    for (const shop of allShops) {
      // Count by payment status
      const status = shop.paymentStatus || 'NO_STATUS';
      shopsByPaymentStatus[status] = (shopsByPaymentStatus[status] || 0) + 1;
      
      // Group by pincode
      if (shop.pincode && shop.pincode.trim()) {
        const pin = shop.pincode.trim();
        if (!shopsByPincode[pin]) {
          shopsByPincode[pin] = [];
        }
        shopsByPincode[pin].push(shop);
      } else {
        shopsWithoutPincode.push(shop);
      }
    }
    
    console.log('\n📈 Shops by Payment Status:');
    for (const [status, count] of Object.entries(shopsByPaymentStatus)) {
      console.log(`  ${status}: ${count}`);
    }
    
    console.log(`\n📍 Shops with Pincode: ${allShops.length - shopsWithoutPincode.length}`);
    console.log(`❌ Shops without Pincode: ${shopsWithoutPincode.length}`);
    
    if (shopsWithoutPincode.length > 0) {
      console.log('\n⚠️ Shops without pincode:');
      shopsWithoutPincode.slice(0, 5).forEach(shop => {
        console.log(`  - ${shop.shopName} (ID: ${shop._id})`);
      });
      if (shopsWithoutPincode.length > 5) {
        console.log(`  ... and ${shopsWithoutPincode.length - 5} more`);
      }
    }
    
    console.log(`\n📋 Unique Pincodes: ${Object.keys(shopsByPincode).length}`);
    console.log('\n📍 Shops by Pincode:');
    const sortedPincodes = Object.keys(shopsByPincode).sort();
    for (const pincode of sortedPincodes.slice(0, 20)) {
      const shops = shopsByPincode[pincode];
      const paid = shops.filter(s => s.paymentStatus === 'PAID').length;
      const pending = shops.filter(s => s.paymentStatus === 'PENDING').length;
      const noStatus = shops.filter(s => !s.paymentStatus).length;
      console.log(`  ${pincode}: ${shops.length} shops (PAID: ${paid}, PENDING: ${pending}, NO_STATUS: ${noStatus})`);
      shops.slice(0, 3).forEach(shop => {
        console.log(`    - ${shop.shopName} (${shop.paymentStatus || 'NO_STATUS'}) - Area: ${shop.area || 'N/A'}`);
      });
      if (shops.length > 3) {
        console.log(`    ... and ${shops.length - 3} more`);
      }
    }
    
    if (sortedPincodes.length > 20) {
      console.log(`\n  ... and ${sortedPincodes.length - 20} more pincodes`);
    }
    
    // Test search query for a specific pincode
    if (sortedPincodes.length > 0) {
      const testPincode = sortedPincodes[0];
      console.log(`\n🔍 Testing search for pincode: ${testPincode}`);
      
      const agentPaymentFilter = {
        $or: [
          { paymentStatus: 'PAID' },
          { paymentStatus: 'PENDING' },
          { paymentStatus: { $exists: false } },
        ],
      };
      
      const searchQuery = {
        $and: [
          { pincode: testPincode },
          agentPaymentFilter,
        ],
      };
      
      const results = await AgentShopModel.find(searchQuery).select('shopName pincode area paymentStatus').lean();
      console.log(`  Found ${results.length} shops with pincode ${testPincode} (including PENDING)`);
      results.forEach(shop => {
        console.log(`    - ${shop.shopName} (${shop.paymentStatus || 'NO_STATUS'})`);
      });
    }
    
    console.log('\n✅ Check completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAgentShops();

