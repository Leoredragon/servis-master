
import { supabase } from '../app/lib/supabase'

async function checkColumns() {
  const { data, error } = await supabase.from('servis_islem').select('*').limit(1)
  if (error) {
    console.error('Error fetching columns:', error.message)
  } else if (data && data.length > 0) {
    console.log('Columns in servis_islem:', Object.keys(data[0]))
  } else {
    console.log('No data in servis_islem, trying to get table info via RPC maybe...')
    // Usually if no data, we can't see columns via .select('*').limit(1) if empty
  }
}

checkColumns()
