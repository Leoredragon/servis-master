"use client"

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface CariSecProps {
  value: string | number
  onChange: (id: string) => void
  placeholder?: string
  error?: boolean
}

const inputStyle = { width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none' }

const Icons = {
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}

export default function CariSec({ value, onChange, placeholder = "Müşteri Ara...", error }: CariSecProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  
  // Hızlı Kayıt Modalı
  const [quickAdd, setQuickAdd] = useState(false)
  const [quickForm, setQuickForm] = useState({ yetkili: '', tel: '' })
  const [saving, setSaving] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce Search
  useEffect(() => {
    if (!search && !isOpen) return
    
    const timer = setTimeout(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('cari_kart')
        .select('id, yetkili, tel')
        .or(`yetkili.ilike.%${search}%,tel.ilike.%${search}%`)
        .limit(8)
      setResults(data || [])
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, isOpen])

  // Seçili ismi getir
  useEffect(() => {
    if (value) {
      supabase.from('cari_kart').select('yetkili').eq('id', value).single().then(({ data }) => {
        if (data) setSelectedName(data.yetkili)
      })
    } else {
      setSelectedName('')
    }
  }, [value])

  // Kapanma kontrolü
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickForm.yetkili) return
    setSaving(true)
    try {
      const { data, error } = await supabase.from('cari_kart').insert([{
        yetkili: quickForm.yetkili,
        tel: quickForm.tel,
        kullaniciadi: 'admin', // TODO: Oturum bilgisinden dinamik alınacak
        subeadi:      'Merkez', // TODO: Kullanıcı şubesinden dinamik alınacak
      }]).select().single()
      
      if (error) throw error
      if (data) {
        onChange(data.id.toString())
        setSelectedName(data.yetkili)
        setQuickAdd(false)
        setIsOpen(false)
        setQuickForm({ yetkili: '', tel: '' })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: '12px',
          border: error ? '1.5px solid #ef4444' : (isOpen ? '1.5px solid #3b82f6' : '1.5px solid #e2e8f0'),
          background: '#fff', cursor: 'text', display: 'flex', alignItems: 'center', gap: '10px',
          transition: 'all 0.2s', boxSizing: 'border-box'
        }}
      >
        <span style={{ color: '#94a3b8' }}>{Icons.user}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {selectedName ? (
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{selectedName}</span>
          ) : (
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
          background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(15,23,42,0.15)',
          border: '1px solid #f1f5f9', zIndex: 1000, overflow: 'hidden', animation: 'modalSlideIn 0.2s ease-out'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</span>
              <input 
                autoFocus placeholder="İsim veya telefon yazın..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Aranıyor...</div>}
            
            {!loading && results.map(item => (
              <div 
                key={item.id} 
                onClick={() => { onChange(item.id.toString()); setSelectedName(item.yetkili); setIsOpen(false); }}
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.yetkili}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{item.tel || 'Telefon Yok'}</div>
                </div>
                {value?.toString() === item.id.toString() && <span style={{ color: '#3b82f6' }}>{Icons.check}</span>}
              </div>
            ))}

            {!loading && search && results.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px' }}>Aramanızla eşleşen müşteri bulunamadı.</p>
                <button 
                  onClick={() => setQuickAdd(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#3b82f6', color: '#fff', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {Icons.plus} Yeni Müşteri Ekle
                </button>
              </div>
            )}

            {!loading && !search && results.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>Aramaya başlayın...</div>
            )}
          </div>

          <div style={{ padding: '8px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
             <button 
                onClick={() => setQuickAdd(true)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'transparent', color: '#3b82f6', border: '1px dashed #3b82f6', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
             >
                + Yeni Kart Oluştur
             </button>
          </div>
        </div>
      )}

      {/* ─── Hızlı Kayıt Modalı (İç Modal) ─── */}
      {quickAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)' }}>
           <div style={{ background: '#fff', width: '320px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', padding: '24px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>Müşteri Hızlı Kayıt</h3>
              <p style={{ margin: '0 0 20px', fontSize: '12px', color: '#64748b' }}>Müşteriyi sisteme anında ekleyin.</p>
              <form onSubmit={handleQuickAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>Ad Soyad / Ünvan</label>
                    <input autoFocus required style={{ ...inputStyle, padding: '10px' }} value={quickForm.yetkili} onChange={e => setQuickForm({...quickForm, yetkili: e.target.value})} />
                 </div>
                 <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>Telefon No</label>
                    <input style={{ ...inputStyle, padding: '10px' }} placeholder="05XX XXX XX XX" value={quickForm.tel} onChange={e => setQuickForm({...quickForm, tel: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                       {saving ? '...' : 'Kaydet'}
                    </button>
                    <button type="button" onClick={() => setQuickAdd(false)} style={{ padding: '12px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 700, cursor: 'pointer' }}>İptal</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
