import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global to cache the connection across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  // Check if connection is ready and connected
  if (cached.conn) {
    // Check connection state
    if (mongoose.connection.readyState === 1) {
    return cached.conn;
    } else {
      // Connection exists but not ready, reset it
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then(async (mongooseInstance) => {
      console.log('✅ MongoDB Connected');
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB Connection Error:', err);
        cached.conn = null;
        cached.promise = null;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB Disconnected');
        cached.conn = null;
        cached.promise = null;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB Reconnected');
      });
      
      // Auto-import businesses if database is empty (runs once on first connection)
      if (process.env.AUTO_IMPORT_BUSINESSES !== 'false') {
        // Run in background to not block connection
        setImmediate(async () => {
          try {
            const Business = (await import('@/models/Business')).default;
            const Category = (await import('@/models/Category')).default;
            const businessCount = await Business.countDocuments();
            
            if (businessCount === 0) {
              console.log('📦 No businesses found. Starting automatic import...');
              // Direct import without API call
              const { extractAreaFromAddress, generateBusinessSlug } = await import('@/app/utils/businessUtils');
              const fs = await import('fs');
              const path = await import('path');
              
              const JSON_TO_CATEGORY_MAP: Record<string, string> = {
                'Restaurants.json': 'restaurants',
                'Hotel.json': 'hotels',
                'beautyspa.json': 'beauty-spa',
                'Home-Decor.json': 'home-decor',
                'Wedding-Planning.json': 'wedding-planning',
                'Education.json': 'education',
                'Rent.json': 'rent-hire',
                'Hospitals.json': 'hospitals',
                'contractor.json': 'contractors',
                'Pet.json': 'pet-shops',
                'Pg.json': 'pg-hostels',
                'Estate-Agent.json': 'estate-agent',
                'dentists.json': 'dentists',
                'Gym.json': 'gym',
                'Loans.json': 'loans',
                'Event-Organisers.json': 'event-organisers',
                'Driving -Schools.json': 'driving-schools',
                'Packers.json': 'packers-movers',
                'courier_service.json': 'courier-service',
              };
              
              const appDir = path.join(process.cwd(), 'app');
              let totalImported = 0;
              
              for (const [fileName, categorySlug] of Object.entries(JSON_TO_CATEGORY_MAP)) {
                const jsonFilePath = path.join(appDir, fileName);
                if (!fs.existsSync(jsonFilePath)) continue;
                
                try {
                  const category = await Category.findOne({ slug: categorySlug });
                  if (!category) continue;
                  
                  const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
                  const businesses = JSON.parse(fileContent);
                  
                  const existingBusinesses = await Business.find({ categoryId: category._id });
                  const existingSlugs = new Set(existingBusinesses.map((b: any) => b.slug));
                  
                  for (const business of businesses) {
                    const existing = existingBusinesses.find(
                      (b: any) => b.name.toLowerCase() === business.name.toLowerCase() && 
                                  b.address.toLowerCase() === business.address.toLowerCase()
                    );
                    if (existing) continue;
                    
                    const slug = generateBusinessSlug(business.name, existingSlugs);
                    existingSlugs.add(slug);
                    const area = extractAreaFromAddress(business.address);
                    
                    await Business.create({
                      name: business.name.trim(),
                      slug,
                      categoryId: category._id,
                      address: business.address.trim(),
                      pincode: (business.pincode?.trim() || '').replace(/\D+/g, '').slice(0, 6) || '',
                      area: area,
                      isFeatured: false,
                    });
                    totalImported++;
                  }
                } catch (error: any) {
                  console.error(`Error importing ${fileName}:`, error.message);
                }
              }
              
              if (totalImported > 0) {
                console.log(`✅ Auto-import completed: ${totalImported} businesses imported`);
              }
            }
          } catch (error: any) {
            console.log('⚠️  Auto-import skipped:', error.message);
          }
        });
      }
      
      return mongooseInstance;
    }).catch((error) => {
      // Clear the promise on error so we can retry
      cached.promise = null;
      console.error('❌ MongoDB Connection Error:', error.message);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    // Provide more helpful error messages
    if (e.name === 'MongooseServerSelectionError') {
      const errorMessage = e.message || 'Could not connect to MongoDB';
      if (errorMessage.includes('whitelist') || errorMessage.includes('IP')) {
        throw new Error(
          'MongoDB Connection Failed: Your IP address is not whitelisted in MongoDB Atlas. ' +
          'Please add your current IP address to the Atlas IP whitelist: ' +
          'https://www.mongodb.com/docs/atlas/security-whitelist/'
        );
      }
      throw new Error(
        `MongoDB Connection Failed: ${errorMessage}. ` +
        'Please check your MONGODB_URI in .env.local and ensure your MongoDB Atlas cluster is running.'
      );
    }
    throw e;
  }

  return cached.conn;
}

export default connectDB;

