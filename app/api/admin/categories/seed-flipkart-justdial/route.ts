import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Category from '@/models/Category';

/**
 * POST /api/admin/categories/seed-flipkart-justdial
 * Seed categories based on Flipkart and JustDial categories
 */
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Combined categories from Flipkart and JustDial
    const categories = [
      // Electronics (Flipkart)
      { name: 'Electronics', slug: 'electronics', description: 'Mobile phones, Laptops, Cameras, TVs, Audio devices' },
      { name: 'Mobile Phones', slug: 'mobile-phones', description: 'Smartphones and mobile accessories' },
      { name: 'Laptops', slug: 'laptops', description: 'Laptops and computer accessories' },
      { name: 'Televisions', slug: 'televisions', description: 'TVs and home entertainment' },
      { name: 'Cameras', slug: 'cameras', description: 'Digital cameras and photography equipment' },
      { name: 'Audio Devices', slug: 'audio-devices', description: 'Headphones, speakers, and audio equipment' },
      
      // Fashion (Flipkart)
      { name: 'Fashion', slug: 'fashion', description: 'Clothing, footwear, and accessories' },
      { name: "Men's Clothing", slug: 'mens-clothing', description: 'Clothing for men' },
      { name: "Women's Clothing", slug: 'womens-clothing', description: 'Clothing for women' },
      { name: "Kids' Clothing", slug: 'kids-clothing', description: 'Clothing for children' },
      { name: 'Footwear', slug: 'footwear', description: 'Shoes and footwear' },
      { name: 'Watches', slug: 'watches', description: 'Watches and timepieces' },
      { name: 'Jewellery', slug: 'jewellery', description: 'Jewellery and accessories' },
      { name: 'Bags & Luggage', slug: 'bags-luggage', description: 'Bags, wallets, and luggage' },
      
      // Home & Furniture (Flipkart)
      { name: 'Home & Furniture', slug: 'home-furniture', description: 'Furniture and home decor' },
      { name: 'Furniture', slug: 'furniture', description: 'Sofas, beds, tables, and chairs' },
      { name: 'Home Decor', slug: 'home-decor', description: 'Home decoration items' },
      { name: 'Kitchen Appliances', slug: 'kitchen-appliances', description: 'Kitchen and dining products' },
      { name: 'Bathroom Accessories', slug: 'bathroom-accessories', description: 'Bathroom fixtures and accessories' },
      
      // Grocery (Flipkart)
      { name: 'Grocery', slug: 'grocery', description: 'Food items and daily essentials' },
      { name: 'Fresh Fruits & Vegetables', slug: 'fresh-fruits-vegetables', description: 'Fresh produce' },
      { name: 'Dairy Products', slug: 'dairy-products', description: 'Milk, cheese, and dairy items' },
      { name: 'Packaged Food', slug: 'packaged-food', description: 'Packaged and processed food' },
      { name: 'Beverages', slug: 'beverages', description: 'Drinks and beverages' },
      
      // Beauty & Personal Care (Flipkart)
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', description: 'Cosmetics and personal care products' },
      { name: 'Cosmetics', slug: 'cosmetics', description: 'Makeup and beauty products' },
      { name: 'Skincare', slug: 'skincare', description: 'Skincare products' },
      { name: 'Haircare', slug: 'haircare', description: 'Hair care products' },
      { name: 'Grooming', slug: 'grooming', description: 'Men\'s grooming products' },
      { name: 'Perfumes', slug: 'perfumes', description: 'Fragrances and perfumes' },
      
      // Sports & Fitness (Flipkart)
      { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports equipment and fitness gear' },
      { name: 'Sports Equipment', slug: 'sports-equipment', description: 'Sports and outdoor equipment' },
      { name: 'Fitness Gear', slug: 'fitness-gear', description: 'Fitness and gym equipment' },
      
      // Kids & Toys (Flipkart)
      { name: 'Kids & Toys', slug: 'kids-toys', description: 'Toys and kids products' },
      { name: 'Toys', slug: 'toys', description: 'Toys and games for children' },
      { name: 'Baby Care', slug: 'baby-care', description: 'Baby products and care items' },
      { name: 'School Supplies', slug: 'school-supplies', description: 'School and stationery items' },
      
      // Automotive (Flipkart)
      { name: 'Automotive', slug: 'automotive', description: 'Car and bike accessories' },
      { name: 'Car Accessories', slug: 'car-accessories', description: 'Car parts and accessories' },
      { name: 'Bike Accessories', slug: 'bike-accessories', description: 'Bike parts and accessories' },
      { name: 'Helmets', slug: 'helmets', description: 'Safety helmets' },
      { name: 'GPS & Navigation', slug: 'gps-navigation', description: 'GPS devices and navigation' },
      
      // Books & Media (Flipkart)
      { name: 'Books & Media', slug: 'books-media', description: 'Books, music, and movies' },
      { name: 'Books', slug: 'books', description: 'Educational, fiction, and non-fiction books' },
      { name: 'Stationery', slug: 'stationery', description: 'Stationery items' },
      { name: 'Music & Movies', slug: 'music-movies', description: 'Music CDs and movie DVDs' },
      
      // Health & Wellness (Flipkart)
      { name: 'Health & Wellness', slug: 'health-wellness', description: 'Health products and supplements' },
      { name: 'Vitamins & Supplements', slug: 'vitamins-supplements', description: 'Health supplements' },
      { name: 'Health Monitors', slug: 'health-monitors', description: 'Health monitoring devices' },
      { name: 'Medical Equipment', slug: 'medical-equipment', description: 'Medical devices and equipment' },
      
      // Pet Supplies (Flipkart)
      { name: 'Pet Supplies', slug: 'pet-supplies', description: 'Pet food and accessories' },
      { name: 'Pet Food', slug: 'pet-food', description: 'Food for pets' },
      { name: 'Pet Accessories', slug: 'pet-accessories', description: 'Pet care accessories' },
      
      // Travel (Flipkart)
      { name: 'Travel', slug: 'travel', description: 'Travel accessories and luggage' },
      { name: 'Luggage', slug: 'luggage', description: 'Travel bags and luggage' },
      { name: 'Travel Accessories', slug: 'travel-accessories', description: 'Travel essentials' },
      { name: 'Backpacks', slug: 'backpacks', description: 'Backpacks and bags' },
      
      // JustDial Categories - Restaurants & Food
      { name: 'Restaurants', slug: 'restaurants', description: 'Restaurants and dining places' },
      { name: 'Cafes', slug: 'cafes', description: 'Coffee shops and cafes' },
      { name: 'Fast Food', slug: 'fast-food', description: 'Fast food outlets' },
      { name: 'Bakery', slug: 'bakery', description: 'Bakery and confectionery' },
      { name: 'Sweet Shops', slug: 'sweet-shops', description: 'Sweet shops and confectionery' },
      { name: 'Ice Cream Parlors', slug: 'ice-cream-parlors', description: 'Ice cream shops' },
      
      // JustDial - Health & Medical
      { name: 'Hospitals', slug: 'hospitals', description: 'Hospitals and medical centers' },
      { name: 'Clinics', slug: 'clinics', description: 'Medical clinics' },
      { name: 'Doctors', slug: 'doctors', description: 'Doctor clinics and practices' },
      { name: 'Pharmacy', slug: 'pharmacy', description: 'Medical stores and pharmacies' },
      { name: 'Dentists', slug: 'dentists', description: 'Dental clinics' },
      { name: 'Diagnostic Centers', slug: 'diagnostic-centers', description: 'Lab and diagnostic centers' },
      { name: 'Ayurveda', slug: 'ayurveda', description: 'Ayurvedic clinics and centers' },
      { name: 'Physiotherapy', slug: 'physiotherapy', description: 'Physiotherapy centers' },
      
      // JustDial - Education
      { name: 'Schools', slug: 'schools', description: 'Schools and educational institutions' },
      { name: 'Colleges', slug: 'colleges', description: 'Colleges and universities' },
      { name: 'Coaching Centers', slug: 'coaching-centers', description: 'Tuition and coaching centers' },
      { name: 'Computer Training', slug: 'computer-training', description: 'Computer training institutes' },
      { name: 'Language Classes', slug: 'language-classes', description: 'Language learning centers' },
      
      // JustDial - Home Services
      { name: 'Home Services', slug: 'home-services', description: 'Home repair and maintenance services' },
      { name: 'Plumbers', slug: 'plumbers', description: 'Plumbing services' },
      { name: 'Electricians', slug: 'electricians', description: 'Electrical services' },
      { name: 'Carpenters', slug: 'carpenters', description: 'Carpentry services' },
      { name: 'Painters', slug: 'painters', description: 'Painting services' },
      { name: 'AC Repair', slug: 'ac-repair', description: 'AC repair and service' },
      { name: 'Appliance Repair', slug: 'appliance-repair', description: 'Home appliance repair' },
      { name: 'Cleaning Services', slug: 'cleaning-services', description: 'House cleaning services' },
      
      // JustDial - Automobile Services
      { name: 'Car Dealerships', slug: 'car-dealerships', description: 'Car showrooms and dealers' },
      { name: 'Service Centers', slug: 'service-centers', description: 'Vehicle service centers' },
      { name: 'Spare Parts', slug: 'spare-parts', description: 'Auto spare parts shops' },
      { name: 'Car Wash', slug: 'car-wash', description: 'Car washing services' },
      { name: 'Tyre Shops', slug: 'tyre-shops', description: 'Tyre dealers and shops' },
      
      // JustDial - Events & Entertainment
      { name: 'Movie Theaters', slug: 'movie-theaters', description: 'Cinema halls and theaters' },
      { name: 'Event Organizers', slug: 'event-organizers', description: 'Event planning and management' },
      { name: 'Party Planners', slug: 'party-planners', description: 'Party planning services' },
      { name: 'Photographers', slug: 'photographers', description: 'Photography services' },
      { name: 'Catering Services', slug: 'catering-services', description: 'Catering and food services' },
      
      // JustDial - Other Services
      { name: 'Salons', slug: 'salons', description: 'Beauty salons and parlors' },
      { name: 'Gyms', slug: 'gyms', description: 'Gym and fitness centers' },
      { name: 'Hotels', slug: 'hotels', description: 'Hotels and lodges' },
      { name: 'Travel Agents', slug: 'travel-agents', description: 'Travel booking and agents' },
      { name: 'Real Estate', slug: 'real-estate', description: 'Property dealers and real estate' },
      { name: 'Insurance', slug: 'insurance', description: 'Insurance agents and companies' },
      { name: 'Banks', slug: 'banks', description: 'Banks and financial institutions' },
      { name: 'Lawyers', slug: 'lawyers', description: 'Legal services and lawyers' },
      { name: 'CA & Tax Consultants', slug: 'ca-tax-consultants', description: 'Chartered accountants and tax consultants' },
      { name: 'Printing Services', slug: 'printing-services', description: 'Printing and photocopy services' },
      { name: 'Courier Services', slug: 'courier-services', description: 'Courier and shipping services' },
      
      // Common Categories
      { name: 'General Store', slug: 'general-store', description: 'General stores and convenience stores' },
      { name: 'Supermarket', slug: 'supermarket', description: 'Supermarkets and hypermarkets' },
      { name: 'Others', slug: 'others', description: 'Other businesses and services' },
    ];

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const cat of categories) {
      try {
        const existing = await Category.findOne({ slug: cat.slug });
        
        if (existing) {
          // Update existing category
          existing.name = cat.name;
          existing.description = cat.description;
          existing.isActive = true;
          await existing.save();
          updated++;
        } else {
          // Create new category
          await Category.create({
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            isActive: true,
          });
          created++;
        }
      } catch (error: any) {
        console.error(`Error processing category ${cat.name}:`, error);
        skipped++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Categories seeded successfully! Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`,
        results: {
          created,
          updated,
          skipped,
          total: categories.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error seeding categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed categories', details: error.message },
      { status: 500 }
    );
  }
});






