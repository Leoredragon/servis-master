const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkActualColumns() {
  // Use a hacky way to check columns if RPC is missing: try to insert a key that definitely doesn't exist 
  // and see the error message which often lists available columns in some contexts, 
  // or better, try to use the query the user gave us if we can.
  // Actually, I'll try to check if 'aciklama' is really missing by trying to select ONLY that column.
  
  const cols = ['id', 'fatura_id', 'stok_id', 'aciklama', 'miktar', 'birim', 'birim_fiyat', 'kdv_oran', 'kdv_dahil', 'toplam_tutar']
  for (const col of cols) {
    const { error } = await supabase.from('fat_isl').select(col).limit(1)
    if (error) {
      console.log(`Column '${col}' is MISSING:`, error.message)
    } else {
      console.log(`Column '${col}' EXISTS`)
    }
  }
}

checkActualColumns()
