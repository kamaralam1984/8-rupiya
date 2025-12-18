import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Operator from '@/lib/models/Operator';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/operators - List all operators
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
        { operatorCode: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await Operator.countDocuments(searchQuery);

    // Get operators
    const operators = await Operator.find(searchQuery)
      .select('-passwordHash') // Don't return password hash
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Transform _id to id for frontend compatibility
    const transformedOperators = operators.map((operator: any) => ({
      ...operator,
      id: operator._id.toString(),
      _id: operator._id.toString(),
    }));

    return NextResponse.json(
      {
        success: true,
        operators: transformedOperators,
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
    console.error('Get operators error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

// POST /api/admin/operators - Create new operator
export const POST = requireAdmin(async (request: NextRequest) => {
  // Store body values for error handling
  let email = '';
  let phone = '';
  let operatorCode = '';
  
  try {
    await connectDB();

    const body = await request.json();
    const { name, phone: phoneValue, email: emailValue, password, operatorCode: operatorCodeValue } = body;
    
    // Store values for error handling
    email = emailValue || '';
    phone = phoneValue || '';
    operatorCode = operatorCodeValue || '';

    // Validation
    if (!name || !phone || !email || !password || !operatorCode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if operator already exists - check each field separately for specific error messages
    const existingByEmail = await Operator.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
      return NextResponse.json(
        { error: `Operator with email "${email}" already exists` },
        { status: 400 }
      );
    }

    const existingByPhone = await Operator.findOne({ phone: phone });
    if (existingByPhone) {
      return NextResponse.json(
        { error: `Operator with phone "${phone}" already exists` },
        { status: 400 }
      );
    }

    const existingByCode = await Operator.findOne({ operatorCode: operatorCode.toUpperCase() });
    if (existingByCode) {
      return NextResponse.json(
        { error: `Operator with code "${operatorCode.toUpperCase()}" already exists` },
        { status: 400 }
      );
    }

    // Create operator
    const operator = await Operator.create({
      name,
      phone,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      operatorCode: operatorCode.toUpperCase(),
      isActive: true,
    });

    // Return operator without password
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
        message: 'Operator created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create operator error:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error - extract the field name from error message
      const errorMessage = error.message || '';
      let specificError = 'Operator with this email, phone, or operator code already exists';
      
      if (errorMessage.includes('email')) {
        specificError = `Operator with email "${email}" already exists`;
      } else if (errorMessage.includes('phone')) {
        specificError = `Operator with phone "${phone}" already exists`;
      } else if (errorMessage.includes('operatorCode')) {
        specificError = `Operator with code "${operatorCode.toUpperCase()}" already exists`;
      }
      
      return NextResponse.json(
        { error: specificError },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
});

