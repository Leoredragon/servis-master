"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Modal from './Modal'

interface CustomerCardModalProps {
  isOpen: boolean
  onClose: () => void
  cariId: number | null
}

const Icons = {
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  trendingUp: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendingDown: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  wallet: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
}

const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#fff' }
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' as const }

export default function CustomerCardModal({ isOpen, onClose, cariId }: CustomerCardModalProps) {
  const [loading, setLoading] = useState(false)
  const [cari, setCari] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [kasalar, setKasalar] = useState<any[]>([])
  const [balance, setBalance] = useState({ total: 0, status: 'Neutral' })
  
  // Action Form states
  const [actionType, setActionType] = useState<'Borç' | 'Alacak' | 'Tahsilat' | 'Ödeme' | null>(null)
  const [actionForm, setActionForm] = useState({ tutar: '', aciklama: '', tarih: new Date().toISOString().split('T')[0], kasa_id: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    if (!cariId) return
    setLoading(true)
    
    try {
      // 1. Fetch Basic Info & Kasalar
      const [{ data: cariData }, { data: kasalarData }] = await Promise.all([
        supabase.from('cari_kart').select('*').eq('id', cariId).single(),
        supabase.from('kasalar').select('*').eq('aktif_mi', true).order('kasa_adi')
      ])
      setCari(cariData)
      setKasalar(kasalarData || [])

      // 2. Fetch Transactions from multiple tables
      const [faturas, servisler, hareketler] = await Promise.all([
        supabase.from('fatura').select('id, evrak_no, fat_tarih, gtoplam, fatura_turu').eq('cari_id', cariId),
        supabase.from('servis_karti').select('id, servis_no, giris_tarihi, toplam_tutar, durum').eq('cari_id', cariId),
        supabase.from('cari_hareket').select('*').eq('cari_id', cariId)
      ])

      const allTrans: any[] = []

      // Map Faturalar
      if (faturas.data) {
        faturas.data.forEach(f => {
          allTrans.push({
            date: f.fat_tarih,
            type: f.fatura_turu === 'Satış' ? 'Borç' : 'Alacak',
            category: 'Fatura',
            desc: `${f.fatura_turu} Faturası (#${f.evrak_no})`,
            amount: f.gtoplam,
            id: `f-${f.id}`
          })
        })
      }

      // Map Servisler
      if (servisler.data) {
        servisler.data.forEach(s => {
          allTrans.push({
            date: s.giris_tarihi,
            type: 'Bilgi', 
            category: 'Servis',
            desc: `Servis Kaydı (#${s.servis_no}) - ${s.durum}`,
            amount: s.toplam_tutar,
            id: `s-${s.id}`
          })
        })
      }

      // Map Manual Movements
      if (hareketler.data) {
        hareketler.data.forEach(h => {
          allTrans.push({
            date: h.islem_tarihi,
            type: h.tur,
            category: h.islem_tipi || 'Manuel',
            desc: h.aciklama,
            amount: h.tutar,
            id: `h-${h.id}`
          })
        })
      }

      // Sort by date descending
      const sorted = allTrans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setTransactions(sorted)

      // 3. Balance Calculation (Borç - Alacak)
      const debits = allTrans.filter(t => t.type === 'Borç').reduce((sum, t) => sum + (t.amount || 0), 0)
      const credits = allTrans.filter(t => t.type === 'Alacak').reduce((sum, t) => sum + (t.amount || 0), 0)
      const total = debits - credits
      
      setBalance({
        total,
        status: total > 0 ? 'Borçlu' : (total < 0 ? 'Alacaklı' : 'Dengede')
      })

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cariId])

  useEffect(() => {
    if (isOpen && cariId) {
      fetchData()
    }
  }, [isOpen, cariId, fetchData])

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cariId || !actionType || !actionForm.tutar) return
    setSaving(true)

    try {
      const tutarVal = parseFloat(actionForm.tutar)
      const email = (await supabase.auth.getUser()).data.user?.email || 'admin'
      
      // Determine Cari Movement Type
      // Tahsilat (Receive Money): Customer becomes 'Alacaklı' relative to this transaction (debt decreases)
      // Ödeme (Make Payment): Customer becomes 'Borçlu' relative to this transaction (debt increases or alacak decreases)
      const cariTur = (actionType === 'Borç' || actionType === 'Ödeme') ? 'Borç' : 'Alacak'
      
      // 1. Save to Cari Hareket
      const { data: cariHareket, error: cariError } = await supabase.from('cari_hareket').insert([{
        cari_id: cariId,
        tur: cariTur,
        tutar: tutarVal,
        islem_tarihi: actionForm.tarih,
        aciklama: actionForm.aciklama || actionType,
        islem_tipi: actionType,
        kullaniciadi: email
      }]).select().single()

      if (cariError) throw cariError

      // 2. If it's a Finance Action (Tahsilat / Ödeme), save to Kasa Movement
      if (actionType === 'Tahsilat' || actionType === 'Ödeme') {
        if (!actionForm.kasa_id) throw new Error("Lütfen bir kasa seçin.")
        
        const selectedKasa = kasalar.find(k => k.id.toString() === actionForm.kasa_id)
        if (!selectedKasa) throw new Error("Kasa bulunamadı.")

        const kasaHareketTur = actionType === 'Tahsilat' ? 'gelir' : 'gider'
        
        // 2a. Insert Kasa Movement
        const { error: kasaError } = await supabase.from('kasa_hareket').insert([{
          kasa_id: parseInt(actionForm.kasa_id),
          tur: kasaHareketTur,
          tutar: tutarVal,
          kategori: actionType === 'Tahsilat' ? 'Cari Tahsilat' : 'Cari Ödeme',
          aciklama: `${cari.yetkili} - ${actionForm.aciklama || actionType}`,
          islem_tarihi: actionForm.tarih,
          cari_id: cariId
        }])

        if (kasaError) throw kasaError

        // 2b. Update Kasa Balance
        const yeniBakiye = kasaHareketTur === 'gelir' 
          ? (selectedKasa.guncel_bakiye || 0) + tutarVal 
          : (selectedKasa.guncel_bakiye || 0) - tutarVal

        const { error: balanceError } = await supabase.from('kasalar').update({ guncel_bakiye: yeniBakiye }).eq('id', selectedKasa.id)
        if (balanceError) throw balanceError
      }

      setActionType(null)
      setActionForm({ tutar: '', aciklama: '', tarih: new Date().toISOString().split('T')[0], kasa_id: '' })
      fetchData()
    } catch (err: any) {
      alert("İşlem kaydedilemedi: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Müşteri Kartı / Finansal Detaylar" size="lg">
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }}></div>
        </div>
      ) : cari ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          
          {/* Header & Balance */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Müşteri Ünvanı</div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{cari.yetkili}</h2>
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{cari.cep || cari.tel || '---'}</span>
                <span style={{ width: '1px', height: '16px', background: '#cbd5e1' }}></span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{cari.grup || 'Grup Yok'}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Güncel Bakiye</div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: balance.total > 0 ? '#ef4444' : (balance.total < 0 ? '#10b981' : '#64748b') }}>
                {Math.abs(balance.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <div style={{ 
                fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', 
                color: balance.total > 0 ? '#ef4444' : (balance.total < 0 ? '#10b981' : '#64748b'),
                background: balance.total > 0 ? '#fef2f2' : (balance.total < 0 ? '#ecfdf5' : '#f1f5f9'),
                padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginTop: '4px'
              }}>
                {balance.status}
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          {!actionType && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Row 1: Manual Adjustments */}
              <button 
                onClick={() => setActionType('Borç')}
                style={{ height: '52px', borderRadius: '12px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}
              >
                <span style={{ fontSize: '18px' }}>-</span> Borçlandır
              </button>
              <button 
                onClick={() => setActionType('Alacak')}
                style={{ height: '52px', borderRadius: '12px', background: '#fff', color: '#10b981', border: '1px solid #d1fae5', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}
              >
                <span style={{ fontSize: '18px' }}>+</span> Alacaklandır
              </button>

              {/* Row 2: Financial Transactions (Kasa Linked) */}
              <button 
                onClick={() => setActionType('Tahsilat')}
                style={{ height: '56px', borderRadius: '12px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
              >
                {Icons.wallet} Tahsilat Yap
              </button>
              <button 
                onClick={() => setActionType('Ödeme')}
                style={{ height: '56px', borderRadius: '12px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}
              >
                {Icons.wallet} Ödeme Yap
              </button>
            </div>
          )}

          {/* Action Form */}
          {actionType && (
            <div className="animate-fadeIn" style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  {actionType === 'Borç' && 'Manuel Borçlandır'}
                  {actionType === 'Alacak' && 'Manuel Alacaklandır'}
                  {actionType === 'Tahsilat' && 'Müşteriden Nakit/Banka Tahsilatı'}
                  {actionType === 'Ödeme' && 'Müşteriye Geri Ödeme / İade'}
                </h3>
                <button onClick={() => setActionType(null)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#64748b', padding: '4px' }}>{Icons.close}</button>
              </div>
              <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {(actionType === 'Tahsilat' || actionType === 'Ödeme') && (
                  <div>
                    <label style={labelStyle}>Hangi Hesaptan / Kasaya?</label>
                    <select required style={inputStyle} value={actionForm.kasa_id} onChange={e => setActionForm({...actionForm, kasa_id: e.target.value})}>
                      <option value="">Seçiniz...</option>
                      {kasalar.map(k => (
                        <option key={k.id} value={k.id}>{k.kasa_adi} ({(k.guncel_bakiye || 0).toLocaleString('tr-TR')} ₺)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>İşlem Tutarı (₺)</label>
                    <input type="number" step="0.01" required style={{ ...inputStyle, fontSize: '18px', fontWeight: 800 }} placeholder="0.00" value={actionForm.tutar} onChange={e => setActionForm({...actionForm, tutar: e.target.value})} autoFocus />
                  </div>
                  <div>
                    <label style={labelStyle}>İşlem Tarihi</label>
                    <input type="date" required style={inputStyle} value={actionForm.tarih} onChange={e => setActionForm({...actionForm, tarih: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Açıklama / Not</label>
                  <input style={inputStyle} placeholder="İşlem detayı (Örn: Elden tahsilat, Banka havalesi vb.)" value={actionForm.aciklama} onChange={e => setActionForm({...actionForm, aciklama: e.target.value})} />
                </div>
                <button 
                  type="submit" disabled={saving} 
                  style={{ 
                    padding: '16px', borderRadius: '12px', border: 'none', 
                    background: (actionType === 'Borç' || actionType === 'Ödeme') ? '#ef4444' : '#10b981', 
                    color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '15px',
                    boxShadow: `0 8px 20px ${(actionType === 'Borç' || actionType === 'Ödeme') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`
                  }}
                >
                  {saving ? 'İşleniyor...' : 'Hareketi Onayla ve Kaydet'}
                </button>
              </form>
            </div>
          )}

          {/* Transactions List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icons.history}
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Son İşlemler</h3>
              </div>
              <button 
                onClick={() => window.location.href = `/musteriler/yeni?id=${cariId}`}
                style={{ padding: '6px 12px', borderRadius: '8px', background: 'none', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {Icons.edit} Müşteriyi Düzenle
              </button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tarih</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>İşlem / Açıklama</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Henüz bir işlem kaydı bulunmuyor.</td></tr>
                  ) : transactions.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            width: '8px', height: '8px', borderRadius: '50%', 
                            background: t.type === 'Borç' ? '#ef4444' : (t.type === 'Alacak' ? '#10b981' : '#3b82f6') 
                          }} />
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{t.desc}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '14px' }}>{t.category}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: t.type === 'Borç' ? '#dc2626' : (t.type === 'Alacak' ? '#059669' : '#0f172a') }}>
                          {t.type === 'Alacak' ? '+' : (t.type === 'Borç' ? '-' : '')}{t.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Modal>
  )
}
