/**
 * Script to list all locations in database
 * Run: npx ts-node --project tsconfig.scripts.json scripts/list-all-locations.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import Location from '../models/Location';

async function listAllLocations() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Get all locations
    const allLocations = await Location.find({}).sort({ city: 1, displayName: 1 }).lean();

    const totalCount = allLocations.length;
    const activeCount = allLocations.filter(loc => loc.isActive).length;
    const inactiveCount = totalCount - activeCount;

    console.log('═'.repeat(80));
    console.log('📍 ALL LOCATIONS SUMMARY');
    console.log('═'.repeat(80));
    console.log(`\n📊 Total Locations: ${totalCount}`);
    console.log(`   ✅ Active: ${activeCount}`);
    console.log(`   ❌ Inactive: ${inactiveCount}\n`);

    if (totalCount > 0) {
      // Group by city
      const locationsByCity: Record<string, any[]> = {};
      allLocations.forEach(loc => {
        const city = loc.city || 'Unknown';
        if (!locationsByCity[city]) {
          locationsByCity[city] = [];
        }
        locationsByCity[city].push(loc);
      });

      console.log('📋 Locations by City:\n');
      Object.keys(locationsByCity).sort().forEach(city => {
        const cityLocations = locationsByCity[city];
        const active = cityLocations.filter(l => l.isActive).length;
        console.log(`🏙️  ${city}: ${cityLocations.length} locations (${active} active, ${cityLocations.length - active} inactive)`);
        
        // Show first 5 locations of each city
        cityLocations.slice(0, 5).forEach((loc, idx) => {
          console.log(`   ${idx + 1}. ${loc.displayName || loc.area || 'N/A'} ${loc.isActive ? '✅' : '❌'}`);
        });
        if (cityLocations.length > 5) {
          console.log(`   ... and ${cityLocations.length - 5} more`);
        }
        console.log('');
      });

      // Check for Patna variations
      const patnaVariations = allLocations.filter(loc => 
        (loc.city && loc.city.toLowerCase().includes('patna')) ||
        (loc.displayName && loc.displayName.toLowerCase().includes('patna')) ||
        (loc.area && loc.area.toLowerCase().includes('patna')) ||
        (loc.district && loc.district.toLowerCase().includes('patna'))
      );

      if (patnaVariations.length > 0) {
        console.log('═'.repeat(80));
        console.log('🔍 PATNA RELATED LOCATIONS FOUND:');
        console.log('═'.repeat(80));
        patnaVariations.forEach((loc, idx) => {
          console.log(`\n${idx + 1}. ${loc.displayName || loc.area || 'N/A'}`);
          console.log(`   ID: ${loc.id}`);
          console.log(`   City: ${loc.city}`);
          console.log(`   Area: ${loc.area || 'N/A'}`);
          console.log(`   District: ${loc.district || 'N/A'}`);
          console.log(`   Status: ${loc.isActive ? '✅ Active' : '❌ Inactive'}`);
        });
        console.log('');
      }
    } else {
      console.log('⚠️  No locations found in database.\n');
      console.log('💡 To add locations, use the admin panel: /admin/locations\n');
    }

    console.log('═'.repeat(80));
    console.log(`\n🎉 Done! Found ${totalCount} location(s) in total.\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

listAllLocations();







