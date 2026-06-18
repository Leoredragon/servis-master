const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("Fetching schema details...");
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    const schema = await res.json();
    const tables = ['stock_cards', 'service_records', 'service_items', 'fault_codes'];
    for (const t of tables) {
      if (schema.definitions[t]) {
        console.log(`\n--- ${t} Properties ---`);
        console.log(Object.keys(schema.definitions[t].properties));
      } else {
        console.log(`\n❌ Table ${t} NOT found in schema.`);
      }
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
