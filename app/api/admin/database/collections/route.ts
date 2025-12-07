import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/database/collections - List all collections
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const connection = mongoose.connection;
    
    if (!connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    const collections = await connection.db.listCollections().toArray();

    const collectionInfo = await Promise.all(
      collections.map(async (collection) => {
        const count = await connection.db!.collection(collection.name).countDocuments();
        return {
          name: collection.name,
          count,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        collections: collectionInfo.sort((a, b) => b.count - a.count),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get collections error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});


