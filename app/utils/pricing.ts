/**
 * Pricing Plans Configuration
 * Based on Digital India Business Plan
 */

export const PRICING_PLANS = {
  BASIC: {
    name: 'Basic Plan',
    amount: 100, // ₹100/year
    agentCommission: 20, // ₹20 (20% of ₹100)
    companyProfit: 80, // ₹80
    features: [
      'Shop Name',
      'Owner Name',
      'Address + Pincode',
      'Mobile Number',
      '1 Shop Photo',
      'Category',
      'Location (Lat/Long)',
      'Digital India Website Profile',
    ],
    maxPhotos: 1,
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    priorityRank: 0,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  PREMIUM: {
    name: 'Premium Plan',
    amount: 2999, // ₹2999/year
    agentCommission: 600, // ₹600 (20% of ₹2999)
    companyProfit: 2399, // ₹2399
    features: [
      'All Basic Plan Features',
      'Unlimited Photos',
      'Offers/Discount Section',
      'WhatsApp Button',
      'Shop Logo',
      'Priority Ranking',
      'Category Top Position',
    ],
    maxPhotos: 10, // 10 photos (optional, 1 se 10 tak)
    hasOffers: true,
    hasWhatsApp: true,
    hasLogo: true,
    priorityRank: 10,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  FEATURED: {
    name: 'Featured Plan',
    amount: 2388, // ₹199 * 12 = ₹2388/year (minimum ₹2388)
    agentCommission: 478, // ₹478 (20% of ₹2388)
    companyProfit: 1910, // ₹1910
    features: [
      'All Premium Plan Features',
      'Home Page Banner',
      'Top Slider Image',
      'District-wide Promotion',
      'Special Category Highlight',
      'Maximum Priority Ranking',
    ],
    maxPhotos: 10, // 10 photos (optional, 1 se 10 tak)
    hasOffers: true,
    hasWhatsApp: true,
    hasLogo: true,
    priorityRank: 100,
    canBeHomePageBanner: true,
    canBeTopSlider: true,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  LEFT_BAR: {
    name: 'Left Bar Plan',
    amount: 3588, // ₹299 * 12 = ₹3588/year
    agentCommission: 718, // ₹718 (20% of ₹3588)
    companyProfit: 2870, // ₹2870
    features: [
      'All Basic Plan Features',
      'Left Sidebar Advertisement',
      'High Visibility',
      'Priority Display',
    ],
    maxPhotos: 10, // 10 photos (optional, 1 se 10 tak)
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    priorityRank: 30,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: true,
    canBeRightBar: false,
    canBeHero: false,
  },
  RIGHT_BAR: {
    name: 'Right Bar Plan',
    amount: 3588, // ₹299 * 12 = ₹3588/year
    agentCommission: 718, // ₹718 (20% of ₹3588)
    companyProfit: 2870, // ₹2870
    features: [
      'All Basic Plan Features',
      'Right Sidebar Advertisement',
      'High Visibility',
      'Priority Display',
    ],
    maxPhotos: 10, // 10 photos (optional, 1 se 10 tak)
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    priorityRank: 30,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: true,
    canBeHero: false,
  },
  BANNER: {
    name: 'Banner Plan',
    amount: 4788, // ₹399 * 12 = ₹4788/year
    agentCommission: 958, // ₹958 (20% of ₹4788)
    companyProfit: 3830, // ₹3830
    features: [
      'All Basic Plan Features',
      'Banner Advertisement',
      'Top/Bottom Banner Placement',
      'High Visibility',
      'Priority Display',
    ],
    maxPhotos: 10, // 10 photos (optional, 1 se 10 tak)
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    priorityRank: 50,
    canBeHomePageBanner: true,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  HERO: {
    name: 'Hero Plan',
    amount: 5988, // ₹499 * 12 = ₹5988/year
    agentCommission: 1198, // ₹1198 (20% of ₹5988)
    companyProfit: 4790, // ₹4790
    features: [
      'All Basic Plan Features',
      'Hero Section Advertisement',
      'Maximum Visibility',
      'Top Priority Display',
      'Homepage Hero Placement',
    ],
    maxPhotos: 10, // 10 photos (optional, 1 se 10 tak)
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    priorityRank: 200,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: true,
  },
} as const;

export type PlanType = 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_BAR' | 'BANNER' | 'HERO';

/**
 * Calculate agent commission based on plan type and amount
 */
export function calculateAgentCommission(planType: PlanType, amount: number): number {
  const plan = PRICING_PLANS[planType];
  if (!plan) return 0;
  
  // For plans with fixed commission, use that
  if (planType === 'BASIC' || planType === 'PREMIUM' || planType === 'LEFT_BAR' || 
      planType === 'RIGHT_BAR' || planType === 'BANNER' || planType === 'HERO') {
    return plan.agentCommission;
  }
  
  // For FEATURED plan, commission is 20% of amount (minimum ₹2388/year)
  if (planType === 'FEATURED') {
    return Math.round(amount * 0.2);
  }
  
  return 0;
}

/**
 * Get plan details by type
 */
export function getPlanDetails(planType: PlanType) {
  return PRICING_PLANS[planType];
}

/**
 * Calculate company profit
 */
export function calculateCompanyProfit(planType: PlanType, amount: number, agentCommission: number): number {
  return amount - agentCommission;
}

/**
 * Check if shop can upgrade to a plan
 */
export function canUpgrade(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const planOrder: PlanType[] = ['BASIC', 'PREMIUM', 'FEATURED', 'LEFT_BAR', 'RIGHT_BAR', 'BANNER', 'HERO'];
  const currentIndex = planOrder.indexOf(currentPlan);
  const targetIndex = planOrder.indexOf(targetPlan);
  return targetIndex > currentIndex;
}

/**
 * Get all available plans
 */
export function getAllPlans() {
  return Object.entries(PRICING_PLANS).map(([key, plan]) => ({
    type: key as PlanType,
    ...plan,
  }));
}

