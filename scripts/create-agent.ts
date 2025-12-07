/**
 * Script to create a sample agent for testing
 * Run: npx ts-node scripts/create-agent.ts
 */

import mongoose from 'mongoose';
import connectDB from '../lib/mongodb';
import Agent from '../lib/models/Agent';

async function createAgent() {
  try {
    await connectDB();

    // Sample agent data
    const agentData = {
      name: 'Rahul Kumar',
      phone: '+919876543210',
      email: 'rahul@digitalindia.com',
      passwordHash: 'password123', // Will be hashed automatically by pre-save hook
      agentCode: 'AG001',
      totalShops: 0,
      totalEarnings: 0,
    };

    // Check if agent already exists
    const existingAgent = await Agent.findOne({
      $or: [
        { email: agentData.email },
        { phone: agentData.phone },
        { agentCode: agentData.agentCode },
      ],
    });

    if (existingAgent) {
      console.log('⚠️  Agent already exists:');
      console.log(`   Name: ${existingAgent.name}`);
      console.log(`   Email: ${existingAgent.email}`);
      console.log(`   Agent Code: ${existingAgent.agentCode}`);
      console.log(`   Password: password123`);
      process.exit(0);
    }

    // Create agent
    const agent = await Agent.create(agentData);

    console.log('✅ Agent created successfully!');
    console.log(`   Name: ${agent.name}`);
    console.log(`   Email: ${agent.email}`);
    console.log(`   Phone: ${agent.phone}`);
    console.log(`   Agent Code: ${agent.agentCode}`);
    console.log(`   Password: password123`);
    console.log('\n📝 Login credentials:');
    console.log(`   Email/Phone: ${agent.email} or ${agent.phone}`);
    console.log(`   Password: password123`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating agent:', error.message);
    process.exit(1);
  }
}

createAgent();

