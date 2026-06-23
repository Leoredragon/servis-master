const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking columns of tables...");
    const tables = ['customers', 'vehicles', 'service_records', 'stock_cards', 'bank_accounts', 'cash_registers'];
    for (const t of tables) {
        const { data, error } = await supabase
            .from(t)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error fetching ${t}:`, error);
        } else {
            console.log(`\n--- ${t} properties ---`);
            if (data && data.length > 0) {
                console.log(Object.keys(data[0]));
            } else {
                console.log("Empty table, no rows to inspect columns.");
            }
        }
    }
}

check();
