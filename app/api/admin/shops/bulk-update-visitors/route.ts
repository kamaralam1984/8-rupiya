import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';

/**
 * POST /api/admin/shops/bulk-update-visitors
 * Bulk update all shops' visitor counts to random values >= 200
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get all shops from all collections
    const [adminShops, oldShops, agentShops] = await Promise.all([
      AdminShop.find({}).lean(),
      Shop.find({}).lean(),
      AgentShop.find({}).lean(),
    ]);

    const results = {
      adminShops: { updated: 0, total: adminShops.length },
      oldShops: { updated: 0, total: oldShops.length },
      agentShops: { updated: 0, total: agentShops.length },
    };

    // Update AdminShop collection
    for (const shop of adminShops) {
      const randomVisitorCount = Math.floor(Math.random() * 800) + 200; // Random between 200-999
      try {
        await AdminShop.updateOne(
          { _id: shop._id },
          { $set: { visitorCount: randomVisitorCount } }
        );
        results.adminShops.updated++;
      } catch (error) {
        console.error(`Error updating AdminShop ${shop._id}:`, error);
      }
    }

    // Update Old Shop collection (if visitorCount field exists)
    for (const shop of oldShops) {
      const randomVisitorCount = Math.floor(Math.random() * 800) + 200; // Random between 200-999
      try {
        // Check if shop has visitorCount field in schema
        const shopModel = await Shop.findById(shop._id);
        if (shopModel && 'visitorCount' in shopModel.schema.paths) {
          await Shop.updateOne(
            { _id: shop._id },
            { $set: { visitorCount: randomVisitorCount } }
          );
          results.oldShops.updated++;
        }
      } catch (error) {
        console.error(`Error updating Old Shop ${shop._id}:`, error);
      }
    }

    // Update AgentShop collection
    for (const shop of agentShops) {
      const randomVisitorCount = Math.floor(Math.random() * 800) + 200; // Random between 200-999
      try {
        await AgentShop.updateOne(
          { _id: shop._id },
          { $set: { visitorCount: randomVisitorCount } }
        );
        results.agentShops.updated++;
      } catch (error) {
        console.error(`Error updating AgentShop ${shop._id}:`, error);
      }
    }

    const totalUpdated = results.adminShops.updated + results.oldShops.updated + results.agentShops.updated;
    const totalShops = results.adminShops.total + results.oldShops.total + results.agentShops.total;

    return NextResponse.json({
      success: true,
      message: `Updated visitor counts for ${totalUpdated} out of ${totalShops} shops`,
      results,
      totalUpdated,
      totalShops,
    });
  } catch (error: any) {
    console.error('Error bulk updating visitor counts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update visitor counts', details: error.message },
      { status: 500 }
    );
  }
});






