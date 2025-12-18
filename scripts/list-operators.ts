/**
 * Script to list all operators and check database indexes
 * Run: npx tsx scripts/list-operators.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Operator from '../lib/models/Operator';

async function listOperators() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // List all operators
    const operators = await Operator.find({}).select('+passwordHash');
    console.log(`📊 Total operators: ${operators.length}\n`);

    if (operators.length > 0) {
      console.log('👥 Operators List:');
      operators.forEach((op, index) => {
        console.log(`\n${index + 1}. ${op.name}`);
        console.log(`   Email: ${op.email}`);
        console.log(`   Phone: ${op.phone}`);
        console.log(`   Code: ${op.operatorCode}`);
        console.log(`   Active: ${op.isActive}`);
        console.log(`   ID: ${op._id}`);
      });
    } else {
      console.log('⚠️  No operators found in database');
    }

    // Check indexes
    console.log('\n📑 Checking database indexes...');
    const collection = mongoose.connection.db?.collection('operators');
    if (collection) {
      const indexes = await collection.indexes();
      console.log(`\n📋 Indexes on operators collection:`);
      indexes.forEach((index: any) => {
        console.log(`   ${JSON.stringify(index)}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listOperators();



