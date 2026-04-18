
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ttkijccmwwlabgrqjdgi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0a2lqY2Ntd3dsYWJncnFqZGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDM2ODYsImV4cCI6MjA5MTk3OTY4Nn0.2pgtfnELMljaUfGHBTqFeYb9VRKrUKr82mONvprLEGg'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkKartiColumns() {
  try {
    const { data, error } = await supabase.from('servis_karti').select('*').limit(1)
    if (error) {
       console.log('Error fetching servis_karti:', error.message)
    } else if (data && data.length > 0) {
       console.log('Columns in servis_karti:', Object.keys(data[0]))
    } else {
       console.log('servis_karti is empty.')
    }
  } catch (err) {
    console.error(err)
  }
}

checkKartiColumns()
