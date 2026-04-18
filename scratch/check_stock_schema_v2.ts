import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    console.log("Checking columns for 'stok'...")
    const { data, error } = await supabase.from('stok').select('*').limit(1)
    if (error) console.error(error)
    else if (data && data[0]) console.log("Keys:", Object.keys(data[0]))
    else console.log("No data in 'stok'")

    console.log("Checking columns for 'stok_hareket'...")
    const { data: sh, error: shErr } = await supabase.from('stok_hareket').select('*').limit(1)
    if (shErr) console.error("shErr:", shErr)
    else if (sh && sh[0]) console.log("SH Keys:", Object.keys(sh[0]))
    else console.log("No data in 'stok_hareket'")
}

check()
