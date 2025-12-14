import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/database/[collection] - Get documents from a collection
export const GET = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> | { collection: string } }
) => {
  try {
    // Handle both Promise and direct params (Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const collectionName = resolvedParams.collection;
    
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';

    const connection = mongoose.connection;
    
    if (!connection.db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    
    // List all collections to verify
    const allCollections = await connection.db.listCollections().toArray();
    const collectionNames = allCollections.map(c => c.name);
    // Removed verbose debug logs
    
    // Check if collection exists (case-insensitive)
    const collectionExists = collectionNames.some(name => 
      name.toLowerCase() === collectionName.toLowerCase()
    );
    
    if (!collectionExists) {
      return NextResponse.json(
        {
          success: false,
          error: `Collection "${collectionName}" not found. Available collections: ${collectionNames.join(', ')}`,
          documents: [],
          stats: { total: 0, page, limit, pages: 0 },
        },
        { status: 404 }
      );
    }
    
    // Get the actual collection name (case-sensitive)
    const actualCollectionName = collectionNames.find(name => 
      name.toLowerCase() === collectionName.toLowerCase()
    ) || collectionName;
    
    const collection = connection.db.collection(actualCollectionName);
    console.log(`Using collection: ${actualCollectionName}`);

    // Build search query
    let query: any = {};
    if (search && search.trim() !== '') {
      // Try regex on common string fields
      // Use $text search if available, otherwise use $or with common fields
      const regex = { $regex: search.trim(), $options: 'i' };
      const searchFields = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { shopName: regex },
        { ownerName: regex },
        { address: regex },
        { agentCode: regex },
        { category: regex },
        { mobile: regex },
        { pincode: regex },
        { receiptNo: regex },
        { city: regex },
        { state: regex },
        { area: regex },
        { displayName: regex },
        { district: regex },
        { fullAddress: regex },
        { id: regex },
      ];
      
      // Only add $or if we have search fields
      if (searchFields.length > 0) {
        query.$or = searchFields;
      }
    }

    // Get total count with error handling
    let total = 0;
    try {
      total = await collection.countDocuments(query);
      console.log(`Total documents in ${collectionName}: ${total}`);
    } catch (countError: any) {
      console.error(`Error counting documents in ${collectionName}:`, countError);
      // If count fails, try with empty query
      try {
        total = await collection.countDocuments({});
        console.log(`Total documents (fallback): ${total}`);
        query = {}; // Reset query if count with search failed
      } catch (fallbackError: any) {
        console.error(`Fallback count also failed:`, fallbackError);
        total = 0;
      }
    }

    // Get documents - sort by _id descending (newest first)
    let documents: any[] = [];
    try {
      documents = await collection
        .find(query)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      // Removed verbose log
      
      // For shops collection, populate agent information if createdByAgent exists
      if ((collectionName === 'shops' || collectionName === 'shopsfromimage') && documents.length > 0) {
        try {
          const Agent = (await import('@/lib/models/Agent')).default;
          const agentIds: mongoose.Types.ObjectId[] = [];
          
          documents.forEach((doc: any) => {
            if (doc.createdByAgent) {
              let agentId: mongoose.Types.ObjectId | null = null;
              if (doc.createdByAgent instanceof mongoose.Types.ObjectId) {
                agentId = doc.createdByAgent;
              } else if (typeof doc.createdByAgent === 'string') {
                try {
                  agentId = new mongoose.Types.ObjectId(doc.createdByAgent);
                } catch (e) {
                  // Invalid ObjectId string, skip
                }
              } else if (doc.createdByAgent && typeof doc.createdByAgent === 'object' && doc.createdByAgent.toString) {
                try {
                  agentId = new mongoose.Types.ObjectId(doc.createdByAgent.toString());
                } catch (e) {
                  // Invalid ObjectId, skip
                }
              }
              if (agentId && !agentIds.some(id => id.toString() === agentId!.toString())) {
                agentIds.push(agentId);
              }
            }
          });
          
          if (agentIds.length > 0) {
            const agents = await Agent.find({
              _id: { $in: agentIds }
            }).select('name agentCode').lean();
            
            const agentMap = new Map();
            agents.forEach((agent: any) => {
              agentMap.set(agent._id.toString(), agent);
            });
            
            // Add agent info to documents
            documents = documents.map((doc: any) => {
              if (doc.createdByAgent) {
                let agentIdStr = '';
                if (doc.createdByAgent instanceof mongoose.Types.ObjectId) {
                  agentIdStr = doc.createdByAgent.toString();
                } else if (typeof doc.createdByAgent === 'string') {
                  agentIdStr = doc.createdByAgent;
                } else if (doc.createdByAgent && typeof doc.createdByAgent === 'object' && doc.createdByAgent.toString) {
                  agentIdStr = doc.createdByAgent.toString();
                }
                
                if (agentIdStr) {
                  const agent = agentMap.get(agentIdStr);
                  if (agent) {
                    doc.agentName = agent.name || doc.agentName;
                    doc.agentCode = agent.agentCode || doc.agentCode;
                  }
                }
              }
              return doc;
            });
          }
        } catch (agentError: any) {
          console.error('Error populating agent info:', agentError);
          // Continue without agent info if population fails
        }
      }
    } catch (findError: any) {
      console.error(`Error fetching documents from ${collectionName}:`, findError);
      // If find fails, try with empty query and no sort
      try {
        documents = await collection
          .find({})
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
        // Removed verbose log
      } catch (fallbackError: any) {
        console.error(`Fallback find also failed:`, fallbackError);
        documents = [];
      }
    }

    // Convert ObjectId and Date objects to strings for JSON serialization
    // Use JSON.stringify with a replacer function for safety
    const serializedDocuments = documents.map((doc) => {
      try {
        return JSON.parse(JSON.stringify(doc, (key, value) => {
          // Skip functions
          if (typeof value === 'function') {
            return undefined;
          }
          // Convert ObjectId
          if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
            return value.toString();
          }
          // Convert Date
          if (value instanceof Date) {
            return value.toISOString();
          }
          return value;
        }));
      } catch (err: any) {
        console.error(`Error serializing document:`, err);
        // Fallback: manual serialization
        const fallback: any = {};
        for (const key in doc) {
          try {
            const val = (doc as any)[key];
            if (val && typeof val === 'object' && val.constructor && val.constructor.name === 'ObjectId') {
              fallback[key] = val.toString();
            } else if (val instanceof Date) {
              fallback[key] = val.toISOString();
            } else {
              fallback[key] = val;
            }
          } catch (e) {
            fallback[key] = '[Unable to serialize]';
          }
        }
        return fallback;
      }
    });

    // Get collection stats
    const stats = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    return NextResponse.json(
      {
        success: true,
        collection: collectionName,
        documents: serializedDocuments,
        stats,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get collection data error:', error);
    console.error('Error stack:', error.stack);
    
    // Safely get collection name even if params access fails
    let collectionName = 'unknown';
    try {
      const resolvedParams = params instanceof Promise ? await params : params;
      collectionName = resolvedParams?.collection || 'unknown';
    } catch (e) {
      console.error('Error accessing params:', e);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: error.message || 'An unexpected error occurred',
        collection: collectionName,
      },
      { status: 500 }
    );
  }
});

