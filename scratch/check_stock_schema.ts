import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    console.log("--- STOK ---")
    const { data: stokCols } = await supabase.rpc('get_table_columns', { t_name: 'stok' })
    if (stokCols) console.log(stokCols)
    else {
        // Alternative: just try to select one row
        const { data: firstRow } = await supabase.from('stok').select('*').limit(1)
        if (firstRow && firstRow[0]) console.log("Keys in stok:", Object.keys(firstRow[0]))
    }

    console.log("--- STOK HAREKET ---")
    const { data: shCols } = await supabase.rpc('get_table_columns', { t_name: 'stok_hareket' })
    if (shCols) console.log(shCols)
    else {
        const { data: firstRow } = await supabase.from('stok_hareket').select('*').limit(1)
        if (firstRow && firstRow[0]) console.log("Keys in stok_hareket:", Object.keys(firstRow[0]))
    }
}

check()
