/**
 * Script to reset agent password or create new agent
 * Run: npx ts-node scripts/reset-agent-password.ts
 */

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Agent from '../lib/models/Agent';
import bcrypt from 'bcryptjs';

async function resetAgentPassword() {
  try {
    await connectDB();

    const email = 'rahul@digitalindia.com';
    const phone = '+919876543210';
    const newPassword = 'password123';

    // Find existing agent
    let agent = await Agent.findOne({
      $or: [
        { email: email },
        { phone: phone },
      ],
    });

    if (agent) {
      console.log('📝 Found existing agent, resetting password...');
      
      // Reset password
      agent.passwordHash = newPassword; // Will be hashed by pre-save hook
      await agent.save();
      
      console.log('✅ Password reset successfully!');
      console.log(`   Email: ${agent.email}`);
      console.log(`   Phone: ${agent.phone}`);
      console.log(`   Agent Code: ${agent.agentCode}`);
      console.log(`   New Password: ${newPassword}`);
    } else {
      console.log('📝 Agent not found, creating new agent...');
      
      // Create new agent
      agent = await Agent.create({
        name: 'Rahul Kumar',
        phone: phone,
        email: email,
        passwordHash: newPassword, // Will be hashed by pre-save hook
        agentCode: 'AG001',
        totalShops: 0,
        totalEarnings: 0,
      });
      
      console.log('✅ Agent created successfully!');
      console.log(`   Name: ${agent.name}`);
      console.log(`   Email: ${agent.email}`);
      console.log(`   Phone: ${agent.phone}`);
      console.log(`   Agent Code: ${agent.agentCode}`);
      console.log(`   Password: ${newPassword}`);
    }

    console.log('\n📝 Login credentials:');
    console.log(`   Email/Phone: ${agent.email} or ${agent.phone}`);
    console.log(`   Password: ${newPassword}`);
    console.log('\n🔗 Login URL: http://localhost:3000/agent/login');

    // Verify password works
    const testAgent = await Agent.findOne({ email: agent.email }).select('+passwordHash');
    if (testAgent) {
      const isValid = await testAgent.comparePassword(newPassword);
      console.log(`\n✅ Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error - agent with this email/phone/code already exists');
    }
    process.exit(1);
  }
}

resetAgentPassword();


