/**
 * Script to fix operators database issues
 * - Drop stale operatorId_1 index
 * - Fix operators with undefined operatorCode
 * - Create new operator if needed
 * Run: npx tsx scripts/fix-operators-db.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Operator from '../lib/models/Operator';

async function fixOperatorsDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Drop stale operatorId_1 index
    console.log('🗑️  Dropping stale operatorId_1 index...');
    try {
      const collection = mongoose.connection.db?.collection('operators');
      if (collection) {
        await collection.dropIndex('operatorId_1');
        console.log('✅ Dropped operatorId_1 index\n');
      }
    } catch (error: any) {
      if (error.code === 27) {
        console.log('⚠️  operatorId_1 index does not exist (already dropped)\n');
      } else {
        console.log(`⚠️  Could not drop operatorId_1 index: ${error.message}\n`);
      }
    }

    // Fix operators with undefined operatorCode (skip phone validation for now)
    console.log('🔧 Fixing operators with undefined operatorCode...');
    const operatorsWithoutCode = await Operator.find({ 
      $or: [
        { operatorCode: { $exists: false } },
        { operatorCode: null },
        { operatorCode: undefined },
      ]
    });

    for (const operator of operatorsWithoutCode) {
      try {
        let operatorCode = 'OP001';
        let existingCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
        if (existingCode) {
          let counter = 1;
          while (existingCode) {
            counter++;
            operatorCode = `OP${String(counter).padStart(3, '0')}`;
            existingCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
          }
        }
        operator.operatorCode = operatorCode.toUpperCase();
        await operator.save({ validateBeforeSave: false }); // Skip validation for existing operators
        console.log(`   ✅ Fixed operator ${operator.name} - assigned code: ${operatorCode.toUpperCase()}`);
      } catch (error: any) {
        console.log(`   ⚠️  Could not fix operator ${operator.name}: ${error.message}`);
      }
    }

    if (operatorsWithoutCode.length === 0) {
      console.log('   ✅ All operators have valid operatorCode\n');
    } else {
      console.log('');
    }

    // Check if target operator exists
    const email = 'afrojkai4@gmail.com';
    const phone = '3234567876';
    const newPassword = '123456';

    const existingOperator = await Operator.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone },
      ],
    }).select('+passwordHash');

    if (existingOperator) {
      console.log('✅ Operator already exists!\n');
      console.log('📋 Operator Details:');
      console.log(`   Name: ${existingOperator.name}`);
      console.log(`   Email: ${existingOperator.email}`);
      console.log(`   Phone: ${existingOperator.phone}`);
      console.log(`   Operator Code: ${existingOperator.operatorCode}`);
      console.log(`   Status: ${existingOperator.isActive ? 'Active' : 'Inactive'}`);
      
      // Reset password
      console.log('\n🔐 Resetting password...');
      existingOperator.passwordHash = newPassword;
      existingOperator.isActive = true;
      await existingOperator.save();
      
      console.log('✅ Password reset successfully!\n');
      console.log('📝 Login Credentials:');
      console.log(`   Email/Phone: ${existingOperator.email} or ${existingOperator.phone}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('📝 Creating new operator...\n');
      
      // Generate unique operator code
      let operatorCode = 'OP001';
      let existingCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
      if (existingCode) {
        let counter = 1;
        while (existingCode) {
          counter++;
          operatorCode = `OP${String(counter).padStart(3, '0')}`;
          existingCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
        }
      }

      const newOperator = await Operator.create({
        name: 'afroj bhai',
        phone: phone,
        email: email.toLowerCase(),
        passwordHash: newPassword,
        operatorCode: operatorCode.toUpperCase(),
        isActive: true,
      });

      console.log('✅ Operator created successfully!\n');
      console.log('📋 Operator Details:');
      console.log(`   Name: ${newOperator.name}`);
      console.log(`   Email: ${newOperator.email}`);
      console.log(`   Phone: ${newOperator.phone}`);
      console.log(`   Operator Code: ${newOperator.operatorCode}`);
      console.log(`   Status: ${newOperator.isActive ? 'Active' : 'Inactive'}`);
      console.log('\n📝 Login Credentials:');
      console.log(`   Email/Phone: ${newOperator.email} or ${newOperator.phone}`);
      console.log(`   Password: ${newPassword}`);
    }

    console.log('\n🔗 Login URL:');
    console.log(`   http://localhost:3000/operator/login`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - operator with this email, phone, or code already exists');
    }
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixOperatorsDB();

