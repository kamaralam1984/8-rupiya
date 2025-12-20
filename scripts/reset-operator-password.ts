/**
 * Script to find and reset operator password
 * Run: npx tsx scripts/reset-operator-password.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Operator from '../lib/models/Operator';

async function resetOperatorPassword() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const email = 'afrojkai4@gmail.com';
    const phone = '3234567876';
    const newPassword = '123456';

    // Find operator by email or phone
    const operator = await Operator.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone },
      ],
    }).select('+passwordHash');

    if (!operator) {
      console.log('❌ Operator not found!');
      console.log(`   Searched for email: ${email} or phone: ${phone}`);
      console.log('\n💡 Creating new operator...\n');
      
      // Create new operator
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
        passwordHash: newPassword, // Will be hashed by pre-save hook
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
      console.log('\n🔗 Login URL:');
      console.log(`   http://localhost:3000/operator/login`);
    } else {
      console.log('✅ Operator found!\n');
      console.log('📋 Current Operator Details:');
      console.log(`   Name: ${operator.name}`);
      console.log(`   Email: ${operator.email}`);
      console.log(`   Phone: ${operator.phone}`);
      console.log(`   Operator Code: ${operator.operatorCode}`);
      console.log(`   Status: ${operator.isActive ? 'Active' : 'Inactive'}`);
      
      // Reset password
      console.log('\n🔐 Resetting password...');
      operator.passwordHash = newPassword; // Will be hashed by pre-save hook
      operator.isActive = true; // Ensure it's active
      await operator.save();
      
      console.log('✅ Password reset successfully!\n');
      console.log('📝 Login Credentials:');
      console.log(`   Email/Phone: ${operator.email} or ${operator.phone}`);
      console.log(`   Password: ${newPassword}`);
      console.log('\n🔗 Login URL:');
      console.log(`   http://localhost:3000/operator/login`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - operator with this email, phone, or code already exists');
      console.error('\n💡 Try deleting the existing operator first or use a different email/phone/code');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetOperatorPassword();




