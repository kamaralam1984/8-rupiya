import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Agent from '@/lib/models/Agent';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/agents - List all agents
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build search query
    const searchQuery: any = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { agentCode: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Agent.countDocuments(searchQuery);

    // Get agents
    const agents = await Agent.find(searchQuery)
      .select('-passwordHash') // Don't return password hash
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform _id to id for frontend compatibility
    const transformedAgents = agents.map((agent: any) => ({
      ...agent,
      id: agent._id.toString(),
      _id: agent._id.toString(),
    }));

    return NextResponse.json(
      {
        success: true,
        agents: transformedAgents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

// POST /api/admin/agents - Create new agent
export const POST = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    const body = await request.json();
    const { name, phone, email, password, agentCode, agentPanelText, agentPanelTextColor } = body;

    // Validation
    if (!name || !phone || !email || !password || !agentCode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if agent already exists
    const existingAgent = await Agent.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone },
        { agentCode: agentCode.toUpperCase() },
      ],
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent with this email, phone, or agent code already exists' },
        { status: 400 }
      );
    }

    // Create agent
    const agent = await Agent.create({
      name,
      phone,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      agentCode: agentCode.toUpperCase(),
      agentPanelText: agentPanelText || '',
      agentPanelTextColor: agentPanelTextColor || 'black',
      totalShops: 0,
      totalEarnings: 0,
    });

    // Return agent without password
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
        message: 'Agent created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create agent error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Agent with this email, phone, or agent code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});


