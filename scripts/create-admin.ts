/**
 * Script to create admin user or update existing user to admin
 * Run: npx ts-node scripts/create-admin.ts
 */

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import User from '../models/User';

async function createAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const email = 'admin@99rupeess.com';
    const password = 'admin123';
    const name = 'Admin User';
    const phone = '+919999999999';

    // Check if admin user already exists
    let admin = await User.findOne({ email });

    if (admin) {
      console.log('📝 Found existing user, updating to admin...');
      
      // Update to admin role
      admin.role = 'admin';
      admin.name = name;
      if (admin.phone !== phone) {
        admin.phone = phone;
      }
      // Update password if needed
      admin.password = password; // Will be hashed by pre-save hook
      await admin.save();
      
      console.log('✅ User updated to admin successfully!\n');
      console.log('📋 Admin Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${admin.role}\n`);
    } else {
      console.log('➕ Creating new admin user...');
      
      // Create new admin user
      admin = await User.create({
        name,
        email,
        password, // Will be hashed by pre-save hook
        phone,
        role: 'admin',
        isEmailVerified: true,
      });
      
      console.log('✅ Admin user created successfully!\n');
      console.log('📋 Admin Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${admin.role}\n`);
    }

    // Verify password works
    const testUser = await User.findOne({ email }).select('+password');
    if (testUser) {
      const isValid = await testUser.comparePassword(password);
      console.log(`✅ Password verification: ${isValid ? 'PASSED' : 'FAILED'}\n`);
    }

    console.log('🎉 Done! You can now login with these credentials.');
    console.log('   Login URL: http://localhost:3000/login?redirect=/admin\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - email or phone already exists');
    }
    process.exit(1);
  }
}

createAdmin();

