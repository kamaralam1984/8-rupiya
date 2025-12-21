import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AgentLocation from '@/lib/models/AgentLocation';
import Agent from '@/lib/models/Agent';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/admin/agents/live-status
 * Get live status of all agents (online/offline, location, last seen)
 */
export const GET = requireAdmin(async (request: NextRequest) => {
  try {
    await connectDB();

    // Get all agents
    const agents = await Agent.find({})
      .select('_id name agentCode email phone')
      .lean();

    // Get all location records
    const locations = await AgentLocation.find({})
      .populate('agentId', 'name agentCode')
      .lean();

    // Create a map of agentId to location
    const locationMap = new Map();
    locations.forEach((loc: any) => {
      if (loc.agentId) {
        locationMap.set(loc.agentId._id.toString(), loc);
      }
    });

    // Auto-update online status based on lastSeen (5 minutes threshold)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Combine agent data with location data
    const agentsWithStatus = agents.map((agent: any) => {
      const location = locationMap.get(agent._id.toString());
      
      if (!location) {
        return {
          agentId: agent._id.toString(),
          name: agent.name,
          agentCode: agent.agentCode,
          email: agent.email,
          phone: agent.phone,
          isOnline: false,
          location: null,
          lastSeen: null,
          address: null,
          city: null,
          area: null,
          pincode: null,
        };
      }

      // Check if agent is online (last seen within 5 minutes)
      const lastSeen = new Date(location.lastSeen);
      const isOnline = lastSeen > fiveMinutesAgo;

      // Update in database if status changed
      if (location.isOnline !== isOnline) {
        AgentLocation.findByIdAndUpdate(location._id, { isOnline }).catch(() => {
          // Silently fail if update fails
        });
      }

      return {
        agentId: agent._id.toString(),
        name: agent.name,
        agentCode: agent.agentCode,
        email: agent.email,
        phone: agent.phone,
        isOnline,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        lastSeen: location.lastSeen,
        address: location.address || null,
        city: location.city || null,
        area: location.area || null,
        pincode: location.pincode || null,
      };
    });

    return NextResponse.json({
      success: true,
      agents: agentsWithStatus,
      count: agentsWithStatus.length,
      onlineCount: agentsWithStatus.filter((a) => a.isOnline).length,
      offlineCount: agentsWithStatus.filter((a) => !a.isOnline).length,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Get live agent status error:', error);
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get agent status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
});


