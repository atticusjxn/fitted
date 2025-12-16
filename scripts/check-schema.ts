/**
 * Check the actual schema of the trades table
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
}

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
  console.log('🔍 Checking trades table schema...\n');

  // Try to select with limit 0 to get column info
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('📊 Trades table columns:');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    // Try inserting a minimal record to see what's required
    const { error: insertError } = await supabase
      .from('trades')
      .insert({})
      .select();

    if (insertError) {
      console.log('❌ Insert error (this tells us what columns exist):');
      console.log(insertError.message);
    }
  }
}

checkSchema().catch(console.error);
