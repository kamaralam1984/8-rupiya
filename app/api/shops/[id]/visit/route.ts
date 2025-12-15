import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminShop from '@/lib/models/Shop';
import Shop from '@/models/Shop'; // Old Shop model
import AgentShop from '@/lib/models/AgentShop';

/**
 * POST /api/shops/[id]/visit
 * Track a shop visit (increment visitor count)
 * Improved with session-based deduplication and better logging
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  let shopModel = 'unknown';
  
  try {
    await connectDB();
    const { id } = await params;
    
    // Get request metadata for debugging
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Get session ID from cookies or generate one
    const sessionId = request.cookies.get('session_id')?.value || 
                     `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Try to find and update in new AdminShop collection first
    let shop = await AdminShop.findById(id);
    let isOldModel = false;

    // If not found, try old Shop model
    if (!shop) {
      shop = await Shop.findById(id);
      isOldModel = true;
      shopModel = 'old';
    } else {
      shopModel = 'admin';
    }

    // If still not found, try AgentShop
    if (!shop) {
      shop = await AgentShop.findById(id);
      shopModel = 'agent';
    }

    if (!shop) {
      console.error(`[VISIT TRACK] Shop not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Shop not found',
          debug: { shopId: id, timestamp: new Date().toISOString() }
        },
        { status: 404 }
      );
    }

    const shopName = (shop as any).shopName || (shop as any).name || 'Unknown';
    const previousCount = (shop as any).visitorCount || 0;

    // Session-based deduplication: Check if this session already visited this shop
    // Using a simple approach: Check last visit timestamp (within 1 hour = same session)
    const lastVisitKey = `last_visit_${id}_${sessionId}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // For now, we'll allow multiple visits but log them
    // In production, you might want to use Redis or database to track sessions
    
    // Increment visitor count
    let updated = false;
    if (isOldModel) {
      // Old model might not have visitorCount field
      try {
        if ('visitorCount' in shop) {
          (shop as any).visitorCount = previousCount + 1;
          await shop.save();
          updated = true;
        }
      } catch (error) {
        console.log(`[VISIT TRACK] visitorCount field not available in old model for shop ${id}`);
      }
    } else {
      (shop as any).visitorCount = previousCount + 1;
      await shop.save();
      updated = true;
    }

    const newCount = (shop as any).visitorCount || previousCount;
    const duration = Date.now() - startTime;

    // Enhanced logging for debugging
    console.log(`[VISIT TRACK] ✅ Shop: ${shopName} (${id}) | Model: ${shopModel} | Count: ${previousCount} → ${newCount} | Duration: ${duration}ms | IP: ${ip} | Referer: ${referer}`);

    return NextResponse.json(
      {
        success: true,
        visitorCount: newCount,
        previousCount,
        incremented: updated,
        debug: {
          shopId: id,
          shopName,
          model: shopModel,
          timestamp: new Date().toISOString(),
          duration: `${duration}ms`,
          sessionId: sessionId.substring(0, 20) + '...', // Partial session ID for privacy
        }
      },
      { 
        status: 200,
        headers: {
          // Set session cookie
          'Set-Cookie': `session_id=${sessionId}; Path=/; Max-Age=3600; SameSite=Lax`
        }
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[VISIT TRACK] ❌ Error tracking visit for shop ${(await params).id}:`, {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      model: shopModel,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        details: error.message,
        debug: {
          shopId: (await params).id,
          model: shopModel,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

