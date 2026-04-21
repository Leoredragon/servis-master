"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Modal from './Modal'
import StokHareketiModal from './StokHareketiModal'

interface StockCardModalProps {
  isOpen: boolean
  onClose: () => void
  stokId: number | null
}

const Icons = {
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  box: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
  trendingUp: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendingDown: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  history: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
}

export default function StockCardModal({ isOpen, onClose, stokId }: StockCardModalProps) {
  const [loading, setLoading] = useState(false)
  const [stok, setStok] = useState<any>(null)
  const [hareketler, setHareketler] = useState<any[]>([])
  const [isHareketModalOpen, setIsHareketModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    if (!stokId) return
    setLoading(true)
    
    try {
      // 1. Ürün Bilgilerini Getir
      const { data: stokData, error: stokError } = await supabase
        .from('stok')
        .select('*')
        .eq('id', stokId)
        .single()
      
      if (stokError) throw stokError
      setStok(stokData)

      // 2. Hareket Geçmişini Getir
      const { data: hareketData, error: hareketError } = await supabase
        .from('stok_hareket')
        .select('*')
        .eq('stok_id', stokId)
        .order('id', { ascending: false })
      
      if (hareketError) throw hareketError
      setHareketler(hareketData || [])

    } catch (err) {
      console.error('Veri çekme hatası:', err)
    } finally {
      setLoading(false)
    }
  }, [stokId])

  useEffect(() => {
    if (isOpen && stokId) {
      fetchData()
    }
  }, [isOpen, stokId, fetchData])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stok Kartı / Ürün Detayları" size="lg">
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '300px', borderRadius: '24px' }}></div>
        </div>
      ) : stok ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          
          {/* Header & Info Section */}
          <div style={{ display: 'flex', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
             <div style={{ width: '120px', height: '120px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {stok.resimyolu ? <img src={stok.resimyolu} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : Icons.box}
             </div>
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{stok.grup}</div>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{stok.ad}</h2>
                      <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginTop: '4px', fontFamily: 'monospace' }}>Kod: {stok.kod || '---'} | Barkod: {stok.barkod || '---'}</div>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Güncel Stok</div>
                      <div style={{ fontSize: '32px', fontWeight: 900, color: stok.miktar <= (stok.kritik_seviye || 10) ? '#ef4444' : '#10b981' }}>
                         {stok.miktar} <span style={{ fontSize: '16px', fontWeight: 700 }}>{stok.birim}</span>
                      </div>
                   </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
                   <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Alış Fiyatı</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{stok.a_fiyat?.toLocaleString('tr-TR')} ₺</div>
                   </div>
                   <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Satış Fiyatı</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{stok.s_fiyat?.toLocaleString('tr-TR')} ₺</div>
                   </div>
                   <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>KDV</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>%{stok.kdv_oran || '20'}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
             <button 
                onClick={() => setIsHareketModalOpen(true)}
                style={{ flex: 1, height: '52px', borderRadius: '12px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(59,130,246,0.2)' }}
             >
                {Icons.edit} Stok Hareketi İşle (Giriş/Çıkış)
             </button>
             <button 
                onClick={() => window.location.href = `/stok/${stokId}`}
                style={{ height: '52px', padding: '0 24px', borderRadius: '12px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
             >
                {Icons.edit} Düzenle
             </button>
          </div>

          {/* History Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              {Icons.history}
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Hareket Geçmişi</h3>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tarih</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tür</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Açıklama</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Miktar</th>
                  </tr>
                </thead>
                <tbody>
                  {hareketler.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Henüz bir hareket kaydı bulunmuyor.</td></tr>
                  ) : hareketler.map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{new Date(h.islem_tarihi || h.created_at).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '12px 16px' }}>
                         <span style={{ 
                            fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px',
                            background: h.hareket_turu === 'Giriş' ? '#ecfdf5' : (h.hareket_turu === 'Çıkış' ? '#fef2f2' : '#eff6ff'),
                            color: h.hareket_turu === 'Giriş' ? '#10b981' : (h.hareket_turu === 'Çıkış' ? '#ef4444' : '#3b82f6')
                         }}>
                            {h.hareket_turu}
                         </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155', fontWeight: 500 }}>{h.aciklama}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: h.hareket_turu === 'Çıkış' ? '#ef4444' : '#10b981' }}>
                          {h.hareket_turu === 'Çıkış' ? '-' : '+'}{h.miktar}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stok Hareketi Modal Entegrasyonu */}
          <StokHareketiModal 
            isOpen={isHareketModalOpen} 
            onClose={() => setIsHareketModalOpen(false)} 
            onSuccess={() => { fetchData() }}
            stokId={stokId}
            stokAd={stok.ad}
            mevcutMiktar={stok.miktar}
            resimYolu={stok.resimyolu}
          />

        </div>
      ) : null}
      <style>{`
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Modal>
  )
}
