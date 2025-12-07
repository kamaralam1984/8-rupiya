const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function convertHTMLToPDF() {
  const htmlDir = path.join(process.cwd(), 'plan-pdfs');
  const pdfDir = path.join(process.cwd(), 'plan-pdfs', 'pdfs');

  // Create PDF directory
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  // Get all HTML files
  const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('No HTML files found. Please run generate-plan-pdfs.ts first.');
    return;
  }

  console.log('Starting PDF conversion...\n');
  const browser = await puppeteer.launch();

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(htmlDir, htmlFile);
    const pdfPath = path.join(pdfDir, htmlFile.replace('.html', '.pdf'));

    console.log(`Converting: ${htmlFile} → ${path.basename(pdfPath)}`);

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await page.close();
    console.log(`✓ Created: ${path.basename(pdfPath)}`);
  }

  await browser.close();
  console.log(`\n✅ All PDFs generated successfully in: ${pdfDir}`);
}

convertHTMLToPDF().catch(console.error);


const fs = require('fs');
const path = require('path');

async function convertHTMLToPDF() {
  const htmlDir = path.join(process.cwd(), 'plan-pdfs');
  const pdfDir = path.join(process.cwd(), 'plan-pdfs', 'pdfs');

  // Create PDF directory
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  // Get all HTML files
  const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('No HTML files found. Please run generate-plan-pdfs.ts first.');
    return;
  }

  console.log('Starting PDF conversion...\n');
  const browser = await puppeteer.launch();

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(htmlDir, htmlFile);
    const pdfPath = path.join(pdfDir, htmlFile.replace('.html', '.pdf'));

    console.log(`Converting: ${htmlFile} → ${path.basename(pdfPath)}`);

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await page.close();
    console.log(`✓ Created: ${path.basename(pdfPath)}`);
  }

  await browser.close();
  console.log(`\n✅ All PDFs generated successfully in: ${pdfDir}`);
}

convertHTMLToPDF().catch(console.error);


const fs = require('fs');
const path = require('path');

async function convertHTMLToPDF() {
  const htmlDir = path.join(process.cwd(), 'plan-pdfs');
  const pdfDir = path.join(process.cwd(), 'plan-pdfs', 'pdfs');

  // Create PDF directory
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  // Get all HTML files
  const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));

  if (htmlFiles.length === 0) {
    console.log('No HTML files found. Please run generate-plan-pdfs.ts first.');
    return;
  }

  console.log('Starting PDF conversion...\n');
  const browser = await puppeteer.launch();

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(htmlDir, htmlFile);
    const pdfPath = path.join(pdfDir, htmlFile.replace('.html', '.pdf'));

    console.log(`Converting: ${htmlFile} → ${path.basename(pdfPath)}`);

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await page.close();
    console.log(`✓ Created: ${path.basename(pdfPath)}`);
  }

  await browser.close();
  console.log(`\n✅ All PDFs generated successfully in: ${pdfDir}`);
}

convertHTMLToPDF().catch(console.error);








