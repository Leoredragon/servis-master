import { supabase } from './supabase'

// Kullanıcının firma ve paket bilgisini dönen hook
export async function getTenantInfo(userId: string) {
  try {
    const { data, error } = await supabase
      .from('firma_kullanicilari')
      .select('*, firmalar(*, paketler(*))')
      .eq('user_id', userId)
      .eq('aktif', true)
      .single()
    
    if (error) {
      console.error("Tenant info error:", error)
      return null
    }

    if (data?.firmalar?.paket_id) {
       const { data: izinler } = await supabase.from('paket_izinleri').select('modul_kodu, aktif').eq('paket_id', data.firmalar.paket_id)
       data.izinler = izinler || []
    }
    return data
  } catch (err) {
    return null
  }
}

// Modül erişim kontrolü
// Not: gercek ortamda firma.paketId uzerinden sorgulanmali
export async function hasModuleAccess(paketId: number, modulKodu: string) {
  try {
    const { data, error } = await supabase
      .from('paket_izinleri')
      .select('aktif')
      .eq('paket_id', paketId)
      .eq('modul_kodu', modulKodu)
      .single()
      
    if (error) {
       // if not specifically defined or errored, default false unless it's a known admin case, but returning false is safer.
       return false
    }
    return data?.aktif || false
  } catch (err) {
    return false
  }
}
