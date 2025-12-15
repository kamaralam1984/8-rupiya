import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

/**
 * POST /api/admin/database/clear
 * Clear database collections
 * 
 * Body:
 * - collectionName: string (optional) - Clear specific collection
 * - clearAll: boolean (optional) - Clear all collections
 * - collections: string[] (optional) - Clear multiple specific collections
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { collectionName, clearAll, collections } = body;

    const connection = mongoose.connection;
    
    if (!connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get all collections
    const allCollections = await connection.db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);

    // Protected collections that should not be cleared
    const protectedCollections = [
      'users', // Admin users
      'admins', // Admin accounts
      'operators', // Operator accounts
    ];

    const results: any = {
      cleared: [],
      protected: [],
      notFound: [],
      errors: [],
    };

    if (clearAll) {
      // Clear all collections except protected ones
      for (const collection of allCollections) {
        const name = collection.name;
        
        if (protectedCollections.includes(name.toLowerCase())) {
          results.protected.push({ name, reason: 'Protected collection' });
          continue;
        }

        try {
          const count = await connection.db!.collection(name).countDocuments();
          await connection.db!.collection(name).deleteMany({});
          results.cleared.push({ name, count });
        } catch (error: any) {
          results.errors.push({ name, error: error.message });
        }
      }
    } else if (collections && Array.isArray(collections)) {
      // Clear multiple specific collections
      for (const name of collections) {
        if (protectedCollections.includes(name.toLowerCase())) {
          results.protected.push({ name, reason: 'Protected collection' });
          continue;
        }

        if (!collectionNames.includes(name)) {
          results.notFound.push({ name });
          continue;
        }

        try {
          const count = await connection.db!.collection(name).countDocuments();
          await connection.db!.collection(name).deleteMany({});
          results.cleared.push({ name, count });
        } catch (error: any) {
          results.errors.push({ name, error: error.message });
        }
      }
    } else if (collectionName) {
      // Clear single collection
      const name = collectionName;

      if (protectedCollections.includes(name.toLowerCase())) {
        return NextResponse.json(
          { 
            error: 'Cannot clear protected collection',
            collection: name,
            reason: 'This collection contains critical system data'
          },
          { status: 403 }
        );
      }

      if (!collectionNames.includes(name)) {
        return NextResponse.json(
          { error: 'Collection not found', collection: name },
          { status: 404 }
        );
      }

      try {
        const count = await connection.db!.collection(name).countDocuments();
        await connection.db!.collection(name).deleteMany({});
        
        return NextResponse.json(
          {
            success: true,
            message: `Collection "${name}" cleared successfully`,
            collection: name,
            deletedCount: count,
          },
          { status: 200 }
        );
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Failed to clear collection', details: error.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Provide collectionName, collections array, or clearAll flag' },
        { status: 400 }
      );
    }

    // Calculate totals
    const totalCleared = results.cleared.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
    const totalCollections = results.cleared.length;

    return NextResponse.json(
      {
        success: true,
        message: `Cleared ${totalCollections} collection(s) with ${totalCleared} total documents`,
        results,
        summary: {
          totalCleared,
          collectionsCleared: totalCollections,
          protected: results.protected.length,
          notFound: results.notFound.length,
          errors: results.errors.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Clear database error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

