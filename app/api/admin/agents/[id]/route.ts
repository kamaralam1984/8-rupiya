import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import AgentShop from '@/lib/models/AgentShop';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/agents/[id] - Get single agent
export const GET = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const agent = await Agent.findById(id).select('-passwordHash');

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get agent stats
    const totalShops = await AgentShop.countDocuments({ agentId: agent._id });
    const paidShops = await AgentShop.countDocuments({
      agentId: agent._id,
      paymentStatus: 'PAID',
    });

    const agentData = {
      id: agent._id.toString(),
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      agentCode: agent.agentCode,
      agentPanelText: agent.agentPanelText,
      agentPanelTextColor: agent.agentPanelTextColor,
      totalShops: agent.totalShops,
      totalEarnings: agent.totalEarnings,
      createdAt: agent.createdAt,
      stats: {
        totalShops,
        paidShops,
        pendingShops: totalShops - paidShops,
      },
    };

    return NextResponse.json(
      {
        success: true,
        agent: agentData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/admin/agents/[id] - Update agent
export const PUT = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const agent = await Agent.findById(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, phone, email, password, agentCode, agentPanelText, agentPanelTextColor } = body;

    // Update allowed fields
    if (name !== undefined) agent.name = name;
    if (agentPanelText !== undefined) agent.agentPanelText = agentPanelText;
    if (agentPanelTextColor !== undefined) agent.agentPanelTextColor = agentPanelTextColor;
    if (phone !== undefined) {
      // Check if phone is already taken by another agent
      const existingAgent = await Agent.findOne({
        phone: phone,
        _id: { $ne: agent._id },
      });
      if (existingAgent) {
        return NextResponse.json(
          { error: 'Phone number already in use' },
          { status: 400 }
        );
      }
      agent.phone = phone;
    }
    if (email !== undefined) {
      // Check if email is already taken by another agent
      const existingAgent = await Agent.findOne({
        email: email.toLowerCase(),
        _id: { $ne: agent._id },
      });
      if (existingAgent) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      agent.email = email.toLowerCase();
    }
    if (agentCode !== undefined) {
      // Check if agentCode is already taken by another agent
      const existingAgent = await Agent.findOne({
        agentCode: agentCode.toUpperCase(),
        _id: { $ne: agent._id },
      });
      if (existingAgent) {
        return NextResponse.json(
          { error: 'Agent code already in use' },
          { status: 400 }
        );
      }
      agent.agentCode = agentCode.toUpperCase();
    }
    if (password !== undefined && password.trim() !== '') {
      agent.passwordHash = password; // Will be hashed by pre-save hook
    }

    await agent.save();

    // Return updated agent without password
    const agentData = {
      id: agent._id.toString(),
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      agentCode: agent.agentCode,
      agentPanelText: agent.agentPanelText,
      agentPanelTextColor: agent.agentPanelTextColor,
      totalShops: agent.totalShops,
      totalEarnings: agent.totalEarnings,
      createdAt: agent.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        agent: agentData,
        message: 'Agent updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update agent error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Duplicate field value' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/agents/[id] - Delete agent
export const DELETE = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const agent = await Agent.findById(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if agent has shops
    const shopCount = await AgentShop.countDocuments({ agentId: agent._id });
    
    // Allow deletion even if agent has shops
    // Shops will remain in the system but agent reference will be removed
    if (shopCount > 0) {
      // Optionally: Remove agent reference from shops (set agentId to null)
      // Or keep shops with agentId for historical records
      // For now, we'll keep shops with agentId for historical tracking
      console.log(`Warning: Deleting agent with ${shopCount} shop(s). Shops will remain in system.`);
    }

    // Delete the agent
    await Agent.findByIdAndDelete(id);

    // Optional: If you want to remove agent reference from shops, uncomment below:
    // if (shopCount > 0) {
    //   await AgentShop.updateMany(
    //     { agentId: agent._id },
    //     { $unset: { agentId: 1 } }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        message: shopCount > 0 
          ? `Agent deleted successfully. ${shopCount} shop(s) remain in the system.`
          : 'Agent deleted successfully',
        deletedShops: shopCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});


