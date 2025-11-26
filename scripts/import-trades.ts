#!/usr/bin/env npx ts-node
/**
 * Trade Import Script
 *
 * Imports trades from a CSV or JSON file into Supabase.
 * Useful for bulk importing your Mates Rates network.
 *
 * Usage:
 *   npx ts-node scripts/import-trades.ts --file trades.json
 *   npx ts-node scripts/import-trades.ts --file trades.csv
 *
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Expected JSON format:
 * [
 *   {
 *     "businessName": "Example Electrics",
 *     "contactName": "John Smith",
 *     "email": "john@example.com",
 *     "phone": "0412345678",
 *     "mobile": "0412345678",
 *     "abn": "12345678901",
 *     "postcodes": ["3000", "3001", "3002"],  // or "3000-3050" for range
 *     "categories": ["lighting", "ceiling-fans"],  // category slugs
 *     "skillScore": 60,  // 0-100, lower for less verified
 *     "verified": false
 *   }
 * ]
 *
 * Expected CSV format:
 * businessName,contactName,email,phone,mobile,postcodes,categories,skillScore,verified
 * "Example Electrics","John Smith","john@example.com","0412345678","0412345678","3000-3050","lighting,ceiling-fans",60,false
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TradeInput {
  businessName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  abn?: string;
  postcodes: string[] | string;
  categories: string[] | string;
  skillScore?: number;
  verified?: boolean;
  bio?: string;
}

function parsePostcodes(input: string[] | string): Array<{ start: string; end: string }> {
  const postcodes = Array.isArray(input) ? input : input.split(',').map(p => p.trim());

  return postcodes.map(p => {
    if (p.includes('-')) {
      const [start, end] = p.split('-').map(s => s.trim());
      return { start, end };
    }
    return { start: p, end: p };
  });
}

function parseCategories(input: string[] | string): string[] {
  if (Array.isArray(input)) return input;
  return input.split(',').map(c => c.trim());
}

async function loadCategoryMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name');

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  const map = new Map<string, string>();
  for (const cat of data || []) {
    map.set(cat.slug.toLowerCase(), cat.id);
    map.set(cat.name.toLowerCase(), cat.id);
  }
  return map;
}

async function importTrades(trades: TradeInput[], dryRun = false) {
  const categoryMap = await loadCategoryMap();

  console.log(`Found ${categoryMap.size / 2} categories in database`);
  console.log(`Importing ${trades.length} trades...`);

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const trade of trades) {
    try {
      if (dryRun) {
        console.log(`[DRY RUN] Would import: ${trade.businessName}`);
        imported++;
        continue;
      }

      // Insert trade (matching existing schema: name instead of business_name)
      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert({
          name: trade.businessName,
          email: trade.email,
          phone: trade.phone,
          company: trade.contactName, // Using company field for contact name
          notes: trade.bio,
          status: 'approved'  // Auto-approve imports (enum: pending, approved, rejected)
        })
        .select('id')
        .single();

      if (tradeError || !tradeData) {
        throw new Error(tradeError?.message || 'Failed to insert trade');
      }

      const tradeId = tradeData.id;

      // Insert service areas
      const postcodeRanges = parsePostcodes(trade.postcodes);
      const serviceAreas = postcodeRanges.map(range => ({
        trade_id: tradeId,
        postcode_start: range.start,
        postcode_end: range.end
      }));

      if (serviceAreas.length > 0) {
        const { error: areaError } = await supabase
          .from('service_areas')
          .insert(serviceAreas);

        if (areaError) {
          console.warn(`Warning: Failed to insert service areas for ${trade.businessName}: ${areaError.message}`);
        }
      }

      // Insert skills for each category
      const categories = parseCategories(trade.categories);
      for (const catInput of categories) {
        const categoryId = categoryMap.get(catInput.toLowerCase());
        if (!categoryId) {
          console.warn(`Warning: Unknown category "${catInput}" for ${trade.businessName}`);
          continue;
        }

        const { error: skillError } = await supabase
          .from('trade_skills')
          .insert({
            trade_id: tradeId,
            category_id: categoryId,
            score: trade.skillScore ?? 50,
            supported_complexities: ['simple', 'standard']
          });

        if (skillError) {
          console.warn(`Warning: Failed to insert skill for ${trade.businessName}: ${skillError.message}`);
        }
      }

      // Add a credential record if verified
      if (trade.verified) {
        await supabase.from('trade_credentials').insert({
          trade_id: tradeId,
          credential_type: 'general_license',
          verified: true,
          verified_at: new Date().toISOString()
        });
      }

      // Add default scheduling connection (manual)
      await supabase.from('trade_scheduling_connections').insert({
        trade_id: tradeId,
        provider: 'manual',
        next_available_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week out
      });

      console.log(`✓ Imported: ${trade.businessName}`);
      imported++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${trade.businessName}: ${message}`);
      console.error(`✗ Failed: ${trade.businessName} - ${message}`);
      failed++;
    }
  }

  console.log('\n--- Import Summary ---');
  console.log(`Imported: ${imported}`);
  console.log(`Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e}`));
  }
}

function parseCSV(content: string): TradeInput[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const trades: TradeInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g);
    if (!values) continue;

    const row: Record<string, string> = {};
    values.forEach((val, j) => {
      const clean = val.replace(/^,?"?|"?$/g, '').replace(/""/g, '"');
      if (headers[j]) {
        row[headers[j]] = clean;
      }
    });

    trades.push({
      businessName: row.businessName || row.business_name || '',
      contactName: row.contactName || row.contact_name,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      abn: row.abn,
      postcodes: row.postcodes || '',
      categories: row.categories || '',
      skillScore: row.skillScore ? parseInt(row.skillScore) : undefined,
      verified: row.verified === 'true',
      bio: row.bio
    });
  }

  return trades.filter(t => t.businessName);
}

async function main() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf('--file');
  const dryRun = args.includes('--dry-run');

  if (fileIndex === -1 || !args[fileIndex + 1]) {
    console.log('Usage: npx ts-node scripts/import-trades.ts --file <trades.json|trades.csv> [--dry-run]');
    console.log('\nExample JSON format:');
    console.log(JSON.stringify([{
      businessName: 'Example Electrics',
      contactName: 'John Smith',
      email: 'john@example.com',
      phone: '0412345678',
      postcodes: ['3000-3050'],
      categories: ['lighting', 'ceiling-fans'],
      skillScore: 60,
      verified: false
    }], null, 2));
    process.exit(1);
  }

  const filePath = args[fileIndex + 1];
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  let trades: TradeInput[];

  if (filePath.endsWith('.json')) {
    trades = JSON.parse(content);
  } else if (filePath.endsWith('.csv')) {
    trades = parseCSV(content);
  } else {
    console.error('Unsupported file format. Use .json or .csv');
    process.exit(1);
  }

  if (dryRun) {
    console.log('--- DRY RUN MODE ---\n');
  }

  await importTrades(trades, dryRun);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
