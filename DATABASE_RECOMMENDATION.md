# Database Recommendation for 99-rupeess (KVL Business)

## Website Overview

Your website is a **local business directory platform** (similar to Yellow Pages) for Patna, India, featuring:
- Business listings across 19+ categories (restaurants, hotels, beauty-spa, etc.)
- Location-based search and filtering
- Featured businesses
- Offers/deals from businesses
- Banner advertisements (sponsored content)
- Analytics tracking (banner clicks, offer clicks)
- Search suggestions
- Geospatial queries (finding nearby businesses)

## Current State

- All data is currently **hardcoded/mock data** in API routes
- No database is currently implemented
- Next.js 16 with TypeScript
- API routes are set up but return static data

## Database Requirements

Based on your codebase analysis, you need:

1. **Geospatial Queries**: Find businesses "nearby" based on location (distance calculations)
2. **Relational Data**: Businesses → Categories, Businesses → Offers, Businesses → Locations
3. **Full-Text Search**: Search businesses by name, category, location
4. **Time-Based Queries**: Filter offers by expiration dates
5. **Analytics Storage**: Track banner clicks, offer clicks with timestamps
6. **Scalability**: Handle growing number of businesses and users
7. **Location Filtering**: Filter by city, pincode, district
8. **Sorting**: By rating, reviews, distance, popularity

## Recommended Database: **PostgreSQL with PostGIS** (via Supabase)

### Why PostgreSQL + Supabase?

#### ✅ **Perfect Fit for Your Needs**

1. **Geospatial Support (PostGIS)**
   - Native support for location-based queries
   - Calculate distances between coordinates
   - Find businesses within X km radius
   - Example query: `SELECT * FROM businesses WHERE ST_DWithin(location, ST_MakePoint(?, ?), 5000)`

2. **Relational Data Structure**
   - Perfect for your business → category → location relationships
   - Foreign keys, joins, and referential integrity
   - ACID compliance for data consistency

3. **Full-Text Search**
   - Built-in PostgreSQL full-text search
   - Can search across business names, descriptions, categories
   - Fast and efficient

4. **Excellent Next.js Integration**
   - Supabase has official Next.js SDK
   - Server-side and client-side support
   - TypeScript support out of the box

5. **Cost-Effective**
   - **Free tier**: 500MB database, 2GB bandwidth, 50,000 monthly active users
   - Perfect for starting out
   - Scales as you grow

6. **Additional Features**
   - Real-time subscriptions (if you need live updates)
   - Built-in authentication (if you add admin panel later)
   - Row-level security
   - Automatic backups

### Alternative Options (Ranked)

#### 2. **MongoDB Atlas** (Document Database)
- ✅ Good for flexible schemas
- ✅ Geospatial indexing support
- ✅ Free tier available (512MB)
- ❌ Less structured than PostgreSQL
- ❌ More complex joins
- ❌ Weaker full-text search

#### 3. **PlanetScale** (MySQL-based)
- ✅ Serverless MySQL
- ✅ Great scaling
- ✅ Branching (like Git for databases)
- ❌ Limited geospatial support (requires workarounds)
- ❌ More expensive than Supabase

#### 4. **Firebase/Firestore**
- ✅ Easy to start
- ✅ Real-time updates
- ❌ Limited geospatial queries (only basic radius)
- ❌ Can get expensive quickly
- ❌ NoSQL (less structured)

## Recommended Database Schema

Here's a suggested schema structure for your PostgreSQL database:

