
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  // Common table names to check
  const tables = ['cari_hareket', 'musteri_hareket', 'cari_hesap_hareket', 'cari_fis', 'cari_hareketler']
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (!error) {
      console.log(`Table found: ${table}`)
    } else {
      console.log(`Table not found or error: ${table} (${error.message})`)
    }
  }
}

checkTables()
