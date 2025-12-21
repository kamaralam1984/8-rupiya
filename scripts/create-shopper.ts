import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import Shopper from '../lib/models/Shopper';

async function createShopper() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if shopper already exists
    const existingShopper = await Shopper.findOne({
      $or: [
        { email: 'khushi@gmail.com' },
        { phone: '9876543212' },
      ],
    });

    if (existingShopper) {
      console.log('❌ Shopper already exists with this email or phone');
      console.log('Existing shopper:', {
        name: existingShopper.name,
        email: existingShopper.email,
        phone: existingShopper.phone,
        shopperCode: existingShopper.shopperCode,
      });
      await mongoose.disconnect();
      return;
    }

    // Create new shopper
    const shopper = await Shopper.create({
      name: 'Khushi Kumari',
      phone: '9876543212',
      email: 'khushi@gmail.com',
      passwordHash: '123456', // Will be hashed by pre-save hook
      isActive: true,
      isVerified: false,
    });

    console.log('✅ Shopper created successfully!');
    console.log('📋 Shopper Details:');
    console.log('   Name:', shopper.name);
    console.log('   Email:', shopper.email);
    console.log('   Phone:', shopper.phone);
    console.log('   Shopper Code:', shopper.shopperCode);
    console.log('   Password: 123456');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email/Phone: khushi@gmail.com or 9876543212');
    console.log('   Password: 123456');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error: any) {
    console.error('❌ Error creating shopper:', error);
    if (error.code === 11000) {
      console.error('Duplicate key error - shopper with this email or phone already exists');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

createShopper();






