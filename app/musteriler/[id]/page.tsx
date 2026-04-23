"use client"

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Modal from '../../components/Modal'

const inputStyle = { width: '100%', padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '15px', outline: 'none', background: '#fff', color: '#0f172a', transition: 'all 0.2s' }
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }

export default function MusteriForm() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const editId = params?.id as string

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(editId ? true : false)
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Araç Modal States
  const [aracModalAcik, setAracModalAcik] = useState(false)
  const [aracSaving, setAracSaving] = useState(false)
  const [aracForm, setAracForm] = useState({
    plaka: '',
    marka: '',
    model: '',
    yil: '',
    renk: '',
    km: '',
    motor_no: '',
    sasi_no: ''
  })

  useEffect(() => {
    if (searchParams.get('arac_ekle') === 'true') {
      setAracModalAcik(true)
    }
  }, [searchParams])
  const [form, setForm] = useState({
    yetkili: '',
    grup: 'Bireysel',
    tel: '',
    cep: '',
    mail: '',
    adres: '',
    vergi_no: '',
    vergi_dairesi: '',
    aciklama: ''
  })
  const [availableGroups, setAvailableGroups] = useState<string[]>(['Bireysel', 'Kurumsal', 'Bayi', 'VIP'])

  useEffect(() => {
    // Tüm grupları çekerek dropdown'a ekleyelim
    const fetchGroups = async () => {
      const { data } = await supabase.from('cari_kart').select('grup')
      if (data) {
        const set = new Set<string>(['Bireysel', 'Kurumsal', 'Bayi', 'VIP'])
        data.forEach(d => { if (d.grup) set.add(d.grup) })
        setAvailableGroups(Array.from(set))
      }
    }
    fetchGroups()

    if (editId) {
      const fetchMusteri = async () => {
        const { data } = await supabase.from('cari_kart').select('*').eq('id', editId).single()
        if (data) {
          setForm({
            yetkili: data.yetkili || '',
            grup: data.grup || 'Bireysel',
            tel: data.tel || '',
            cep: data.cep || '',
            mail: data.mail || '',
            adres: data.adres || '',
            vergi_no: data.vergi_no || '',
            vergi_dairesi: data.vergi_dairesi || '',
            aciklama: data.aciklama || ''
          })
        }
        setLoading(false)
      }
      fetchMusteri()
    }
  }, [editId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.yetkili.trim()) { alert('Müşteri Kimliği / Ünvan alanı zorunludur.'); return }
    
    setSaving(true)
    const payload = {
      yetkili: form.yetkili,
      grup: form.grup,
      tel: form.tel,
      cep: form.cep,
      mail: form.mail,
      adres: form.adres,
      vergi_no: form.vergi_no,
      vergi_dairesi: form.vergi_dairesi,
      aciklama: form.aciklama,
      kullaniciadi: (await supabase.auth.getUser()).data.user?.email || 'admin',
      subeadi: 'Merkez'
    }

    try {
      if (editId) {
        const { error } = await supabase.from('cari_kart').update(payload).eq('id', editId)
        if (error) throw error
        router.push(`/musteriler`)
      } else {
        const { data, error } = await supabase.from('cari_kart').insert([payload]).select().single()
        if (error) throw error
        router.push(`/musteriler`)
      }
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
      setSaving(false)
    }
  }

  const handleAracSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aracForm.plaka.trim()) { showToast('Plaka alanı zorunludur.', 'error'); return }
    
    setAracSaving(true)
    try {
      const email = (await supabase.auth.getUser()).data.user?.email || 'admin'
      const { error } = await supabase.from('arac').insert([{
        cari_id: parseInt(editId),
        plaka: aracForm.plaka.toUpperCase().replace(/\s/g, ''),
        marka: aracForm.marka,
        model: aracForm.model,
        yil: parseInt(aracForm.yil) || null,
        renk: aracForm.renk,
        guncel_km: parseInt(aracForm.km) || 0,
        motor_no: aracForm.motor_no,
        sasi_no: aracForm.sasi_no,
        kullaniciadi: email,
        subeadi: 'Merkez'
      }])
      
      if (error) throw error
      
      showToast('Araç başarıyla eklendi.', 'success')
      setAracModalAcik(false)
      setAracForm({ plaka: '', marka: '', model: '', yil: '', renk: '', km: '', motor_no: '', sasi_no: '' })
      
      // Sayfayı yenilemeden modalı kapatıyoruz, 
      // Eğer bir araç listesi olsaydı onu da yenilerdik.
    } catch (err: any) {
      showToast('Hata: ' + err.message, 'error')
    } finally {
      setAracSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}><div className="skeleton" style={{ height: '300px', borderRadius: '16px', maxWidth: '800px', margin: '0 auto' }}></div></div>
  }

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px 60px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ← Geri Dön
      </button>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{editId ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Oluştur'}</h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px' }}>Gerekli kimlik ve iletişim detaylarını doldurun.</p>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
             <div>
                <label style={labelStyle}>Müşteri Adı / Firma Ünvanı *</label>
                <input required style={inputStyle} placeholder="Örn: Ahmet Yılmaz veya ABC Ltd." value={form.yetkili} onChange={e => setForm({...form, yetkili: e.target.value})} autoFocus />
             </div>
             <div>
                <label style={labelStyle}>Müşteri Grubu</label>
                {/* Datalist benzeri veya serbest input için */}
                <input list="grupList" style={inputStyle} value={form.grup} onChange={e => setForm({...form, grup: e.target.value})} placeholder="Seç veya Yeni Yaz" />
                <datalist id="grupList">
                   {availableGroups.map(g => <option key={g} value={g} />)}
                </datalist>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>İletişim Bilgileri</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div>
                      <label style={labelStyle}>Cep Telefonu</label>
                      <input type="tel" style={inputStyle} placeholder="05XX XXX XX XX" value={form.cep} onChange={e => setForm({...form, cep: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>Sabit Tel / İş</label>
                      <input type="tel" style={inputStyle} placeholder="02XX XXX XX XX" value={form.tel} onChange={e => setForm({...form, tel: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>E-Posta Adresi</label>
                      <input type="email" style={inputStyle} placeholder="ornek@firma.com" value={form.mail} onChange={e => setForm({...form, mail: e.target.value})} />
                   </div>
                </div>
             </div>

             <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px' }}>Resmi Bilgiler (Kurumsal)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div>
                      <label style={labelStyle}>Vergi Dairesi</label>
                      <input style={inputStyle} placeholder="Örn: Kadıköy VD" value={form.vergi_dairesi} onChange={e => setForm({...form, vergi_dairesi: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>Vergi Numarası / TCKN</label>
                      <input style={inputStyle} placeholder="1122334455" value={form.vergi_no} onChange={e => setForm({...form, vergi_no: e.target.value})} />
                   </div>
                   <div>
                      <label style={labelStyle}>Adres</label>
                      <textarea rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="Fatura veya servis adresi..." value={form.adres} onChange={e => setForm({...form, adres: e.target.value})} />
                   </div>
                </div>
             </div>
          </div>

          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
             <button type="button" onClick={() => router.back()} disabled={saving} style={{ padding: '16px 24px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
             <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '16px 32px', borderRadius: '12px', fontSize: '16px' }}>
                {saving ? 'Kaydediliyor...' : (editId ? 'Değişiklikleri Kaydet' : 'Müşteriyi Kaydet →')}
             </button>
          </div>

        </form>
      </div>

      <Modal isOpen={aracModalAcik} onClose={() => setAracModalAcik(false)} title="Yeni Araç Ekle" size="md">
         <form onSubmit={handleAracSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Plaka *</label>
                  <input 
                    required 
                    style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 800, fontSize: '18px', textAlign: 'center' }} 
                    placeholder="34 ABC 123" 
                    value={aracForm.plaka} 
                    onChange={e => setAracForm({...aracForm, plaka: e.target.value.toUpperCase()})} 
                  />
               </div>
               <div>
                  <label style={labelStyle}>Marka</label>
                  <input style={inputStyle} placeholder="Örn: BMW" value={aracForm.marka} onChange={e => setAracForm({...aracForm, marka: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Model</label>
                  <input style={inputStyle} placeholder="Örn: 320i" value={aracForm.model} onChange={e => setAracForm({...aracForm, model: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Yıl</label>
                  <input type="number" style={inputStyle} placeholder="2023" value={aracForm.yil} onChange={e => setAracForm({...aracForm, yil: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Renk</label>
                  <input style={inputStyle} placeholder="Siyah" value={aracForm.renk} onChange={e => setAracForm({...aracForm, renk: e.target.value})} />
               </div>
               <div>
                  <label style={labelStyle}>Kilometre (KM)</label>
                  <input type="number" style={inputStyle} placeholder="45000" value={aracForm.km} onChange={e => setAracForm({...aracForm, km: e.target.value})} />
               </div>
               <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                     <div>
                        <label style={labelStyle}>Motor No</label>
                        <input style={inputStyle} value={aracForm.motor_no} onChange={e => setAracForm({...aracForm, motor_no: e.target.value})} />
                     </div>
                     <div>
                        <label style={labelStyle}>Şasi No</label>
                        <input style={inputStyle} value={aracForm.sasi_no} onChange={e => setAracForm({...aracForm, sasi_no: e.target.value})} />
                     </div>
                  </div>
               </div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
               <button type="submit" disabled={aracSaving} className="btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '15px' }}>
                  {aracSaving ? 'Kaydediliyor...' : 'Aracı Kaydet'}
               </button>
               <button type="button" onClick={() => setAracModalAcik(false)} style={{ padding: '14px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
            </div>
         </form>
      </Modal>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>}
            {toast.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MusteriEditPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <MusteriForm />
    </Suspense>
  )
}
