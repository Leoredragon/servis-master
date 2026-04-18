
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  const { data, error } = await supabase.from('servis_islem').select('*').limit(1)
  if (error) {
    console.error('Error fetching columns:', error)
    return
  }
  if (data && data.length > 0) {
    console.log('Columns in servis_islem:', Object.keys(data[0]))
  } else {
      // If no data, try to fetch info from postgrest if possible or just report info
      console.log('No data in servis_islem to infer columns.')
  }
}

checkColumns()
