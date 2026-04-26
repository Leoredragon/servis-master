"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const GRUPLAR = [
  "Filtre ve Bakım", "Mekanik/Motor", "Elektrik", "Kaporta/Aksesuar", "Sarf Malzeme", "Lastik/Jant", "Madeni Yağ", "Diğer"
]
const BIRIMLER = ["Adet", "Litre", "Set", "Kg", "Metre", "Takım"]

const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function YeniStok() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.target as HTMLFormElement)
    const formDataObj: any = Object.fromEntries(formData.entries())

    const miktar = parseFloat(formDataObj.miktar) || 0
    
    // kdv_oran'ın string atanması talebi
    const payload = {
      ad: formDataObj.ad,
      kod: formDataObj.kod || null,
      barkod: formDataObj.barkod || null,
      grup: formDataObj.grup,
      birim: formDataObj.birim,
      a_fiyat: parseFloat(formDataObj.a_fiyat) || 0,
      s_fiyat: parseFloat(formDataObj.s_fiyat) || 0,
      kdv_oran: formDataObj.kdv_oran.toString(),
      kritik_seviye: parseFloat(formDataObj.kritik_seviye) || 10,
      aciklama: formDataObj.aciklama,
      miktar: miktar,
      kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin',
      subeadi: 'Merkez'
    }

    try {
      const { data, error } = await supabase.from('stok').insert([payload]).select().single()
      if (error) throw error

      if (miktar > 0 && data) {
         await supabase.from('stok_hareket').insert([{
           stok_id: data.id, 
           hareket_turu: 'Giriş', 
           miktar: miktar, 
           aciklama: 'Açılış bakiyesi girişi',
           kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin', subeadi: 'Merkez'
         }])
      }

      router.push(`/stok/${data.id}`)
    } catch (error: any) {
      alert(error.message)
      setSaving(false)
    }
  }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '0 16px 80px' : '0 24px 60px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: isMobile ? '16px' : '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ← Geri Dön
      </button>

      <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>Yeni Stok Kartı</h1>
        <p style={{ color: '#64748b', fontSize: isMobile ? '13px' : '15px', marginTop: '8px' }}>Deponuza yeni bir ürün veya hizmet kalemi tanımlayın.</p>
      </div>

      <div className="card" style={{ borderRadius: isMobile ? '16px' : '24px' }}>
         <form onSubmit={handleSubmit} style={{ padding: isMobile ? '20px' : '32px', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: isMobile ? '16px' : '20px' }}>
               <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                 <label style={labelStyle}>Ürün Adı *</label>
                 <input autoFocus required name="ad" style={inputStyle} placeholder="Örn: 5W-30 Motor Yağı 4Lt" />
               </div>

               <div>
                 <label style={labelStyle}>Stok Kodu</label>
                 <input name="kod" style={inputStyle} placeholder="ST-001" />
               </div>
               <div>
                 <label style={labelStyle}>Barkod</label>
                 <input name="barkod" style={inputStyle} placeholder="869..." />
               </div>

               <div>
                 <label style={labelStyle}>Kategori / Grup</label>
                 <div style={{ display: 'flex', gap: '8px' }}>
                    <select name="grup" style={{ ...inputStyle, flex: 1 }}>
                       {GRUPLAR.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
               </div>
               <div>
                 <label style={labelStyle}>Birim</label>
                 <select name="birim" style={inputStyle}>
                    {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                 </select>
               </div>
            </div>

            <div style={{ background: '#f8fafc', padding: isMobile ? '16px' : '24px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '16px' : '20px' }}>
               <div>
                 <label style={labelStyle}>Alış Fiyatı (₺)</label>
                 <input type="number" step="0.01" name="a_fiyat" placeholder="0.00" style={inputStyle} />
               </div>
               <div>
                 <label style={labelStyle}>Satış Fiyatı (₺)</label>
                 <input type="number" step="0.01" name="s_fiyat" placeholder="0.00" style={inputStyle} />
               </div>
               <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                 <label style={labelStyle}>KDV Oranı</label>
                 <select name="kdv_oran" defaultValue="20" style={inputStyle}>
                    <option value="0">%0</option>
                    <option value="1">%1</option>
                    <option value="10">%10</option>
                    <option value="20">%20</option>
                 </select>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: isMobile ? '16px' : '20px' }}>
               <div>
                 <label style={labelStyle}>Açılış Stok Miktarı</label>
                 <input type="number" step="0.01" name="miktar" placeholder="0" defaultValue="0" style={inputStyle} />
               </div>
               <div>
                 <label style={labelStyle}>Kritik Stok Seviyesi (Uyarı)</label>
                 <input type="number" step="0.01" name="kritik_seviye" placeholder="10" defaultValue="10" style={inputStyle} />
               </div>
            </div>

            <div>
               <label style={labelStyle}>Açıklama / Notlar</label>
               <textarea name="aciklama" rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Rafa, tedarikçiye veya ürüne dair ek bilgiler..." />
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
               <button type="button" onClick={() => router.back()} disabled={saving} style={{ padding: '16px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>İptal</button>
               <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '16px' }}>
                  {saving ? 'Kaydediliyor...' : 'Stok Ekle →'}
               </button>
            </div>
         </form>
      </div>
    </div>
  )
}
