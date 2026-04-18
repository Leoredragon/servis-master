const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function deeperGuess() {
  const guesses = ['birim_fiyat', 'fiyat', 'birimfiyat', 's_fiyat', 'birim_tutar', 'tutar', 'toplam_tutar', 'gtoplam', 'satir_toplam', 'birim', 'kdv_dahil']
  for (const g of guesses) {
      const { error } = await supabase.from('fat_isl').select(g).limit(1)
      if (!error) console.log(`Column '${g}' EXISTS`)
  }
}

deeperGuess()
