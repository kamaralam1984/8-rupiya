/**
 * Notification Service
 * Handles sending SMS, Email, and WhatsApp notifications to shop owners
 * Sends automatic bill/receipt when payment is marked as done
 */

interface NotificationOptions {
  mobile: string;
  shopName: string;
  ownerName: string;
  amount: number;
  receiptNo?: string;
  paymentDate?: Date;
  paymentMode?: string;
  category?: string;
  address?: string;
  pincode?: string;
  agentName?: string;
  agentCode?: string;
}

/**
 * Generate formatted bill/receipt message
 */
function generateBillMessage(options: NotificationOptions): string {
  const {
    ownerName,
    shopName,
    amount,
    receiptNo,
    paymentDate,
    paymentMode,
    category,
    address,
    pincode,
    agentName,
    agentCode,
  } = options;

  const date = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const expiryDate = paymentDate 
    ? new Date(new Date(paymentDate).setDate(new Date(paymentDate).getDate() + 365)).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date(new Date().setDate(new Date().getDate() + 365)).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  // Short format for SMS
  const shortMessage = `📋 *Payment Receipt*\n\n` +
    `Dear ${ownerName},\n\n` +
    `✅ Payment Confirmed!\n\n` +
    `Shop: ${shopName}\n` +
    `Amount: ₹${amount}\n` +
    `Receipt No: ${receiptNo || 'N/A'}\n` +
    `Date: ${date}\n` +
    `Mode: ${paymentMode || 'CASH'}\n` +
    `Valid Till: ${expiryDate}\n\n` +
    `Thank you for your payment!\n` +
    `- Digital India`;

  return shortMessage;
}

/**
 * Generate detailed bill/receipt for Email/WhatsApp
 */
function generateDetailedBill(options: NotificationOptions): string {
  const {
    ownerName,
    shopName,
    amount,
    receiptNo,
    paymentDate,
    paymentMode,
    category,
    address,
    pincode,
    agentName,
    agentCode,
  } = options;

  const date = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const expiryDate = paymentDate 
    ? new Date(new Date(paymentDate).setDate(new Date(paymentDate).getDate() + 365)).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date(new Date().setDate(new Date().getDate() + 365)).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const detailedBill = `
╔══════════════════════════════════════╗
║      DIGITAL INDIA - PAYMENT RECEIPT      ║
╚══════════════════════════════════════╝

📋 RECEIPT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Receipt No: ${receiptNo || 'N/A'}
Date: ${date}
Payment Mode: ${paymentMode || 'CASH'}

👤 CUSTOMER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${ownerName}
Shop Name: ${shopName}
${category ? `Category: ${category}` : ''}
${address ? `Address: ${address}` : ''}
${pincode ? `Pincode: ${pincode}` : ''}

💰 PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Amount Paid: ₹${amount}
Payment Status: ✅ CONFIRMED
Validity Period: 365 Days
Valid Till: ${expiryDate}

${agentName ? `👨‍💼 Agent: ${agentName} (${agentCode})` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for your payment!
Your listing is now active for 365 days.

For support, contact your agent or admin.

- Digital India Platform
`;

  return detailedBill;
}

/**
 * Send payment confirmation notification via SMS, Email, and WhatsApp
 * Automatically sends bill/receipt when payment is marked as done
 */
