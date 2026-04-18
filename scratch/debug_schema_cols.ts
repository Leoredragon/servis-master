
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugSchema() {
  const tables = ['fatura', 'cari_kart', 'servis_karti', 'stok', 'kasa_hareket']
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Table ${table} Error: ${error.message}`)
    } else if (data && data.length > 0) {
      console.log(`Table ${table} Columns:`, Object.keys(data[0]))
    } else {
      console.log(`Table ${table} is empty.`)
    }
  }
}

debugSchema()
