const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testInsert() {
  const { data, error } = await supabase.from('fat_isl').insert([{
    fatura_id: 1, // an existing id
    stok_id: 1, // an existing id
    aciklama: 'Test',
    miktar: 1,
    birim_fiyat: 100,
    toplam_tutar: 100
  }]).select()
  
  if (error) {
    console.error('Error Status:', error.status)
    console.error('Error Code:', error.code)
    console.error('Error Message:', error.message)
    console.error('Error Details:', error.details)
  } else {
    console.log('Success:', data)
  }
}

testInsert()
