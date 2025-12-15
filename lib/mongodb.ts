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
  // Increase MaxListeners to prevent warnings
  if (mongoose.connection.setMaxListeners) {
    mongoose.connection.setMaxListeners(20);
  }
  
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
    // Ensure MONGODB_URI is defined
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Reduced to 10 seconds for faster failure
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 20, // Increased to 20 connections for better concurrency
      minPoolSize: 5, // Increased to 5 for better reliability
      maxIdleTimeMS: 60000, // Keep connections alive longer (60 seconds)
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
      // SSL/TLS options are handled by MongoDB URI connection string automatically
      // Do NOT set ssl, sslValidate, or any SSL-related options here
      // MongoDB Atlas handles SSL/TLS automatically through the connection string
      // Retry options for better reliability
      retryWrites: true,
      retryReads: true,
      // Connection retry options
      connectTimeoutMS: 10000, // Reduced to 10 seconds for faster connection
      // Optimize for performance
      directConnection: false, // Use connection pool
    };

    // Add retry logic for SSL/TLS connection errors
    const connectWithRetry = async (retries = 2): Promise<typeof mongoose> => {
      try {
        return await mongoose.connect(MONGODB_URI!, opts);
      } catch (error: any) {
        const isSSLError = error?.message?.includes('SSL') || 
                          error?.message?.includes('TLS') || 
                          error?.message?.includes('ssl3_read_bytes') ||
                          error?.message?.includes('tlsv1 alert');
        
        // Retry SSL errors up to 2 times with delay
        if (isSSLError && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return connectWithRetry(retries - 1);
        }
        throw error;
      }
    };

    cached.promise = connectWithRetry().then(async (mongooseInstance) => {
      // Silent connection success - only log errors
      
      // Remove existing listeners to prevent duplicates
      mongoose.connection.removeAllListeners('error');
      mongoose.connection.removeAllListeners('disconnected');
      mongoose.connection.removeAllListeners('reconnected');
      
      // Handle connection events (only add once)
      mongoose.connection.once('error', (err) => {
        // Don't log SSL/TLS errors repeatedly - they're usually transient
        const errorString = String(err?.message || err?.stack || err || '');
        const isSSLError = errorString.includes('SSL') || 
                          errorString.includes('TLS') ||
                          errorString.includes('ssl3_read_bytes') ||
                          errorString.includes('tlsv1 alert') ||
                          errorString.includes('98180000') ||
                          errorString.includes('0A000438') ||
                          errorString.includes('Connection pool');
        
        if (isSSLError) {
          // Silent SSL errors - they'll retry automatically
          // Reset connection to allow retry
          cached.conn = null;
          cached.promise = null;
        } else {
          console.error('❌ MongoDB Connection Error:', err.message || err);
          cached.conn = null;
          cached.promise = null;
        }
      });
      
      mongoose.connection.once('disconnected', () => {
        // Silent disconnection - only log errors
        cached.conn = null;
        cached.promise = null;
      });
      
      mongoose.connection.once('reconnected', () => {
        // Silent reconnection - only log errors
      });
      
      // Auto-import businesses if database is empty (runs once on first connection)
      // Use a global flag to prevent multiple imports
      if (process.env.AUTO_IMPORT_BUSINESSES !== 'false' && !(global as any).__autoImportRunning) {
        (global as any).__autoImportRunning = true;
        // Run in background to not block connection
        setImmediate(async () => {
          try {
            const Business = (await import('@/models/Business')).default;
            const Category = (await import('@/models/Category')).default;
            const businessCount = await Business.countDocuments();
            
            if (businessCount === 0) {
              // Silent auto-import start
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
                  // Silent import errors - only log critical failures
                  // Uncomment for debugging: console.error(`Error importing ${fileName}:`, error.message);
                }
              }
              
              if (totalImported > 0) {
                // Silent success - only log if needed for debugging
              }
            }
          } catch (error: any) {
            // Silent skip - only log critical errors
          } finally {
            // Reset flag after import completes
            (global as any).__autoImportRunning = false;
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

