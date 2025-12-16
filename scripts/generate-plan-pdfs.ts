import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Plan data with Hindi translations
const plans = {
  BASIC: {
    name: 'Basic Plan',
    nameHindi: 'बेसिक प्लान',
    price: '₹100/Year',
    priceHindi: '₹100/वर्ष',
    features: [
      { en: 'Shop Name', hi: 'दुकान का नाम' },
      { en: 'Owner Name', hi: 'मालिक का नाम' },
      { en: 'Address + Pincode', hi: 'पता + पिनकोड' },
      { en: 'Mobile Number', hi: 'मोबाइल नंबर' },
      { en: '1 Shop Photo', hi: '1 दुकान फोटो' },
      { en: 'Category', hi: 'श्रेणी' },
      { en: 'Location (Lat/Long)', hi: 'स्थान (अक्षांश/देशांतर)' },
      { en: '8rupiya.com Digital Shop Website Profile', hi: '8rupiya.com डिजिटल शॉप वेबसाइट प्रोफाइल' },
    ],
    limitations: [
      { en: 'No offers/discounts section', hi: 'ऑफर/छूट अनुभाग नहीं' },
      { en: 'No WhatsApp button', hi: 'व्हाट्सएप बटन नहीं' },
      { en: 'No shop logo', hi: 'दुकान लोगो नहीं' },
      { en: 'No priority ranking', hi: 'प्राथमिकता रैंकिंग नहीं' },
      { en: 'No homepage visibility', hi: 'होमपेज दृश्यता नहीं' },
    ],
    bestFor: {
      en: 'Small local shops, New businesses, Budget-conscious owners',
      hi: 'छोटी स्थानीय दुकानें, नए व्यवसाय, बजट-जागरूक मालिक'
    }
  },
  PREMIUM: {
    name: 'Premium Plan',
    nameHindi: 'प्रीमियम प्लान',
    price: '₹2,999/Year',
    priceHindi: '₹2,999/वर्ष',
    features: [
      { en: 'All Basic Plan Features', hi: 'सभी बेसिक प्लान सुविधाएं' },
      { en: 'Unlimited Photos', hi: 'असीमित फोटो' },
      { en: 'Offers/Discount Section', hi: 'ऑफर/छूट अनुभाग' },
      { en: 'WhatsApp Button', hi: 'व्हाट्सएप बटन' },
      { en: 'Shop Logo', hi: 'दुकान लोगो' },
      { en: 'Priority Ranking', hi: 'प्राथमिकता रैंकिंग' },
      { en: 'Category Top Position', hi: 'श्रेणी शीर्ष स्थान' },
    ],
    limitations: [],
    bestFor: {
      en: 'Established businesses, Growing shops, Competitive markets',
      hi: 'स्थापित व्यवसाय, बढ़ती दुकानें, प्रतिस्पर्धी बाजार'
    }
  },
  FEATURED: {
    name: 'Featured Plan',
    nameHindi: 'फीचर्ड प्लान',
    price: '₹199+/Month',
    priceHindi: '₹199+/महीना',
    features: [
      { en: 'All Premium Plan Features', hi: 'सभी प्रीमियम प्लान सुविधाएं' },
      { en: 'Home Page Banner', hi: 'होम पेज बैनर' },
      { en: 'Top Slider Image', hi: 'टॉप स्लाइडर इमेज' },
      { en: 'District-wide Promotion', hi: 'जिला-व्यापी प्रचार' },
      { en: 'Special Category Highlight', hi: 'विशेष श्रेणी हाइलाइट' },
      { en: 'Maximum Priority Ranking', hi: 'अधिकतम प्राथमिकता रैंकिंग' },
    ],
    limitations: [],
    bestFor: {
      en: 'Established businesses, Maximum visibility seekers, Premium brand positioning',
      hi: 'स्थापित व्यवसाय, अधिकतम दृश्यता चाहने वाले, प्रीमियम ब्रांड पोजिशनिंग'
    }
  },
  LEFT_BAR: {
    name: 'Left Bar Plan',
    nameHindi: 'लेफ्ट बार प्लान',
    price: '₹299/Month',
    priceHindi: '₹299/महीना',
    features: [
      { en: 'All Basic Plan Features', hi: 'सभी बेसिक प्लान सुविधाएं' },
      { en: 'Left Sidebar Advertisement', hi: 'बाईं साइडबार विज्ञापन' },
      { en: 'High Visibility', hi: 'उच्च दृश्यता' },
      { en: 'Priority Display', hi: 'प्राथमिकता प्रदर्शन' },
    ],
    limitations: [],
    bestFor: {
      en: 'Local businesses, Desktop-focused audience, Consistent visibility needs',
      hi: 'स्थानीय व्यवसाय, डेस्कटॉप-केंद्रित दर्शक, निरंतर दृश्यता की आवश्यकता'
    }
  },
  RIGHT_BAR: {
    name: 'Right Bar Plan',
    nameHindi: 'राइट बार प्लान',
    price: '₹299/Month',
    priceHindi: '₹299/महीना',
    features: [
      { en: 'All Basic Plan Features', hi: 'सभी बेसिक प्लान सुविधाएं' },
      { en: 'Right Sidebar Advertisement', hi: 'दाईं साइडबार विज्ञापन' },
      { en: 'High Visibility', hi: 'उच्च दृश्यता' },
      { en: 'Priority Display', hi: 'प्राथमिकता प्रदर्शन' },
    ],
    limitations: [],
    bestFor: {
      en: 'Local businesses, Desktop-focused audience, Consistent visibility needs',
      hi: 'स्थानीय व्यवसाय, डेस्कटॉप-केंद्रित दर्शक, निरंतर दृश्यता की आवश्यकता'
    }
  },
  BANNER: {
    name: 'Banner Plan',
    nameHindi: 'बैनर प्लान',
    price: '₹399/Month',
    priceHindi: '₹399/महीना',
    features: [
      { en: 'All Basic Plan Features', hi: 'सभी बेसिक प्लान सुविधाएं' },
      { en: 'Banner Advertisement', hi: 'बैनर विज्ञापन' },
      { en: 'Top/Bottom Banner Placement', hi: 'टॉप/बॉटम बैनर प्लेसमेंट' },
      { en: 'High Visibility', hi: 'उच्च दृश्यता' },
      { en: 'Priority Display', hi: 'प्राथमिकता प्रदर्शन' },
    ],
    limitations: [],
    bestFor: {
      en: 'Promotional campaigns, Special offers display, Event-based businesses',
      hi: 'प्रचार अभियान, विशेष ऑफर प्रदर्शन, इवेंट-आधारित व्यवसाय'
    }
  },
  HERO: {
    name: 'Hero Plan',
    nameHindi: 'हीरो प्लान',
    price: '₹499/Month',
    priceHindi: '₹499/महीना',
    features: [
      { en: 'All Basic Plan Features', hi: 'सभी बेसिक प्लान सुविधाएं' },
      { en: 'Hero Section Advertisement', hi: 'हीरो सेक्शन विज्ञापन' },
      { en: 'Maximum Visibility', hi: 'अधिकतम दृश्यता' },
      { en: 'Top Priority Display', hi: 'शीर्ष प्राथमिकता प्रदर्शन' },
      { en: 'Homepage Hero Placement', hi: 'होमपेज हीरो प्लेसमेंट' },
    ],
    limitations: [],
    bestFor: {
      en: 'Premium businesses, Maximum visibility seekers, Top-tier positioning',
      hi: 'प्रीमियम व्यवसाय, अधिकतम दृश्यता चाहने वाले, शीर्ष-स्तरीय पोजिशनिंग'
    }
  },
};

