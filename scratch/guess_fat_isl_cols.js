const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSchemaByInsert() {
  // If we try to insert an empty object, the error might list allowed columns in PGRST204 if we are lucky, 
  // or we can try to guess common names.
  // Actually, I'll try to check common names.
  const guesses = ['fat_id', 'fatura_id', 'cari_id', 'islem_adi', 'ad', 'birimfiyat', 'fiyat', 'kdv', 'kdv_oran', 'gtoplam', 'toplam', 'tutar']
  for (const g of guesses) {
      const { error } = await supabase.from('fat_isl').select(g).limit(1)
      if (!error) console.log(`Column '${g}' EXISTS`)
  }
}

debugSchemaByInsert()
