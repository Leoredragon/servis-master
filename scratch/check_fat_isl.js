const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  const { data, error } = await supabase.from('fat_isl').select('*').limit(1)
  if (error) {
    console.log('Error or table missing:', error.message)
    return
  }
  // Try to get metadata via a simple query if possible, or just look at the object keys if we have data
  // But wait, the user gave us a SQL query. We can't run arbitrary SQL via the client unless there is an RPC.
  // I'll try to check if the table exists by trying to select from it.
  console.log('Table fat_isl exists.')
}

checkColumns()
