import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import connectDB from '../lib/mongodb';
import AgentShop from '../lib/models/AgentShop';
import Shop from '../lib/models/Shop';
import User from '../models/User';
import Category from '../models/Category';
import Location from '../models/Location';
import Pincode from '../lib/models/Pincode';
import SEO from '../lib/models/SEO';

/**
 * Script to find and remove duplicate entries from database
 * Checks all collections for duplicates based on unique fields
 */

interface DuplicateReport {
  collection: string;
  field: string;
  duplicates: Array<{
    value: any;
    count: number;
    ids: string[];
  }>;
  deleted: number;
}

async function findAndRemoveDuplicates() {
  try {
    console.log('🔍 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database\n');

    const reports: DuplicateReport[] = [];

    // 1. Check AgentShop duplicates (shopUrl)
    console.log('📊 Checking AgentShop duplicates (shopUrl)...');
    const agentShopDuplicates = await AgentShop.aggregate([
      {
        $group: {
          _id: '$shopUrl',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (agentShopDuplicates.length > 0) {
      console.log(`⚠️  Found ${agentShopDuplicates.length} duplicate shopUrl(s) in AgentShop`);
      let deletedCount = 0;
      for (const dup of agentShopDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await AgentShop.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - shopUrl: "${dup._id}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'agentshops',
        field: 'shopUrl',
        duplicates: agentShopDuplicates.map(d => ({
          value: d._id,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in AgentShop\n');
    }

    // 2. Check Shop (AdminShop) duplicates (shopUrl)
    console.log('📊 Checking Shop (AdminShop) duplicates (shopUrl)...');
    const shopDuplicates = await Shop.aggregate([
      {
        $group: {
          _id: '$shopUrl',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (shopDuplicates.length > 0) {
      console.log(`⚠️  Found ${shopDuplicates.length} duplicate shopUrl(s) in Shop`);
      let deletedCount = 0;
      for (const dup of shopDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await Shop.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - shopUrl: "${dup._id}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'shopsfromimage',
        field: 'shopUrl',
        duplicates: shopDuplicates.map(d => ({
          value: d._id,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in Shop\n');
    }

    // 3. Check User duplicates (email)
    console.log('📊 Checking User duplicates (email)...');
    const userEmailDuplicates = await User.aggregate([
      {
        $match: { 
          email: { 
            $exists: true, 
            $ne: null,
            $nin: [null, '']
          } 
        }
      },
      {
        $group: {
          _id: { $toLower: '$email' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (userEmailDuplicates.length > 0) {
      console.log(`⚠️  Found ${userEmailDuplicates.length} duplicate email(s) in User`);
      let deletedCount = 0;
      for (const dup of userEmailDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await User.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - email: "${dup._id}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'users',
        field: 'email',
        duplicates: userEmailDuplicates.map(d => ({
          value: d._id,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in User (email)\n');
    }

    // 4. Check User duplicates (phone)
    console.log('📊 Checking User duplicates (phone)...');
    const userPhoneDuplicates = await User.aggregate([
      {
        $match: { 
          phone: { 
            $exists: true, 
            $ne: null,
            $nin: [null, '']
          } 
        }
      },
      {
        $group: {
          _id: '$phone',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (userPhoneDuplicates.length > 0) {
      console.log(`⚠️  Found ${userPhoneDuplicates.length} duplicate phone(s) in User`);
      let deletedCount = 0;
      for (const dup of userPhoneDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await User.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - phone: "${dup._id}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'users',
        field: 'phone',
        duplicates: userPhoneDuplicates.map(d => ({
          value: d._id,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in User (phone)\n');
    }

    // 5. Check Category duplicates (slug)
    console.log('📊 Checking Category duplicates (slug)...');
    const categoryDuplicates = await Category.aggregate([
      {
        $group: {
          _id: { $toLower: '$slug' },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (categoryDuplicates.length > 0) {
      console.log(`⚠️  Found ${categoryDuplicates.length} duplicate slug(s) in Category`);
      let deletedCount = 0;
      for (const dup of categoryDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await Category.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - slug: "${dup._id}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'categories',
        field: 'slug',
        duplicates: categoryDuplicates.map(d => ({
          value: d._id,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in Category\n');
    }

    // 6. Check Location duplicates (id)
    console.log('📊 Checking Location duplicates (id)...');
    const locationDuplicates = await Location.aggregate([
      {
        $group: {
          _id: '$id',
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (locationDuplicates.length > 0) {
      console.log(`⚠️  Found ${locationDuplicates.length} duplicate id(s) in Location`);
      let deletedCount = 0;
      for (const dup of locationDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await Location.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - id: "${dup._id}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'locations',
        field: 'id',
        duplicates: locationDuplicates.map(d => ({
          value: d._id,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in Location\n');
    }

    // 7. Check Pincode duplicates (pincode + area combination)
    console.log('📊 Checking Pincode duplicates (pincode + area)...');
    const pincodeDuplicates = await Pincode.aggregate([
      {
        $group: {
          _id: {
            pincode: '$pincode',
            area: '$area'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (pincodeDuplicates.length > 0) {
      console.log(`⚠️  Found ${pincodeDuplicates.length} duplicate pincode+area combination(s) in Pincode`);
      let deletedCount = 0;
      for (const dup of pincodeDuplicates) {
        // Keep the first one (oldest), delete others
        const idsToDelete = dup.ids.slice(1);
        const result = await Pincode.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
        console.log(`   - pincode: "${dup._id.pincode}", area: "${dup._id.area}" - Deleted ${result.deletedCount} duplicate(s), kept 1`);
      }
      reports.push({
        collection: 'pincodes',
        field: 'pincode+area',
        duplicates: pincodeDuplicates.map(d => ({
          value: `${d._id.pincode}-${d._id.area}`,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in Pincode\n');
    }

    // 8. Check SEO duplicates (shopName + area + category + pincode + emailId)
    console.log('📊 Checking SEO duplicates (shopName + area + category + pincode + emailId)...');
    const seoDuplicates = await SEO.aggregate([
      {
        $group: {
          _id: {
            shopName: { $toLower: { $trim: { input: '$shopName' } } },
            area: { $toLower: { $trim: { input: '$area' } } },
            category: { $toLower: { $trim: { input: '$category' } } },
            pincode: { $ifNull: ['$pincode', ''] },
            emailId: { $toLower: { $trim: { input: '$emailId' } } }
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' },
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (seoDuplicates.length > 0) {
      console.log(`⚠️  Found ${seoDuplicates.length} duplicate SEO entry/entries`);
      let deletedCount = 0;
      for (const dup of seoDuplicates) {
        // Keep the one with lowest ranking (best SEO), delete others
        const seoDocs = await SEO.find({
          _id: { $in: dup.ids }
        }).sort({ ranking: 1, createdAt: 1 });
        
        if (seoDocs.length > 1) {
          const idsToDelete = seoDocs.slice(1).map(doc => doc._id);
          const result = await SEO.deleteMany({ _id: { $in: idsToDelete } });
          deletedCount += result.deletedCount || 0;
          console.log(`   - shopName: "${dup._id.shopName}", area: "${dup._id.area}" - Deleted ${result.deletedCount} duplicate(s), kept best ranking`);
        }
      }
      reports.push({
        collection: 'seos',
        field: 'shopName+area+category+pincode+emailId',
        duplicates: seoDuplicates.map(d => ({
          value: `${d._id.shopName}-${d._id.area}-${d._id.category}`,
          count: d.count,
          ids: d.ids.map((id: any) => id.toString())
        })),
        deleted: deletedCount
      });
    } else {
      console.log('✅ No duplicates found in SEO\n');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 DUPLICATE REMOVAL SUMMARY');
    console.log('='.repeat(60));
    
    const totalDeleted = reports.reduce((sum, report) => sum + report.deleted, 0);
    
    if (reports.length === 0) {
      console.log('✅ No duplicates found in any collection!');
    } else {
      reports.forEach(report => {
        if (report.deleted > 0) {
          console.log(`\n📦 ${report.collection} (${report.field}):`);
          console.log(`   - Found ${report.duplicates.length} duplicate group(s)`);
          console.log(`   - Deleted ${report.deleted} duplicate entry/entries`);
        }
      });
      console.log(`\n✅ Total duplicates deleted: ${totalDeleted}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ Duplicate removal completed!');
    console.log('='.repeat(60));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error removing duplicates:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
findAndRemoveDuplicates();

