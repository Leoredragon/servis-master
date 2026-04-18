import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkTables() {
  const { data, error } = await supabase.rpc('check_tables_existence', { tables: ['teklif', 'teklif_kalem'] })
  if (error) {
    // If RPC doesn't exist, try a simple query
    const { data: t1 } = await supabase.from('teklif').select('id').limit(1)
    const { data: t2 } = await supabase.from('teklif_kalem').select('id').limit(1)
    console.log('Teklif table exists:', !!t1)
    console.log('Teklif Kalem table exists:', !!t2)
  } else {
    console.log(data)
  }
}

checkTables()
