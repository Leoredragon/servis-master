import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Telefon formatlayıcı: 0 ile veya direk numara ile girilmişse +90 ekler
function formatPhone(phone: string) {
  let cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1)
  if (cleaned.startsWith('90') && cleaned.length > 10) cleaned = cleaned.substring(2)
  if (cleaned.length < 10) return null
  return `+90${cleaned}`
}

export async function POST(req: Request) {
  try {
    const { alici, mesaj, modulInfo } = await req.json()

    if (!alici || !mesaj) {
      return NextResponse.json({ error: 'Alıcı veya mesaj eksik!' }, { status: 400 })
    }

    const formattedPhone = formatPhone(alici)
    if (!formattedPhone) {
       return NextResponse.json({ error: 'Geçersiz telefon numarası formatı. En az 10 hane girin.' }, { status: 400 })
    }

    // Auth Kontrolü
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value }
        }
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })

    const { data: tenantInfo } = await supabase.from('firma_kullanicilari').select('firma_id').eq('user_id', session.user.id).single()

    // Twilio SMS
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!sid || !token || !fromNumber) {
      return NextResponse.json({ error: 'Twilio sunucu ayarları eksik.' }, { status: 500 })
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const formData = new URLSearchParams()
    formData.append('To', formattedPhone)
    formData.append('From', fromNumber)
    formData.append('Body', mesaj)

    const auth = Buffer.from(`${sid}:${token}`).toString('base64')
    
    const fetchRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })

    const result = await fetchRes.json()

    // Veritabanına Log Düş:
    const { error: dbError } = await supabase.from('sms_gonderimleri').insert({
       tenant_id: tenantInfo?.firma_id?.toString() || 'Bilinmiyor',
       modul: modulInfo || 'Bilinmiyor',
       alici_tel: formattedPhone,
       mesaj: mesaj,
       sid: result.sid || '',
       durum: fetchRes.ok ? 'Başarılı' : 'Başarısız'
    })

    if (!fetchRes.ok) {
       return NextResponse.json({ error: result.message || 'SMS Firması (Twilio) gönderimi reddetti.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, sid: result.sid })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
