import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Operator from '@/lib/models/Operator';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/operators/[id] - Get single operator
export const GET = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const operator = await Operator.findById(id).select('-passwordHash').lean();

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    // Transform _id to id
    const operatorData = {
      ...operator,
      id: operator._id.toString(),
      _id: operator._id.toString(),
    };

    return NextResponse.json(
      {
        success: true,
        operator: operatorData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get operator error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

// PUT /api/admin/operators/[id] - Update operator
export const PUT = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const operator = await Operator.findById(id);

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, phone, email, password, operatorCode, isActive } = body;

    // Update allowed fields
    if (name !== undefined) operator.name = name;
    if (isActive !== undefined) operator.isActive = isActive;
    
    if (phone !== undefined) {
      // Check if phone is already taken by another operator
      const existingOperator = await Operator.findOne({
        phone: phone,
        _id: { $ne: operator._id },
      });
      if (existingOperator) {
        return NextResponse.json(
          { error: 'Phone number already in use' },
          { status: 400 }
        );
      }
      operator.phone = phone;
    }
    
    if (email !== undefined) {
      // Check if email is already taken by another operator
      const existingOperator = await Operator.findOne({
        email: email.toLowerCase(),
        _id: { $ne: operator._id },
      });
      if (existingOperator) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
      operator.email = email.toLowerCase();
    }
    
    if (operatorCode !== undefined) {
      // Check if operatorCode is already taken by another operator
      const existingOperator = await Operator.findOne({
        operatorCode: operatorCode.toUpperCase(),
        _id: { $ne: operator._id },
      });
      if (existingOperator) {
        return NextResponse.json(
          { error: 'Operator code already in use' },
          { status: 400 }
        );
      }
      operator.operatorCode = operatorCode.toUpperCase();
    }
    
    if (password !== undefined && password.trim() !== '') {
      operator.passwordHash = password; // Will be hashed by pre-save hook
    }

    await operator.save();

    // Return updated operator without password
    const operatorData = {
      id: operator._id.toString(),
      name: operator.name,
      phone: operator.phone,
      email: operator.email,
      operatorCode: operator.operatorCode,
      isActive: operator.isActive,
      createdAt: operator.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        operator: operatorData,
        message: 'Operator updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update operator error:', error);
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

// DELETE /api/admin/operators/[id] - Delete operator
export const DELETE = requireAdmin(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();

    const { id } = await params;
    const operator = await Operator.findById(id);

    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    await operator.deleteOne();

    return NextResponse.json(
      {
        success: true,
        message: 'Operator deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete operator error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

