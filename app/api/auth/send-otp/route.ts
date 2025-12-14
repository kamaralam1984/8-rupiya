import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import OTP from '@/models/OTP';
import User from '@/models/User';
import { sendOTPEmail } from '@/lib/email';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectDB();

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: jsonError.message },
        { status: 400 }
      );
    }
    
    const { email, type = 'signup' } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if user exists (for login) or doesn't exist (for signup)
    // Skip user check for email-verification type
    let existingUser = null;
    if (type !== 'email-verification') {
      existingUser = await User.findOne({ email: normalizedEmail });

      if (type === 'signup' && existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists. Please login instead.' },
          { status: 409 }
        );
      }

      if (type === 'login' && !existingUser) {
        return NextResponse.json(
          { error: 'No account found with this email. Please signup first.' },
          { status: 404 }
        );
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email and type
    try {
      await OTP.deleteMany({ 
        email: normalizedEmail, 
        type,
        verified: false 
      });
    } catch (deleteError: any) {
      console.error('Error deleting existing OTPs:', deleteError);
      // Continue even if delete fails
    }

    // Create new OTP
    let otpDoc;
    try {
      otpDoc = await OTP.create({
        email: normalizedEmail,
        otp,
        type,
        expiresAt,
        verified: false,
      });
    } catch (createError: any) {
      console.error('Error creating OTP:', createError);
      return NextResponse.json(
        { error: 'Failed to create OTP', details: createError.message },
        { status: 500 }
      );
    }

    // Get user name if exists (for personalized email)
    const userName = existingUser?.name;

    // Send OTP email
    try {
      await sendOTPEmail({
        email: normalizedEmail,
        otp,
        name: userName,
        type,
      });
    } catch (emailError: any) {
      // Delete OTP if email fails
      await OTP.findByIdAndDelete(otpDoc._id);
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please check your email service configuration.', details: emailError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent successfully to your email',
        expiresIn: 600, // 10 minutes in seconds
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Send OTP error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);

    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let errorDetails = error.message;

    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error';
      errorDetails = Object.values(error.errors || {}).map((err: any) => err.message).join(', ');
    } else if (error.code === 11000) {
      errorMessage = 'Duplicate entry error';
      errorDetails = 'An OTP already exists for this email';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}