// HTML template for PDF
const generateHTML = (plan: any, lang: 'en' | 'hi') => {
  const isHindi = lang === 'hi';
  const planName = isHindi ? plan.nameHindi : plan.name;
  const planPrice = isHindi ? plan.priceHindi : plan.price;
  const bestFor = isHindi ? plan.bestFor.hi : plan.bestFor.en;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${planName} - Business Directory</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 32px;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 18px;
      margin-top: 10px;
    }
    .price-box {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .price-box .price {
      font-size: 36px;
      font-weight: bold;
      margin: 10px 0;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #1e40af;
      border-left: 4px solid #3b82f6;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    .features-list {
      list-style: none;
      padding: 0;
    }
    .features-list li {
      padding: 12px;
      margin: 8px 0;
      background: #f1f5f9;
      border-left: 4px solid #3b82f6;
      border-radius: 4px;
    }
    .features-list li:before {
      content: "✓ ";
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .limitations-list {
      list-style: none;
      padding: 0;
    }
    .limitations-list li {
      padding: 12px;
      margin: 8px 0;
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 4px;
    }
    .limitations-list li:before {
      content: "✗ ";
      color: #ef4444;
      font-weight: bold;
      font-size: 18px;
    }
    .best-for {
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .best-for h3 {
      color: #059669;
      margin-top: 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      color: #64748b;
      font-size: 14px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${planName}</h1>
    <div class="subtitle">${isHindi ? 'व्यापार निर्देशिका वेबसाइट' : 'Business Directory Website'}</div>
  </div>

  <div class="price-box">
    <div style="font-size: 18px; margin-bottom: 10px;">${isHindi ? 'मूल्य' : 'Price'}</div>
    <div class="price">${planPrice}</div>
    <div style="font-size: 14px; margin-top: 10px; opacity: 0.9;">${isHindi ? 'वार्षिक योजना' : 'Yearly Plan'}</div>
  </div>

  <div class="section">
    <h2>${isHindi ? 'सुविधाएं (Features)' : 'Features (सुविधाएं)'}</h2>
    <ul class="features-list">
      ${plan.features.map((f: any) => `<li><strong>${isHindi ? f.hi : f.en}</strong>${isHindi ? ` (${f.en})` : ` (${f.hi})`}</li>`).join('')}
    </ul>
  </div>

  ${plan.limitations.length > 0 ? `
  <div class="section">
    <h2>${isHindi ? 'सीमाएं (Limitations)' : 'Limitations (सीमाएं)'}</h2>
    <ul class="limitations-list">
      ${plan.limitations.map((l: any) => `<li>${isHindi ? l.hi : l.en}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="best-for">
    <h3>${isHindi ? 'किसके लिए सर्वोत्तम' : 'Best For'}</h3>
    <p>${bestFor}</p>
  </div>

  <div class="footer">
    <p><strong>${isHindi ? 'डिजिटल इंडिया व्यापार निर्देशिका' : 'Digital India Business Directory'}</strong></p>
    <p>${isHindi ? 'अधिक जानकारी के लिए: www.yourwebsite.com' : 'For more information: www.yourwebsite.com'}</p>
  </div>
</body>
</html>
  `;
};

// Generate PDFs using puppeteer or markdown-pdf
async function generatePDFs() {
  const outputDir = path.join(process.cwd(), 'plan-pdfs');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating PDFs for all plans...\n');

  for (const [planKey, planData] of Object.entries(plans)) {
    // Generate English PDF
    const htmlEn = generateHTML(planData, 'en');
    const htmlPathEn = path.join(outputDir, `${planKey}_EN.html`);
    fs.writeFileSync(htmlPathEn, htmlEn);
    console.log(`✓ Generated HTML: ${planKey}_EN.html`);

    // Generate Hindi PDF
    const htmlHi = generateHTML(planData, 'hi');
    const htmlPathHi = path.join(outputDir, `${planKey}_HI.html`);
    fs.writeFileSync(htmlPathHi, htmlHi);
    console.log(`✓ Generated HTML: ${planKey}_HI.html`);
  }

  console.log('\n✅ All HTML files generated successfully!');
  console.log(`📁 Files saved in: ${outputDir}`);
  console.log('\n📝 Note: To convert HTML to PDF, you can:');
  console.log('   1. Open HTML files in browser and print to PDF');
  console.log('   2. Use online HTML to PDF converters');
  console.log('   3. Install puppeteer: npm install puppeteer');
  console.log('   4. Run: node scripts/convert-html-to-pdf.js');
}

// Run the script
generatePDFs().catch(console.error);

