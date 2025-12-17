/**
 * Script to check payment gateway configuration
 * Run: npx ts-node scripts/check-payment-config.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

console.log('🔍 Checking Payment Gateway Configuration...\n');
console.log('═'.repeat(80));

// Check Razorpay Configuration
console.log('\n📦 RAZORPAY Configuration:');
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (razorpayKeyId) {
  console.log(`   ✅ RAZORPAY_KEY_ID: ${razorpayKeyId.substring(0, 10)}...`);
} else {
  console.log(`   ❌ RAZORPAY_KEY_ID: NOT SET`);
}

if (razorpayKeySecret) {
  console.log(`   ✅ RAZORPAY_KEY_SECRET: ${razorpayKeySecret.substring(0, 10)}...`);
} else {
  console.log(`   ❌ RAZORPAY_KEY_SECRET: NOT SET`);
}

if (razorpayWebhookSecret) {
  console.log(`   ✅ RAZORPAY_WEBHOOK_SECRET: ${razorpayWebhookSecret.substring(0, 10)}...`);
} else {
  console.log(`   ⚠️  RAZORPAY_WEBHOOK_SECRET: NOT SET (optional for testing)`);
}

// Check PhonePe Configuration
console.log('\n📦 PHONEPE Configuration:');
const phonepeMerchantId = process.env.PHONEPE_MERCHANT_ID;
const phonepeSaltKey = process.env.PHONEPE_SALT_KEY;
const phonepeSaltIndex = process.env.PHONEPE_SALT_INDEX;
const phonepeApiEndpoint = process.env.PHONEPE_API_ENDPOINT;

if (phonepeMerchantId) {
  console.log(`   ✅ PHONEPE_MERCHANT_ID: ${phonepeMerchantId.substring(0, 10)}...`);
} else {
  console.log(`   ❌ PHONEPE_MERCHANT_ID: NOT SET`);
}

if (phonepeSaltKey) {
  console.log(`   ✅ PHONEPE_SALT_KEY: ${phonepeSaltKey.substring(0, 10)}...`);
} else {
  console.log(`   ❌ PHONEPE_SALT_KEY: NOT SET`);
}

if (phonepeSaltIndex) {
  console.log(`   ✅ PHONEPE_SALT_INDEX: ${phonepeSaltIndex}`);
} else {
  console.log(`   ⚠️  PHONEPE_SALT_INDEX: NOT SET (defaults to 1)`);
}

if (phonepeApiEndpoint) {
  console.log(`   ✅ PHONEPE_API_ENDPOINT: ${phonepeApiEndpoint}`);
} else {
  console.log(`   ⚠️  PHONEPE_API_ENDPOINT: NOT SET (will use default)`);
}

// Check Base URL
console.log('\n📦 BASE URL Configuration:');
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
if (baseUrl) {
  console.log(`   ✅ NEXT_PUBLIC_BASE_URL: ${baseUrl}`);
} else {
  console.log(`   ⚠️  NEXT_PUBLIC_BASE_URL: NOT SET (will use request origin)`);
}

// Summary
console.log('\n' + '═'.repeat(80));
console.log('\n📊 Summary:\n');

const razorpayConfigured = razorpayKeyId && razorpayKeySecret;
const phonepeConfigured = phonepeMerchantId && phonepeSaltKey;

if (razorpayConfigured) {
  console.log('   ✅ Razorpay: CONFIGURED');
} else {
  console.log('   ❌ Razorpay: NOT CONFIGURED');
  console.log('      → Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local');
}

if (phonepeConfigured) {
  console.log('   ✅ PhonePe: CONFIGURED');
} else {
  console.log('   ❌ PhonePe: NOT CONFIGURED');
  console.log('      → Add PHONEPE_MERCHANT_ID, PHONEPE_SALT_KEY to .env.local');
}

if (!razorpayConfigured && !phonepeConfigured) {
  console.log('\n⚠️  WARNING: No payment gateway is configured!');
  console.log('   Payment functionality will not work until at least one gateway is configured.\n');
} else {
  console.log('\n✅ At least one payment gateway is configured.\n');
}

console.log('💡 To configure payment gateways:');
console.log('   1. Add credentials to .env.local file');
console.log('   2. Restart your development server');
console.log('   3. Test payment flow\n');


