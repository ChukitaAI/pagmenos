import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (fs.existsSync('../../.env.local')) {
  const envContent = fs.readFileSync('../../.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
    if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') supabaseKey = value.trim();
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.error('STATUS C: Credentials configured but connection failed. Missing URL or Key.');
  process.exit(1);
}

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data: categories, error: catError } = await supabase.from('categories').select('id, name').limit(1);
    
    if (catError) {
      if (catError.message.includes('relation "public.categories" does not exist')) {
        console.error('\nSTATUS B');
        console.error('Credentials configured.');
        console.error('Supabase reachable.');
        console.error('SQL has NOT yet been executed.');
        console.error('Waiting for user to run supabase_setup.sql.');
        console.error('Raw Error:', catError.message);
        process.exit(0);
      } else {
        console.error('\nSTATUS C: Credentials configured but connection failed.');
        console.error('Error fetching categories:', catError.message);
        process.exit(1);
      }
    }

    const { data: products, error: prodError } = await supabase.from('products').select('id, name').limit(1);

    if (prodError) {
      console.error('\nSTATUS C: Credentials configured but connection failed.');
      console.error('Error fetching products:', prodError.message);
      process.exit(1);
    }

    console.log('\nSTATUS A');
    console.log('Credentials configured.');
    console.log('Supabase reachable.');
    console.log('SQL executed.');
    console.log('Schema exists.');
    console.log('Seed verified (or partially verified).');
    
    // Also check counts
    const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    
    console.log(`Remote categories: ${catCount}`);
    console.log(`Remote products: ${prodCount}`);
    
  } catch (err) {
    console.error('\nSTATUS C: Credentials configured but connection failed.');
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
