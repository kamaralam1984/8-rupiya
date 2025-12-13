import nodemailer from 'nodemailer';

// Get email configuration from environment variables
const EMAIL_ID = process.env.Email_id || process.env.EMAIL_ID;
const EMAIL_PASSWORD = process.env.Password || process.env.EMAIL_PASSWORD;
const EMAIL_NAME = process.env.name || process.env.EMAIL_NAME || '8 Rupeess';

if (!EMAIL_ID || !EMAIL_PASSWORD) {
  console.warn('⚠️  Email credentials not configured. OTP emails will not be sent.');
}

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to 'outlook', 'yahoo', etc.
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_PASSWORD,
  },
});

// For other email providers (SMTP), use this configuration:
/*
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: EMAIL_ID,
    pass: EMAIL_PASSWORD,
  },
});
*/

export interface SendOTPEmailOptions {
  email: string;
  otp: string;
  name?: string;
  type?: 'signup' | 'login' | 'reset' | 'email-verification';
}

export async function sendOTPEmail({ email, otp, name, type = 'signup' }: SendOTPEmailOptions): Promise<void> {
  if (!EMAIL_ID || !EMAIL_PASSWORD) {
    console.error('❌ Email service not configured. EMAIL_ID:', !!EMAIL_ID, 'EMAIL_PASSWORD:', !!EMAIL_PASSWORD);
    throw new Error('Email service not configured. Please set Email_id and Password in .env.local');
  }

  const subject = type === 'signup' 
    ? `Verify Your Email - ${EMAIL_NAME}`
    : type === 'login'
    ? `Login OTP - ${EMAIL_NAME}`
    : type === 'email-verification'
    ? `Email Verification OTP - ${EMAIL_NAME}`
    : `Reset Password OTP - ${EMAIL_NAME}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 20px;">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${EMAIL_NAME}</h1>
                  <div style="width: 60px; height: 4px; background-color: rgba(255, 255, 255, 0.5); margin: 15px auto 0; border-radius: 2px;"></div>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                    ${type === 'signup' ? '🎉 Welcome to ' + EMAIL_NAME + '!' : type === 'login' ? '🔐 Login Request' : type === 'email-verification' ? '📧 Email Verification' : '🔑 Password Reset'}
                  </h2>
                  
                  ${name ? `<p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px;">Hello <strong>${name}</strong>,</p>` : '<p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px;">Hello,</p>'}
                  
                  <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                    ${type === 'signup' 
                      ? 'Thank you for joining us! Please use the verification code below to complete your registration:'
                      : type === 'login'
                      ? 'We received a login request for your account. Use the code below to complete your login:'
                      : type === 'email-verification'
                      ? 'Please use the verification code below to verify your email address:'
                      : 'We received a password reset request. Use the code below to reset your password:'}
                  </p>
                  
                  <!-- OTP Box -->
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td align="center" style="padding: 0;">
                        <div style="background: linear-gradient(135deg, #f6f8fb 0%, #ffffff 100%); border: 3px solid #e2e8f0; border-radius: 16px; padding: 35px 25px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);">
                          <div style="font-size: 42px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', 'Monaco', monospace; text-align: center; line-height: 1.2; white-space: nowrap;">
                            ${otp}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Box -->
                  <div style="background-color: #edf2f7; border-left: 4px solid #667eea; padding: 15px 20px; border-radius: 6px; margin: 25px 0;">
                    <p style="color: #2d3748; margin: 0; font-size: 14px; line-height: 1.5;">
                      <strong>⏱️ Valid for 10 minutes</strong><br>
                      <span style="color: #718096;">This code will expire in 10 minutes. Please do not share this code with anyone.</span>
                    </p>
                  </div>
                  
                  <p style="color: #718096; margin: 30px 0 0 0; font-size: 14px; line-height: 1.6;">
                    If you didn't request this ${type === 'signup' ? 'verification' : type === 'login' ? 'login' : type === 'email-verification' ? 'email verification' : 'password reset'}, you can safely ignore this email. Your account remains secure.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #a0aec0; margin: 0 0 10px 0; font-size: 13px;">
                    © ${new Date().getFullYear()} ${EMAIL_NAME}. All rights reserved.
                  </p>
                  <p style="color: #cbd5e0; margin: 0; font-size: 12px;">
                    This is an automated email. Please do not reply to this message.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const text = `
${EMAIL_NAME}

${type === 'signup' ? '🎉 Welcome!' : type === 'login' ? '🔐 Login Request' : type === 'email-verification' ? '📧 Email Verification' : '🔑 Password Reset'}

${name ? `Hello ${name},` : 'Hello,'}

${type === 'signup' 
  ? 'Thank you for joining us! Please use the verification code below to complete your registration:'
  : type === 'login'
  ? 'We received a login request for your account. Use the code below to complete your login:'
  : type === 'email-verification'
  ? 'Please use the verification code below to verify your email address:'
  : 'We received a password reset request. Use the code below to reset your password:'}

Your Verification Code: ${otp}

⏱️ This code will expire in 10 minutes.
🔒 Please do not share this code with anyone.

If you didn't request this ${type === 'signup' ? 'verification' : type === 'login' ? 'login' : type === 'email-verification' ? 'email verification' : 'password reset'}, you can safely ignore this email. Your account remains secure.

© ${new Date().getFullYear()} ${EMAIL_NAME}. All rights reserved.
This is an automated email. Please do not reply to this message.
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${EMAIL_NAME}" <${EMAIL_ID}>`,
      to: email,
      subject,
      text,
      html,
    });

    console.log('✅ OTP email sent:', info.messageId);
  } catch (error: any) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
}

// Test email configuration
export async function testEmailConnection(): Promise<boolean> {
  if (!EMAIL_ID || !EMAIL_PASSWORD) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
}

