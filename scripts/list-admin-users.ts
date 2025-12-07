/**
 * Script to list all admin users with their IDs
 * Run: npx ts-node scripts/list-admin-users.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import connectDB from '../lib/mongodb';
import User from '../models/User';

async function listAdminUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Find all users with admin role
    const adminUsers = await User.find({ role: 'admin' })
      .select('_id name email phone role createdAt')
      .sort({ createdAt: 1 })
      .lean();

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the database.\n');
      console.log('💡 To create an admin user, run:');
      console.log('   npx ts-node scripts/create-admin.ts\n');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      console.log('═'.repeat(80));
      
      adminUsers.forEach((user, index) => {
        console.log(`\n👑 Admin #${index + 1}:`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN') : 'N/A'}`);
      });
      
      console.log('\n' + '═'.repeat(80));
      console.log(`\n📊 Summary: Total ${adminUsers.length} admin user(s) with full control.\n`);
      
      // Also show IDs in a simple list format
      console.log('📋 Admin User IDs:');
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user._id} (${user.email})`);
      });
      console.log('');
    }

    // Also check for editor and operator roles
    const editorUsers = await User.find({ role: 'editor' })
      .select('_id name email role')
      .lean();
    
    const operatorUsers = await User.find({ role: 'operator' })
      .select('_id name email role')
      .lean();

    if (editorUsers.length > 0 || operatorUsers.length > 0) {
      console.log('📌 Other Privileged Users:');
      if (editorUsers.length > 0) {
        console.log(`   Editors: ${editorUsers.length}`);
        editorUsers.forEach(user => {
          console.log(`      - ${user._id} (${user.email})`);
        });
      }
      if (operatorUsers.length > 0) {
        console.log(`   Operators: ${operatorUsers.length}`);
        operatorUsers.forEach(user => {
          console.log(`      - ${user._id} (${user.email})`);
        });
      }
      console.log('');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

listAdminUsers();

