import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAdmin } from '@/lib/auth';
import Message from '@/models/Message';

// GET - Get single message
export const GET = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;
    const message = await Message.findById(id).lean();
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ success: true, message }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch message', details: error.message }, { status: 500 });
  }
});

// PATCH - Update message status
export const PATCH = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['new', 'read', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const message = await Message.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ success: true, message }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update message', details: error.message }, { status: 500 });
  }
});

// DELETE - Delete message
export const DELETE = requireAdmin(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    await connectDB();
    const { id } = await params;
    const message = await Message.findByIdAndDelete(id);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Message deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete message', details: error.message }, { status: 500 });
  }
});

