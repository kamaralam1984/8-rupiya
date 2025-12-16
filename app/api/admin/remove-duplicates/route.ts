import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentShop from '@/lib/models/AgentShop';
import Shop from '@/lib/models/Shop';
import User from '@/models/User';
import Category from '@/models/Category';
import Location from '@/models/Location';
import Pincode from '@/lib/models/Pincode';
import SEO from '@/lib/models/SEO';
import { requireAdmin } from '@/lib/auth';

/**
 * POST /api/admin/remove-duplicates
 * Find and remove duplicate entries from database
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const reports: any[] = [];
    let totalDeleted = 0;

    // 1. Check AgentShop duplicates (shopUrl)
    console.log('📊 Checking AgentShop duplicates (shopUrl)...');
    const agentShopDuplicates = await AgentShop.aggregate([
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

    if (agentShopDuplicates.length > 0) {
      let deletedCount = 0;
      for (const dup of agentShopDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await AgentShop.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'agentshops',
        field: 'shopUrl',
        duplicatesFound: agentShopDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
    }

    // 2. Check Shop (AdminShop) duplicates (shopUrl)
    console.log('📊 Checking Shop duplicates (shopUrl)...');
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
      let deletedCount = 0;
      for (const dup of shopDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await Shop.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'shopsfromimage',
        field: 'shopUrl',
        duplicatesFound: shopDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
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
      let deletedCount = 0;
      for (const dup of userEmailDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await User.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'users',
        field: 'email',
        duplicatesFound: userEmailDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
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
      let deletedCount = 0;
      for (const dup of userPhoneDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await User.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'users',
        field: 'phone',
        duplicatesFound: userPhoneDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
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
      let deletedCount = 0;
      for (const dup of categoryDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await Category.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'categories',
        field: 'slug',
        duplicatesFound: categoryDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
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
      let deletedCount = 0;
      for (const dup of locationDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await Location.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'locations',
        field: 'id',
        duplicatesFound: locationDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
    }

    // 7. Check Pincode duplicates (pincode + area)
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
      let deletedCount = 0;
      for (const dup of pincodeDuplicates) {
        const idsToDelete = dup.ids.slice(1);
        const result = await Pincode.deleteMany({ _id: { $in: idsToDelete } });
        deletedCount += result.deletedCount || 0;
      }
      reports.push({
        collection: 'pincodes',
        field: 'pincode+area',
        duplicatesFound: pincodeDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
    }

    // 8. Check SEO duplicates (shopName + area + category + pincode + emailId)
    console.log('📊 Checking SEO duplicates...');
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
        }
      }
      reports.push({
        collection: 'seos',
        field: 'shopName+area+category+pincode+emailId',
        duplicatesFound: seoDuplicates.length,
        deleted: deletedCount
      });
      totalDeleted += deletedCount;
    }

    return NextResponse.json({
      success: true,
      message: `Duplicate removal completed. Total ${totalDeleted} duplicate(s) deleted.`,
      totalDeleted,
      reports,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error removing duplicates:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to remove duplicates',
        details: error.message 
      },
      { status: 500 }
    );
  }
});

