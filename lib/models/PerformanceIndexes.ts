/**
 * Additional database indexes for performance optimization
 * Run this script to ensure all indexes are created
 */

import connectDB from '@/lib/mongodb';
import AgentShop from './AgentShop';
import User from '@/models/User';
import Payment from './Payment';
import Analytics from './Analytics';

export async function createPerformanceIndexes() {
  try {
    await connectDB();
    console.log('📊 Creating performance indexes...');

    // AgentShop indexes
    await AgentShop.collection.createIndex(
      { pincode: 1, area: 1, paymentStatus: 1 },
      { name: 'pincode_area_payment_idx' }
    );
    await AgentShop.collection.createIndex(
      { category: 1, pincode: 1, paymentStatus: 1 },
      { name: 'category_pincode_payment_idx' }
    );
    await AgentShop.collection.createIndex(
      { planType: 1, paymentStatus: 1, isVisible: 1 },
      { name: 'plan_payment_visibility_idx' }
    );
    await AgentShop.collection.createIndex(
      { createdAt: -1, paymentStatus: 1 },
      { name: 'created_payment_idx' }
    );

    // User indexes
    await User.collection.createIndex(
      { email: 1 },
      { unique: true, name: 'email_unique_idx' }
    );
    await User.collection.createIndex(
      { role: 1, createdAt: -1 },
      { name: 'role_created_idx' }
    );

    // Payment indexes
    await Payment.collection.createIndex(
      { razorpayOrderId: 1 },
      { unique: true, name: 'razorpay_order_unique_idx' }
    );
    await Payment.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'status_created_idx' }
    );
    await Payment.collection.createIndex(
      { agentId: 1, createdAt: -1 },
      { name: 'agent_created_idx' }
    );

    // Analytics indexes
    await Analytics.collection.createIndex(
      { visitedAt: -1, page: 1 },
      { name: 'visited_page_idx' }
    );
    await Analytics.collection.createIndex(
      { country: 1, state: 1, district: 1 },
      { name: 'location_idx' }
    );
    await Analytics.collection.createIndex(
      { shopClicks: 1 },
      { name: 'shop_clicks_idx' }
    );

    console.log('✅ Performance indexes created successfully');
  } catch (error: any) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createPerformanceIndexes()
    .then(() => {
      console.log('✅ Index creation complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Index creation failed:', error);
      process.exit(1);
    });
}




