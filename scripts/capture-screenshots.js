#!/usr/bin/env node

/**
 * Capture screenshots for Shopify App Store submission
 * Requirements: 1600x1200px, showing actual app functionality
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:8000';
const OUTPUT_DIR = path.join(__dirname, '../shopify-submission-assets/screenshots');
const VIEWPORT = { width: 1600, height: 1200 };

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log('🎬 Starting screenshot capture...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  try {
    // Screenshot 1: Dashboard Overview
    console.log('📸 Capturing: Dashboard Overview...');
    await page.goto(`${BASE_URL}/landingpage/merchant/dashboard.html?shop=demo-store.myshopify.com`);
    await page.waitForTimeout(3000); // Wait for page to load

    // Try to wait for stats, but don't fail if API isn't available
    try {
      await page.waitForSelector('.stats-grid', { timeout: 5000 });
    } catch (e) {
      console.log('   ⚠️  Stats may not have loaded (API might be unavailable)');
    }

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '1-dashboard-overview.png'),
      fullPage: false
    });
    console.log('   ✓ Saved: 1-dashboard-overview.png\n');

    // Screenshot 2: Leads Management
    console.log('📸 Capturing: Leads Management...');
    await page.click('button:has-text("Leads")');
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '2-leads-management.png'),
      fullPage: false
    });
    console.log('   ✓ Saved: 2-leads-management.png\n');

    // Screenshot 3: Settings Page
    console.log('📸 Capturing: Settings Page...');
    await page.click('button:has-text("Settings")');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '3-settings-page.png'),
      fullPage: false
    });
    console.log('   ✓ Saved: 3-settings-page.png\n');

    // Screenshot 4: Support Documentation
    console.log('📸 Capturing: Support Documentation...');
    await page.click('button:has-text("Support")');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '4-support-docs.png'),
      fullPage: false
    });
    console.log('   ✓ Saved: 4-support-docs.png\n');

    // Screenshot 5: Landing Page (for context)
    console.log('📸 Capturing: Landing Page...');
    await page.goto(`${BASE_URL}/landingpage/index.html`);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '5-landing-page.png'),
      fullPage: false
    });
    console.log('   ✓ Saved: 5-landing-page.png\n');

    // Screenshot 6: Mobile View (Dashboard)
    console.log('📸 Capturing: Mobile Dashboard View...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone size
    await page.goto(`${BASE_URL}/landingpage/merchant/dashboard.html?shop=demo-store.myshopify.com`);
    await page.waitForTimeout(3000);

    try {
      await page.waitForSelector('.stats-grid', { timeout: 5000 });
    } catch (e) {
      console.log('   ⚠️  Stats may not have loaded (API might be unavailable)');
    }

    // For mobile, we want full page to show scrolling works
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '6-mobile-dashboard.png'),
      fullPage: true
    });
    console.log('   ✓ Saved: 6-mobile-dashboard.png\n');

    console.log('✅ All screenshots captured successfully!');
    console.log(`📁 Location: ${OUTPUT_DIR}\n`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Check if local server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/landingpage/index.html`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('Checking if local server is running...');
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('\n⚠️  Local server not detected at', BASE_URL);
    console.log('\nPlease start a local server first:');
    console.log('  cd /Users/atticus/Documents/fitted');
    console.log('  python3 -m http.server 8000');
    console.log('\nThen run this script again.\n');
    process.exit(1);
  }

  await captureScreenshots();
}

main().catch(console.error);