```sql
-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  icon_url TEXT,
  item_count INTEGER DEFAULT 0,
  sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Locations Table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(2) DEFAULT 'IN',
  display_name VARCHAR(200) NOT NULL,
  pincode INTEGER,
  district VARCHAR(100),
  -- PostGIS geometry for geospatial queries
  coordinates POINT, -- (longitude, latitude)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial index for location queries
CREATE INDEX idx_locations_coordinates ON locations USING GIST (coordinates);

-- Businesses Table
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category_id UUID REFERENCES categories(id),
  location_id UUID REFERENCES locations(id),
  image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  phone VARCHAR(20),
  email VARCHAR(255),
  website TEXT,
  address TEXT,
  -- PostGIS geometry for geospatial queries
  coordinates POINT, -- (longitude, latitude)
  featured BOOLEAN DEFAULT false,
  sponsored BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_businesses_category ON businesses(category_id);
CREATE INDEX idx_businesses_location ON businesses(location_id);
CREATE INDEX idx_businesses_coordinates ON businesses USING GIST (coordinates);
CREATE INDEX idx_businesses_featured ON businesses(featured) WHERE featured = true;
CREATE INDEX idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX idx_businesses_reviews ON businesses(reviews DESC);

-- Full-text search index
CREATE INDEX idx_businesses_search ON businesses USING GIN (to_tsvector('english', name));

-- Offers Table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  headline VARCHAR(200) NOT NULL,
  description TEXT,
  discount VARCHAR(50),
  image_url TEXT,
  expires_at TIMESTAMP,
  cta VARCHAR(50) DEFAULT 'Shop Now',
  sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offers_business ON offers(business_id);
CREATE INDEX idx_offers_expires ON offers(expires_at) WHERE expires_at > NOW();

-- Banners Table
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(20) NOT NULL CHECK (section IN ('hero', 'left', 'right', 'top', 'bottom')),
  image_url TEXT NOT NULL,
  title VARCHAR(200),
  cta VARCHAR(50),
  cta_text VARCHAR(50),
  link_url TEXT NOT NULL,
  alt TEXT,
  advertiser VARCHAR(200),
  sponsored BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banners_section ON banners(section, position) WHERE active = true;

-- Analytics Tables
CREATE TABLE banner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID REFERENCES banners(id),
  section VARCHAR(20),
  position INTEGER,
  user_ip VARCHAR(45),
  user_agent TEXT,
  location_id UUID REFERENCES locations(id),
  clicked_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE offer_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id),
  business_id UUID REFERENCES businesses(id),
  user_ip VARCHAR(45),
  user_agent TEXT,
  location_id UUID REFERENCES locations(id),
  clicked_at TIMESTAMP DEFAULT NOW()
);

-- Search suggestions (can be materialized view or table)
CREATE TABLE search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) CHECK (type IN ('shop', 'category', 'location')),
  reference_id UUID, -- business_id, category_id, or location_id
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(200),
  search_vector tsvector, -- for full-text search
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_suggestions_vector ON search_suggestions USING GIN (search_vector);
```

## Implementation Steps

### 1. Set Up Supabase

```bash
# Install Supabase client
npm install @supabase/supabase-js
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Enable PostGIS extension in database settings
5. Copy your project URL and anon key

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 5. Example Query: Find Nearby Restaurants

```typescript
// app/api/businesses/restaurants/route.ts
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'nearby', 'popular', 'rated'
  const loc = searchParams.get('loc'); // location ID
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  let query = supabase
    .from('businesses')
    .select(`
      *,
      category:categories(*),
      location:locations(*)
    `)
    .eq('category.slug', 'restaurants');

  if (type === 'nearby' && lat && lon) {
    // Find businesses within 10km radius
    query = query
      .select('*, distance')
      .rpc('find_nearby_businesses', {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        radius_km: 10
      });
  } else if (type === 'popular') {
    query = query.order('reviews', { ascending: false });
  } else if (type === 'rated') {
    query = query.order('rating', { ascending: false });
  }

  const { data, error } = await query.limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ restaurants: data });
}
```

## Migration Path

1. **Phase 1**: Set up Supabase, create schema
2. **Phase 2**: Migrate categories and locations data
3. **Phase 3**: Migrate businesses data (start with featured businesses)
4. **Phase 4**: Migrate offers and banners
5. **Phase 5**: Implement analytics tracking
6. **Phase 6**: Add search functionality

## Cost Estimate

- **Free Tier**: Perfect for MVP and early stage
  - 500MB database storage
  - 2GB bandwidth
  - 50,000 monthly active users
  - Unlimited API requests

- **Pro Tier** ($25/month): When you scale
  - 8GB database storage
  - 50GB bandwidth
  - 100,000 monthly active users
  - Daily backups

## Conclusion

**PostgreSQL via Supabase** is the best choice for your business directory platform because:
- ✅ Native geospatial support (critical for "nearby" features)
- ✅ Relational structure fits your data model perfectly
- ✅ Excellent Next.js integration
- ✅ Free tier to start
- ✅ Scales as you grow
- ✅ Built-in features (auth, real-time) for future needs

Start with the free tier, and upgrade when you need more resources. The migration from mock data to Supabase will be straightforward given your existing API structure.

