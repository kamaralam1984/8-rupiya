import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/agent/server-status
 * Check MongoDB database connection status
 */
export async function GET(request: NextRequest) {
  try {
    // Try to connect to database
    try {
      await connectDB();
    } catch (error) {
      // Connection failed
      return NextResponse.json(
        {
          success: true,
          connected: false,
          status: 'disconnected',
          message: 'Server Not Connect',
        },
        { status: 200 }
      );
    }

    // Check MongoDB connection status
    const connectionState = mongoose.connection.readyState;
    
    // Connection states:
    // 0 = disconnected
    // 1 = connected
    // 2 = connecting
    // 3 = disconnecting
    
    const isConnected = connectionState === 1;
    
    // Try a simple ping to verify connection
    let pingSuccess = false;
    if (isConnected && mongoose.connection.db) {
      try {
        await mongoose.connection.db.admin().ping();
        pingSuccess = true;
      } catch (error) {
        pingSuccess = false;
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        connected: isConnected && pingSuccess,
        status: isConnected && pingSuccess ? 'connected' : 'disconnected',
        readyState: connectionState,
        message: isConnected && pingSuccess ? 'Server Start' : 'Server Not Connect',
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: true,
        connected: false,
        status: 'disconnected',
        message: 'Server Not Connect',
        error: error.message,
      },
      { status: 200 } // Return 200 so frontend can handle it
    );
  }
}

