/**
 * Script to set admin role for a specific user
 * Run: npx ts-node scripts/set-admin-role.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../models/User';

async function setAdminRole() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const email = 'kamaralamjdu@gmail.com';

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      console.log('\n💡 Creating new admin user...\n');
      
      // Create new admin user
      const newUser = await User.create({
        name: 'Admin User',
        email: email.toLowerCase().trim(),
        password: 'admin123', // Will be hashed by pre-save hook
        phone: '+919999999999',
        role: 'admin',
        isEmailVerified: true,
      });

      console.log('✅ Admin user created successfully!\n');
      console.log('📋 Admin Credentials:');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Password: admin123`);
      console.log(`   Role: ${newUser.role}\n`);
      
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update existing user to admin
    console.log(`📝 Found user: ${user.name} (${user.email})`);
    console.log(`   Current role: ${user.role}\n`);

    if (user.role === 'admin') {
      console.log('✅ User is already an admin!');
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}\n`);
    } else {
      user.role = 'admin';
      await user.save();
      
      console.log('✅ User role updated to admin successfully!\n');
      console.log('📋 Updated User Info:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}\n`);
    }

    console.log('🎉 Done! User now has admin access.');
    console.log('   Login URL: http://localhost:3001/login?redirect=/admin\n');
    console.log('⚠️  Note: User needs to logout and login again to refresh their token.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - email or phone already exists');
    }
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

setAdminRole();

