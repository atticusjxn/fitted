/**
 * Import MatesRates tradies into Supabase database
 * Run with: npx tsx scripts/import-tradies.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from apps/api/.env
const envPath = path.join(__dirname, '../apps/api/.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
  console.log('✅ Loaded environment variables from apps/api/.env\n');
}

// Supabase connection (use your env vars)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in apps/api/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Map MatesRates categories to Fitted category names (will be converted to slugs)
// Based on actual database categories: Lighting & Electrical, Tiling, Plumbing, HVAC
const categoryMapping: Record<string, string> = {
  'Electrician': 'Lighting & Electrical',
  'Handyman / Installer': 'Lighting & Electrical', // General work including installations
  'Carpentry / Joinery': 'Tiling', // General installation work
  'Builder / Reno': 'Tiling',
  'Plumber': 'Plumbing',
  'Locksmith': 'Lighting & Electrical', // General installation
  'Pool Technician': 'Plumbing', // Water systems
  'Solar & Roofing': 'HVAC',
  'Flooring & Tiling': 'Tiling',
  'Wall Mounting & AV': 'Lighting & Electrical' // Electrical/mounting work
};

// City to postcode mapping for major Australian cities
const cityPostcodes: Record<string, string> = {
  'Brisbane': '4000',
  'Sydney': '2000',
  'Melbourne': '3000',
  'Adelaide': '5000',
  'Perth': '6000',
  'Gold Coast': '4217',
  'Sunshine Coast': '4558',
  'Central Coast': '2250',
  'Wollongong': '2500',
  'Newcastle': '2300',
  'Geelong': '3220',
  'Hobart': '7000',
  'Canberra': '2600',
  'Darwin': '0800',
  'Townsville': '4810',
  'Cairns': '4870',
  'Toowoomba': '4350',
  'Ballarat': '3350',
  'Bendigo': '3550',
  'Albury': '2640',
  'Launceston': '7250',
  'Mackay': '4740',
  'Rockhampton': '4700',
  'Bunbury': '6230',
  'Coffs Harbour': '2450',
  'Wagga Wagga': '2650',
  'Hervey Bay': '4655',
  'Mildura': '3500',
  'Shepparton': '3630',
  'Gladstone': '4680',
  'Port Macquarie': '2444',
  'Tamworth': '2340',
  'Noosa': '4567',
  'Salisbury': '4107',
  'Coorparoo': '4151',
  'Coalcliff': '2508'
};

// Extract postcode from location string
function extractPostcode(location: string | null): string | null {
  if (!location) return null;

  // First try to match explicit postcode (4 digits)
  const match = location.match(/\b(\d{4})\b/);
  if (match) return match[1];

  // Otherwise try to match city name
  for (const [city, postcode] of Object.entries(cityPostcodes)) {
    if (location.toLowerCase().includes(city.toLowerCase())) {
      return postcode;
    }
  }

  return null;
}

// Extract city/suburb from location
function extractCity(location: string | null): string | null {
  if (!location) return null;

  // Extract everything before the state abbreviation
  const match = location.match(/^([^,]+)/);
  return match ? match[1].trim() : null;
}

// Get a service area range around a postcode (±50 postcodes)
function getServiceAreaRange(postcode: string): { start: string; end: string } {
  const code = parseInt(postcode);
  const start = Math.max(1000, code - 50).toString().padStart(4, '0');
  const end = Math.min(9999, code + 50).toString().padStart(4, '0');
  return { start, end };
}

async function main() {
  console.log('🚀 Starting tradie import...\n');

  // Load tradie data
  const tradiesPath = path.join(process.cwd(), 'matesrates_tradies.json');
  const tradiesData = JSON.parse(fs.readFileSync(tradiesPath, 'utf-8'));

  console.log(`📋 Found ${tradiesData.length} tradies to import\n`);

  // Get categories from database
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name, slug');

  if (catError || !categories) {
    console.error('❌ Failed to load categories:', catError);
    return;
  }

  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));
  console.log(`📦 Available categories: ${categories.map(c => c.name).join(', ')}\n`);

  // Import each tradie
  let imported = 0;
  let skipped = 0;

  for (const tradie of tradiesData) {
    const { name, email, category, businessName, homeLocation, phoneNumber, keywords, notes } = tradie;

    // Skip if no location
    if (!homeLocation) {
      console.log(`⏭️  Skipping ${name} - no location`);
      skipped++;
      continue;
    }

    const postcode = extractPostcode(homeLocation);
    if (!postcode) {
      console.log(`⏭️  Skipping ${name} - couldn't extract postcode from ${homeLocation}`);
      skipped++;
      continue;
    }

    const city = extractCity(homeLocation);
    const serviceArea = getServiceAreaRange(postcode);

    // Map category
    const fittedCategoryName = categoryMapping[category] || 'Lighting & Electrical';
    const categoryRecord = categoryMap.get(fittedCategoryName.toLowerCase());

    if (!categoryRecord) {
      console.log(`⚠️  Category not found: ${fittedCategoryName}`);
      continue;
    }

    try {
      // Insert trade
      const { data: trade, error: tradeError } = await supabase
        .from('trades')
        .insert({
          name: name,
          company: businessName || name,
          email: email,
          phone: phoneNumber || '0400000000', // Placeholder if no phone
          status: 'approved', // Auto-approve for seed data
          notes: notes
        })
        .select('id')
        .single();

      if (tradeError || !trade) {
        console.error(`❌ Failed to insert ${name}:`, tradeError?.message);
        continue;
      }

      // Add trade skill
      await supabase
        .from('trade_skills')
        .insert({
          trade_id: trade.id,
          category_id: categoryRecord.id,
          score: 75, // Default score
          supported_complexities: ['simple', 'standard', 'complex']
        });

      // Add service area
      await supabase
        .from('service_areas')
        .insert({
          trade_id: trade.id,
          postcode_start: serviceArea.start,
          postcode_end: serviceArea.end,
          surcharge_cents: 0
        });

      console.log(`✅ Imported ${name} (${city}, ${postcode}) - ${categoryRecord.name}`);
      imported++;

    } catch (err) {
      console.error(`❌ Error importing ${name}:`, err);
    }
  }

  console.log(`\n✨ Import complete!`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
}

main().catch(console.error);
