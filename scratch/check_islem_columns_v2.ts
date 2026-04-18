
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  try {
    // PostgREST doesn't support information_schema directly, 
    // but we can try to fetch a row from servis_islem to see keys
    const { data, error } = await supabase.from('servis_islem').select('*').limit(1)
    
    if (error) {
       console.log('Error fetching servis_islem:', error.message)
    } else if (data && data.length > 0) {
       console.log('Columns in servis_islem:', Object.keys(data[0]))
    } else {
       console.log('servis_islem is empty. Trying to guess columns from RPC or other means.')
    }

    // Try to run the information_schema query if we have raw SQL access (unlikely)
    // Most people use a 'exec_sql' RPC for this
  } catch (err) {
    console.error(err)
  }
}

checkColumns()
