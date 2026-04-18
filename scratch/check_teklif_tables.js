const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkTables() {
  const { data: t1, error: e1 } = await supabase.from('teklif').select('id').limit(1)
  const { data: t2, error: e2 } = await supabase.from('teklif_kalem').select('id').limit(1)
  
  if (e1 && e1.code === 'PGRST') {
    console.log('Teklif table does NOT exist')
  } else if (e1) {
    console.log('Error checking Teklif:', e1.message)
  } else {
    console.log('Teklif table exists')
  }

  if (e2 && e2.code === 'PGRST') {
    console.log('Teklif Kalem table does NOT exist')
  } else if (e2) {
    console.log('Error checking Teklif Kalem:', e2.message)
  } else {
    console.log('Teklif Kalem table exists')
  }
}

checkTables()
