/**
 * Script to verify agent exists and test login
 * Run: npx ts-node scripts/verify-agent.ts
 */

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Agent from '../lib/models/Agent';

async function verifyAgent() {
  try {
    await connectDB();

    const email = 'rahul@digitalindia.com';
    const phone = '+919876543210';

    console.log('🔍 Checking for agent...\n');

    // Find agent
    const agent = await Agent.findOne({
      $or: [
        { email: email },
        { phone: phone },
      ],
    }).select('+passwordHash');

    if (!agent) {
      console.log('❌ Agent NOT FOUND!');
      console.log('\n📝 Run this command to create/reset agent:');
      console.log('   npm run reset-agent');
      process.exit(1);
    }

    console.log('✅ Agent found!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Name:        ${agent.name}`);
    console.log(`   Email:       ${agent.email}`);
    console.log(`   Phone:       ${agent.phone}`);
    console.log(`   Agent Code:  ${agent.agentCode}`);
    console.log(`   Password Hash: ${agent.passwordHash ? 'Set ✓' : 'Missing ✗'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Test password
    if (agent.passwordHash) {
      const testPassword = 'password123';
      const isValid = await agent.comparePassword(testPassword);
      console.log(`\n🔐 Password Test: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Testing with: "${testPassword}"`);
      
      if (!isValid) {
        console.log('\n⚠️  Password mismatch! Run reset script:');
        console.log('   npm run reset-agent');
      } else {
        console.log('\n✅ Agent is ready for login!');
        console.log('\n📝 Login credentials:');
        console.log(`   Email/Phone: ${agent.email} or ${agent.phone}`);
        console.log(`   Password: password123`);
      }
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyAgent();


