/**
 * Script to create a sample operator for testing
 * Run: npx tsx scripts/create-operator.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Operator from '../lib/models/Operator';

async function createOperator() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Operator data
    const operatorData = {
      name: 'afroj bhai',
      phone: '3234567876',
      email: 'afrojkai4@gmail.com',
      passwordHash: '123456', // Will be hashed automatically by pre-save hook
      operatorCode: 'OP001', // Will auto-generate if needed
      isActive: true,
    };

    // Check if operator already exists by email or phone
    const existingOperator = await Operator.findOne({
      $or: [
        { email: operatorData.email.toLowerCase() },
        { phone: operatorData.phone },
      ],
    });

    if (existingOperator) {
      console.log('⚠️  Operator already exists:');
      console.log(`   Name: ${existingOperator.name}`);
      console.log(`   Email: ${existingOperator.email}`);
      console.log(`   Phone: ${existingOperator.phone}`);
      console.log(`   Operator Code: ${existingOperator.operatorCode}`);
      console.log(`   Password: 123456`);
      console.log('\n📝 Login credentials:');
      console.log(`   Email/Phone: ${existingOperator.email} or ${existingOperator.phone}`);
      console.log(`   Password: 123456`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Generate unique operator code
    let operatorCode = 'OP001';
    let existingCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
    if (existingCode) {
      // Find next available code
      let counter = 1;
      while (existingCode) {
        counter++;
        operatorCode = `OP${String(counter).padStart(3, '0')}`;
        existingCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
      }
    }
    operatorData.operatorCode = operatorCode.toUpperCase();

    // Create operator
    const operator = await Operator.create(operatorData);

    console.log('✅ Operator created successfully!\n');
    console.log('📋 Operator Details:');
    console.log(`   Name: ${operator.name}`);
    console.log(`   Email: ${operator.email}`);
    console.log(`   Phone: ${operator.phone}`);
    console.log(`   Operator Code: ${operator.operatorCode}`);
    console.log(`   Status: ${operator.isActive ? 'Active' : 'Inactive'}`);
    console.log('\n📝 Login Credentials:');
    console.log(`   Email/Phone: ${operator.email} or ${operator.phone}`);
    console.log(`   Password: 123456`);
    console.log('\n🔗 Login URL:');
    console.log(`   http://localhost:3000/operator/login`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating operator:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - operator with this email, phone, or code already exists');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

createOperator();

