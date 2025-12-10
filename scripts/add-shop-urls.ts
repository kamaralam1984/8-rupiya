/**
 * Script to add unique URLs to existing shops
 * 
 * This script will:
 * 1. Connect to MongoDB
 * 2. Fetch all shops without shopUrl field
 * 3. Generate unique URLs for each shop
 * 4. Update shops with their URLs
 * 
 * Usage: npx tsx scripts/add-shop-urls.ts
 */

import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import AdminShop from '../lib/models/Shop';
import AgentShop from '../lib/models/AgentShop';
import { generateShopUrl } from '../lib/utils/slugGenerator';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface ShopToUpdate {
  _id: mongoose.Types.ObjectId;
  shopName: string;
  model: 'AdminShop' | 'AgentShop';
}

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
}

async function addShopUrls() {
  try {
    console.log('\n🔄 Starting shop URL generation...\n');

    await connectDB();

    // Fetch all shops without shopUrl or with 'temp' shopUrl
    const adminShopsWithoutUrl = await AdminShop.find({
      $or: [
        { shopUrl: { $exists: false } },
        { shopUrl: null },
        { shopUrl: '' },
        { shopUrl: 'temp' }
      ]
    }).select('_id shopName shopUrl').lean();

    const agentShopsWithoutUrl = await AgentShop.find({
      $or: [
        { shopUrl: { $exists: false } },
        { shopUrl: null },
        { shopUrl: '' },
        { shopUrl: 'temp' }
      ]
    }).select('_id shopName shopUrl').lean();

    console.log(`📊 Found ${adminShopsWithoutUrl.length} admin shops without URL`);
    console.log(`📊 Found ${agentShopsWithoutUrl.length} agent shops without URL`);

    if (adminShopsWithoutUrl.length === 0 && agentShopsWithoutUrl.length === 0) {
      console.log('\n✅ All shops already have URLs!');
      await mongoose.connection.close();
      return;
    }

    // Prepare shops to update
    const shopsToUpdate: ShopToUpdate[] = [
      ...adminShopsWithoutUrl.map(shop => ({
        _id: shop._id as mongoose.Types.ObjectId,
        shopName: shop.shopName,
        model: 'AdminShop' as const,
      })),
      ...agentShopsWithoutUrl.map(shop => ({
        _id: shop._id as mongoose.Types.ObjectId,
        shopName: shop.shopName,
        model: 'AgentShop' as const,
      })),
    ];

    console.log(`\n🔧 Updating ${shopsToUpdate.length} shops...\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ shopId: string; shopName: string; error: string }> = [];

    // Update shops one by one to avoid URL conflicts
    for (const shop of shopsToUpdate) {
      try {
        const shopUrl = generateShopUrl(shop.shopName, shop._id.toString());
        
        if (shop.model === 'AdminShop') {
          await AdminShop.findByIdAndUpdate(shop._id, { shopUrl });
        } else {
          await AgentShop.findByIdAndUpdate(shop._id, { shopUrl });
        }

        successCount++;
        console.log(`✅ [${shop.model}] ${shop.shopName} → ${shopUrl}`);
      } catch (error: any) {
        errorCount++;
        const errorMessage = error.message || 'Unknown error';
        errors.push({
          shopId: shop._id.toString(),
          shopName: shop.shopName,
          error: errorMessage,
        });
        console.error(`❌ [${shop.model}] ${shop.shopName} - Error: ${errorMessage}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount} shops`);
    console.log(`❌ Failed to update: ${errorCount} shops`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.shopName} (${err.shopId}): ${err.error}`);
      });
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ Script completed. MongoDB connection closed.');
  } catch (error) {
    console.error('\n❌ Script Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
addShopUrls();

