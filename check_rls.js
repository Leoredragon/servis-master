const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking RLS status of tables...");
    const { data, error } = await supabase.rpc('get_policies'); // Wait, get_policies might not exist

    // Let's query information_schema or pg_policies directly using raw SQL if we can,
    // or just fetch from pg_tables
    const { data: tables, error: err } = await supabase
        .from('pg_policies') // pg_policies is a system view, standard REST API cannot query it unless RLS is bypassed or we use postgres schema.
        // Actually, we can use a raw postgres query if we have a function or we can use the rest API to query it?
        // Wait, standard REST API doesn't expose system catalogs unless we create a function.
        // Let's try selecting from pg_policies. It will fail if not exposed.
        .select('*');

    if (err) {
        // Fallback: let's query via REST API if we can check it
        console.log("Rest API cannot directly query pg_policies, let's check tables via standard REST.");
    } else {
        console.log("Policies:", tables);
    }
}

check();
