/**
 * Migration Script: Migrate existing pincodes from shops to Pincode model
 * 
 * This script extracts unique pincode+area combinations from:
 * - AgentShop collection
 * - AdminShop collection
 * 
 * And adds them to the Pincode model (if they don't already exist)
 */

// IMPORTANT: Load environment variables BEFORE any other imports
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local file first
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

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Please make sure .env.local or .env file exists with MONGODB_URI');
  process.exit(1);
}

async function migratePincodes() {
  try {
    console.log('🔄 Starting pincode migration...');
    
    // Dynamically import modules AFTER env vars are loaded
    const mongoose = await import('mongoose');
    const { default: connectDB } = await import('../lib/mongodb');
    const { default: AgentShop } = await import('../lib/models/AgentShop');
    const { default: AdminShop } = await import('../lib/models/Shop');
    const { default: Pincode } = await import('../lib/models/Pincode');
    
    await connectDB();

    // Get all shops with pincode (area may not exist for old shops)
    const [agentShops, adminShops] = await Promise.all([
      (await AgentShop).find({
        pincode: { $exists: true, $ne: '' },
      }).select('pincode area city address').lean(),
      (await AdminShop).find({
        pincode: { $exists: true, $ne: '' },
      }).select('pincode area city address').lean(),
    ]);

    console.log(`📊 Found ${agentShops.length} agent shops with pincode+area`);
    console.log(`📊 Found ${adminShops.length} admin shops with pincode+area`);

    // Combine all shops
    const allShops = [...agentShops, ...adminShops];

    // Create a map to track unique pincode+area combinations
    const pincodeMap = new Map<string, { pincode: string; area: string }>();

    // Extract unique pincode+area combinations
    for (const shop of allShops) {
      const pincode = String(shop.pincode || '').trim();
      let area = String(shop.area || '').trim();

      // If area doesn't exist, try to extract from address or use city
      if (!area) {
        // Try to extract area from address (common patterns)
        const address = String(shop.address || '').trim();
        const city = String(shop.city || '').trim();
        
        // Common area patterns in addresses
        if (address) {
          // Look for common area indicators
          const areaMatch = address.match(/(?:near|at|in|area|locality|colony|nagar|road|street|lane)\s+([A-Za-z\s]+?)(?:,|$)/i);
          if (areaMatch && areaMatch[1]) {
            area = areaMatch[1].trim();
          } else if (city) {
            // Fallback to city if no area found
            area = city;
          } else {
            // Last resort: use "Unknown Area"
            area = 'Unknown Area';
          }
        } else if (city) {
          area = city;
        } else {
          area = 'Unknown Area';
        }
      }

      if (pincode && area && pincode.length === 6 && /^\d{6}$/.test(pincode)) {
        const key = `${pincode}-${area.toLowerCase()}`;
        if (!pincodeMap.has(key)) {
          pincodeMap.set(key, { pincode, area });
        }
      }
    }

    console.log(`📦 Found ${pincodeMap.size} unique pincode+area combinations`);

    // Check which ones already exist in Pincode model
    const PincodeModel = await Pincode;
    const existingPincodes = await PincodeModel.find({}).select('pincode area').lean();
    const existingMap = new Map<string, boolean>();
    
    for (const existing of existingPincodes) {
      const key = `${existing.pincode}-${existing.area.toLowerCase()}`;
      existingMap.set(key, true);
    }

    console.log(`✅ Found ${existingMap.size} existing pincode+area combinations in Pincode model`);

    // Filter out existing ones
    const toInsert: Array<{ pincode: string; area: string }> = [];
    for (const [key, value] of pincodeMap.entries()) {
      if (!existingMap.has(key)) {
        toInsert.push(value);
      }
    }

    console.log(`➕ Will insert ${toInsert.length} new pincode+area combinations`);

    if (toInsert.length > 0) {
      // Insert in batches to avoid overwhelming the database
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        
        try {
          await PincodeModel.insertMany(batch, { ordered: false });
          inserted += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${toInsert.length}`);
        } catch (error: any) {
          // Handle duplicate key errors (in case of race conditions)
          if (error.code === 11000) {
            console.log(`⚠️ Some duplicates in batch ${Math.floor(i / batchSize) + 1}, skipping...`);
            // Try inserting one by one to find which ones are duplicates
            for (const item of batch) {
              try {
                await PincodeModel.create(item);
                inserted++;
              } catch (err: any) {
                if (err.code !== 11000) {
                  console.error(`❌ Error inserting ${item.pincode}-${item.area}:`, err.message);
                }
              }
            }
          } else {
            console.error(`❌ Error inserting batch:`, error.message);
          }
        }
      }

      console.log(`✅ Successfully migrated ${inserted} pincode+area combinations`);
    } else {
      console.log(`ℹ️ No new pincode+area combinations to migrate`);
    }

    // Final count
    const finalCount = await PincodeModel.countDocuments();
    console.log(`📊 Total pincode+area combinations in database: ${finalCount}`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migratePincodes();

