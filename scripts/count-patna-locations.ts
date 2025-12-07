/**
 * Script to count Patna locations in database
 * Run: npx ts-node --project tsconfig.scripts.json scripts/count-patna-locations.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import Location from '../models/Location';

async function countPatnaLocations() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Count all Patna locations (case-insensitive)
    const patnaLocations = await Location.find({
      city: { $regex: /patna/i }
    }).sort({ displayName: 1 }).lean();

    const totalCount = patnaLocations.length;
    const activeCount = patnaLocations.filter(loc => loc.isActive).length;
    const inactiveCount = totalCount - activeCount;

    console.log('═'.repeat(80));
    console.log('📍 PATNA LOCATIONS SUMMARY');
    console.log('═'.repeat(80));
    console.log(`\n📊 Total Patna Locations: ${totalCount}`);
    console.log(`   ✅ Active: ${activeCount}`);
    console.log(`   ❌ Inactive: ${inactiveCount}\n`);

    if (totalCount > 0) {
      console.log('📋 Location Details:\n');
      patnaLocations.forEach((loc, index) => {
        console.log(`${index + 1}. ${loc.displayName || loc.area || 'N/A'}`);
        console.log(`   ID: ${loc.id}`);
        console.log(`   City: ${loc.city}`);
        console.log(`   Area: ${loc.area || 'N/A'}`);
        console.log(`   District: ${loc.district || 'N/A'}`);
        console.log(`   Pincode: ${loc.pincode || 'N/A'}`);
        console.log(`   Status: ${loc.isActive ? '✅ Active' : '❌ Inactive'}`);
        if (loc.latitude && loc.longitude) {
          console.log(`   Coordinates: ${loc.latitude}, ${loc.longitude}`);
        }
        console.log('');
      });
    } else {
      console.log('⚠️  No Patna locations found in database.\n');
    }

    // Also check for variations
    const variations = await Location.find({
      $or: [
        { city: { $regex: /patna/i } },
        { displayName: { $regex: /patna/i } },
        { area: { $regex: /patna/i } },
        { district: { $regex: /patna/i } }
      ]
    }).lean();

    if (variations.length > totalCount) {
      console.log('💡 Note: Found additional locations with "Patna" in other fields:');
      variations.forEach(loc => {
        if (!loc.city?.match(/patna/i)) {
          console.log(`   - ${loc.displayName || loc.area} (${loc.city})`);
        }
      });
      console.log('');
    }

    console.log('═'.repeat(80));
    console.log(`\n🎉 Done! Found ${totalCount} Patna location(s).\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

countPatnaLocations();







