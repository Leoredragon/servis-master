
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseKey)

const tables = ['fatura', 'kasa_hareket', 'cek_senet', 'servis_karti', 'servis_islem', 'stok', 'stok_hareket', 'taksitler', 'cari_kart', 'arac', 'kasalar']

async function checkAllSchema() {
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.log(`Table ${table}: Error - ${error.message}`)
      } else if (data && data.length > 0) {
        const cols = Object.keys(data[0])
        const hasUser = cols.includes('kullaniciadi') || cols.includes('kullaniciAdi')
        const hasSube = cols.includes('subeadi') || cols.includes('subeAdi')
        console.log(`Table ${table}: Has User: ${hasUser}, Has Sube: ${hasSube} (Cols: ${cols.filter(c => c.toLowerCase().includes('adi')).join(', ')})`)
      } else {
        console.log(`Table ${table}: Empty`)
      }
    } catch (err) {
      console.log(`Table ${table}: Generic Error`)
    }
  }
}

checkAllSchema()
