import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Operator from '@/lib/models/Operator';
import { generateOperatorToken } from '@/lib/utils/operatorAuth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { identifier, password } = body; // identifier can be email or phone

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      );
    }

    // Normalize identifier
    const normalizedIdentifier = identifier.toLowerCase().trim();
    
    // Find operator by email or phone
    const operator = await Operator.findOne({
      $or: [
        { email: normalizedIdentifier },
        { phone: identifier.trim() },
      ],
      isActive: true, // Only allow active operators
    }).select('+passwordHash'); // Include password hash

    if (!operator) {
      console.error('Operator not found for identifier:', identifier);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await operator.comparePassword(password);
    if (!isPasswordValid) {
      console.error('Password mismatch for operator:', operator.email);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateOperatorToken({
      operatorId: operator._id.toString(),
      operatorCode: operator.operatorCode,
      email: operator.email,
    });

    // Return operator data (without password)
    const operatorData = {
      id: operator._id.toString(),
      name: operator.name,
      phone: operator.phone,
      email: operator.email,
      operatorCode: operator.operatorCode,
    };

    return NextResponse.json(
      {
        success: true,
        token,
        operator: operatorData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Operator login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