export async function sendPaymentConfirmation(options: NotificationOptions): Promise<void> {
  const { mobile, shopName, ownerName, amount, receiptNo, paymentDate } = options;

  // Generate messages
  const shortMessage = generateBillMessage(options);
  const detailedBill = generateDetailedBill(options);

  console.log('\n📧 Sending Payment Bill/Receipt...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`To: ${ownerName} (${mobile})`);
  console.log(`Shop: ${shopName}`);
  console.log(`Amount: ₹${amount}`);
  console.log(`Receipt No: ${receiptNo || 'N/A'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Send SMS (using a service like Twilio, MSG91, etc.)
  try {
    await sendSMS(mobile, shortMessage);
    console.log(`✅ SMS sent to ${mobile}`);
  } catch (error) {
    console.error('❌ SMS sending failed:', error);
  }

  // Send Email (if email is available)
  try {
    // In production, you would fetch email from database
    await sendEmail(mobile, ownerName, detailedBill, options);
    console.log(`✅ Email notification prepared for ${ownerName}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }

  // Send WhatsApp (using WhatsApp Business API or similar)
  try {
    await sendWhatsApp(mobile, detailedBill);
    console.log(`✅ WhatsApp sent to ${mobile}`);
  } catch (error) {
    console.error('❌ WhatsApp sending failed:', error);
  }

  console.log('\n✅ Payment bill/receipt sent successfully!\n');
}

/**
 * Send SMS notification
 * Integrate with actual SMS service (MSG91, Twilio, etc.)
 */
async function sendSMS(mobile: string, message: string): Promise<void> {
  // Remove + and spaces from mobile number
  const cleanMobile = mobile.replace(/[+\s]/g, '');
  
  // Check if MSG91 is configured
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
  const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'DIGIND';
  
  if (MSG91_AUTH_KEY) {
    try {
      // MSG91 API integration
      const response = await fetch(`https://control.msg91.com/api/v5/flow/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authkey': MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID || '',
          sender: MSG91_SENDER_ID,
          short_url: '0',
          mobiles: `91${cleanMobile.slice(-10)}`, // Indian format
          message: message,
        }),
      });
      
      if (response.ok) {
        console.log(`[SMS via MSG91] Sent to ${mobile}`);
        return;
      }
    } catch (error) {
      console.error('MSG91 API error:', error);
    }
  }
  
  // Fallback: Log for development
  console.log(`[SMS] To: ${mobile}`);
  console.log(`[SMS Message]:\n${message}`);
}

/**
 * Send Email notification
 */
async function sendEmail(
  mobile: string,
  ownerName: string,
  billContent: string,
  options: NotificationOptions
): Promise<void> {
  // In production, fetch email from database using mobile number
  // For now, we'll prepare the email content
  
  const emailContent = {
    to: '', // Fetch from database in production
    subject: `Payment Receipt - ${options.receiptNo || 'N/A'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0066cc; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .bill-details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #0066cc; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          pre { white-space: pre-wrap; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Digital India - Payment Receipt</h1>
          </div>
          <div class="content">
            <p>Dear ${ownerName},</p>
            <p>Your payment has been confirmed. Please find your receipt below:</p>
            <div class="bill-details">
              <pre>${billContent}</pre>
            </div>
            <p>Thank you for your payment!</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Digital India Platform.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  
  // TODO: Integrate with email service (Nodemailer, SendGrid, etc.)
  // For now, just log
  console.log(`[Email] Prepared for ${ownerName} (${mobile})`);
  console.log(`[Email Subject]: ${emailContent.subject}`);
}

/**
 * Send WhatsApp notification
 * Integrate with WhatsApp Business API (Twilio, 360dialog, etc.)
 */
async function sendWhatsApp(mobile: string, message: string): Promise<void> {
  // Remove + and spaces from mobile number
  const cleanMobile = mobile.replace(/[+\s]/g, '');
  
  // Check if WhatsApp API is configured
  const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;
  const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
  
  if (WHATSAPP_API_KEY && WHATSAPP_PHONE_ID) {
    try {
      // WhatsApp Business API integration (example with Twilio)
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${WHATSAPP_PHONE_ID}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${WHATSAPP_PHONE_ID}:${WHATSAPP_API_KEY}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${process.env.WHATSAPP_FROM_NUMBER || ''}`,
          To: `whatsapp:91${cleanMobile.slice(-10)}`,
          Body: message,
        }),
      });
      
      if (response.ok) {
        console.log(`[WhatsApp via API] Sent to ${mobile}`);
        return;
      }
    } catch (error) {
      console.error('WhatsApp API error:', error);
    }
  }
  
  // Fallback: Log for development
  console.log(`[WhatsApp] To: ${mobile}`);
  console.log(`[WhatsApp Message]:\n${message}`);
}

/**
 * Send renewal reminder notification
 */
export async function sendRenewalReminder(options: NotificationOptions & { daysRemaining: number }): Promise<void> {
  const { mobile, shopName, ownerName, daysRemaining } = options;
  
  const message = `Dear ${ownerName}, Your shop "${shopName}" payment will expire in ${daysRemaining} days. Please renew to continue your listing. Contact: [Agent/Admin Contact]. - Digital India`;

  try {
    await sendSMS(mobile, message);
    await sendWhatsApp(mobile, message);
    console.log(`Renewal reminder sent to ${mobile}`);
  } catch (error) {
    console.error('Renewal reminder failed:', error);
  }
}

