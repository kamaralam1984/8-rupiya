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
    maxOffers: 0,
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    hasSEO: false,
    hasHosting: false,
    hostingPages: 0,
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
      '12 Photos Upload',
      '8 Offers Card',
      '2 Page Hosting',
      'Offers/Discount Section',
      'WhatsApp Button',
      'Shop Logo',
      'Priority Ranking',
      'Category Top Position',
    ],
    maxPhotos: 12, // 12 photos
    maxOffers: 8, // 8 offers card
    hasOffers: true,
    hasWhatsApp: true,
    hasLogo: true,
    hasSEO: false,
    hasHosting: true,
    hostingPages: 2, // 2 page hosting
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
      '8 Photos Upload',
      '4 Offers Card',
      '1 Page Hosting',
      'Home Page Banner',
      'Top Slider Image',
      'District-wide Promotion',
      'Special Category Highlight',
      'Maximum Priority Ranking',
    ],
    maxPhotos: 8, // 8 photos
    maxOffers: 4, // 4 offers card
    hasOffers: true,
    hasWhatsApp: true,
    hasLogo: true,
    hasSEO: false,
    hasHosting: true,
    hostingPages: 1, // 1 page hosting
    priorityRank: 100,
    canBeHomePageBanner: true,
    canBeTopSlider: true,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  LEFT_BAR: {
    name: 'Left Bar Plan',
    amount: 100, // ₹100/year (One time payment, 1 year validity)
    agentCommission: 20, // ₹20 (20% of ₹100)
    companyProfit: 80, // ₹80
    features: [
      'All Basic Plan Features',
      'Left Sidebar Advertisement (1 slot)',
      'High Visibility',
      'Priority Display',
      '1 Shop Photo',
    ],
    maxPhotos: 1, // 1 photo only
    maxOffers: 0,
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    hasSEO: false,
    hasHosting: false,
    hostingPages: 0,
    priorityRank: 30,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: true,
    canBeRightBar: false,
    canBeHero: false,
  },
  RIGHT_SIDE: {
    name: 'Right Side Plan',
    amount: 300, // ₹300/year (One time payment, 1 year validity)
    agentCommission: 60, // ₹60 (20% of ₹300)
    companyProfit: 240, // ₹240
    features: [
      'All Basic Plan Features',
      'Right Side Full-Height Display (3x size slot)',
      'High Visibility',
      'Priority Display',
      '1 Shop Photo',
      'SEO Configuration (Meta Title, Description, Keywords)',
    ],
    maxPhotos: 1, // 1 photo only
    maxOffers: 0,
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    hasSEO: true, // SEO included
    hasHosting: false,
    hostingPages: 0,
    priorityRank: 60,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: true,
    canBeHero: false,
  },
  BOTTOM_RAIL: {
    name: 'Bottom Rail Plan',
    amount: 200, // ₹200/year (One time payment, 1 year validity)
    agentCommission: 40, // ₹40 (20% of ₹200)
    companyProfit: 160, // ₹160
    features: [
      'All Basic Plan Features',
      'Bottom Featured Grid (1 big size slot)',
      'Homepage Bottom Placement',
      'Featured Visibility',
      '1 Shop Photo',
    ],
    maxPhotos: 1, // 1 photo only
    maxOffers: 0,
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    hasSEO: false,
    hasHosting: false,
    hostingPages: 0,
    priorityRank: 40,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  BANNER: {
    name: 'Banner Plan',
    amount: 4788, // ₹4788/year
    agentCommission: 958, // ₹958 (20% of ₹4788)
    companyProfit: 3830, // ₹3830
    features: [
      'All Basic Plan Features',
      '20 Photos Upload',
      '10 Offers Card',
      '3 Page Hosting',
      'Banner Advertisement',
      'Top/Bottom Banner Placement',
      'High Visibility',
      'Priority Display',
    ],
    maxPhotos: 20, // 20 photos
    maxOffers: 10, // 10 offers card
    hasOffers: true,
    hasWhatsApp: false,
    hasLogo: false,
    hasSEO: false,
    hasHosting: true,
    hostingPages: 3, // 3 page hosting
    priorityRank: 50,
    canBeHomePageBanner: true,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: false,
  },
  HERO: {
    name: 'Hero Plan',
    amount: 500, // ₹500/year (One time payment, 1 year validity)
    agentCommission: 100, // ₹100 (20% of ₹500)
    companyProfit: 400, // ₹400
    features: [
      'All Basic Plan Features',
      'Hero Section Advertisement',
      'Maximum Visibility',
      'Top Priority Display',
      'Homepage Hero Placement',
      '3 Shop Photos',
      'SEO Configuration (Meta Title, Description, Keywords)',
    ],
    maxPhotos: 3, // 3 photos allowed
    maxOffers: 0,
    hasOffers: false,
    hasWhatsApp: false,
    hasLogo: false,
    hasSEO: true, // SEO included
    hasHosting: false,
    hostingPages: 0,
    priorityRank: 200,
    canBeHomePageBanner: false,
    canBeTopSlider: false,
    canBeLeftBar: false,
    canBeRightBar: false,
    canBeHero: true,
  },
} as const;

export type PlanType = 'BASIC' | 'PREMIUM' | 'FEATURED' | 'LEFT_BAR' | 'RIGHT_SIDE' | 'BOTTOM_RAIL' | 'BANNER' | 'HERO';

/**
 * Calculate agent commission based on plan type and amount
 */
export function calculateAgentCommission(planType: PlanType, amount: number): number {
  const plan = PRICING_PLANS[planType];
  if (!plan) return 0;
  
  // For plans with fixed commission, use that (20% for all plans)
  if (planType === 'BASIC' || planType === 'PREMIUM' || planType === 'LEFT_BAR' || 
      planType === 'RIGHT_SIDE' || planType === 'BOTTOM_RAIL' || planType === 'BANNER' || planType === 'HERO') {
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
  const planOrder: PlanType[] = ['BASIC', 'LEFT_BAR', 'BOTTOM_RAIL', 'RIGHT_SIDE', 'HERO', 'PREMIUM', 'FEATURED', 'BANNER'];
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

