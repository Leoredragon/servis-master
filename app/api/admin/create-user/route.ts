import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(req: Request) {
  try {
    const { email, password, firmaId, rol } = await req.json()

    if (!email || !password || !firmaId) {
      return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
    }

    // 1. Create user in Auth schema bypassing email confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Link user to the tenant company
    const { error: dbError } = await supabaseAdmin.from('firma_kullanicilari').insert({
      firma_id: firmaId,
      user_id: userId,
      rol: rol || 'kullanici',
      aktif: true
    })

    if (dbError) {
      // Rollback auth creation if link fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: dbError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: authData.user })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
