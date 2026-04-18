"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'

const Icons = {
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  teklif: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  check: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  money: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
}

export default function TeklifSiparisPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, amount: 0 })
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Tümü')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: dbData, error } = await supabase
      .from('teklif')
      .select('*, cari_kart(yetkili, tel)')
      .order('tarih', { ascending: false })
    
    if (error) console.error(error)
    else {
      setData(dbData || [])
      
      const s = {
        total: dbData?.length || 0,
        approved: dbData?.filter(x => x.durum === 'Onaylandı').length || 0,
        pending: dbData?.filter(x => x.durum === 'Onay Bekliyor').length || 0,
        amount: dbData?.filter(x => x.durum === 'Onaylandı').reduce((acc, curr) => acc + (curr.genel_toplam || 0), 0) || 0
      }
      setStats(s)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredData = useMemo(() => {
    return data.filter(x => {
      const matchTab = activeTab === 'Tümü' || x.durum === activeTab
      const matchSearch = !search || 
        x.teklif_no?.toLowerCase().includes(search.toLowerCase()) || 
        x.cari_kart?.yetkili?.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [data, activeTab, search])

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Taslak': return { bg: '#f1f5f9', text: '#64748b' }
      case 'Onay Bekliyor': return { bg: '#fffbeb', text: '#b45309' }
      case 'Onaylandı': return { bg: '#f0fdf4', text: '#15803d' }
      case 'Reddedildi': return { bg: '#fef2f2', text: '#dc2626' }
      default: return { bg: '#f1f5f9', text: '#64748b' }
    }
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Teklif ve Sipariş Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Müşterilerinize hazırladığınız tüm teklifleri ve onaylanan siparişleri buradan yönetebilirsiniz.</p>
        </div>
        <Link href="/teklif-siparis/yeni" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', textDecoration: 'none' }}>
          {Icons.plus} Yeni Teklif Oluştur
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={Icons.teklif} label="Toplam Teklif" value={stats.total} color="#3b82f6" />
        <StatCard icon={Icons.check} label="Onaylanan" value={stats.approved} color="#10b981" />
        <StatCard icon={Icons.clock} label="Onay Bekleyen" value={stats.pending} color="#f59e0b" />
        <StatCard icon={Icons.money} label="Onaylı Ciro" value={`${stats.amount.toLocaleString('tr-TR')} ₺`} color="#0f172a" />
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', flexShrink: 0 }}>
          {['Tümü', 'Taslak', 'Onay Bekliyor', 'Onaylandı', 'Reddedildi'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px', border: 'none', background: activeTab === tab ? '#fff' : 'transparent',
                borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                color: activeTab === tab ? '#0f172a' : '#64748b',
                boxShadow: activeTab === tab ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</span>
          <input 
            placeholder="Teklif no veya müşteri ile ara..."
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Teklif No / Tip</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Müşteri</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tarih / Geçerlilik</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Toplam Tutar</th>
              <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}><td colSpan={5} style={{ padding: '24px' }}><div className="skeleton" style={{ height: '24px', width: '100%' }} /></td></tr>
              ))
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Kayıt bulunamadı.</td></tr>
            ) : filteredData.map(item => {
              const statusStyle = getStatusStyle(item.durum)
              return (
                <tr 
                  key={item.id} 
                  className="hover-row" 
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/teklif-siparis/${item.id}`}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.teklif_no}</div>
                    <div style={{ fontSize: '11px', color: item.tip === 'Sipariş' ? '#3b82f6' : '#64748b', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>{item.tip}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{item.cari_kart?.yetkili || '—'}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.cari_kart?.tel || '—'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '13px', color: '#1e293b' }}>{new Date(item.tarih).toLocaleDateString('tr-TR')}</div>
                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Son Tarih: {item.gecerlilik_tarihi ? new Date(item.gecerlilik_tarihi).toLocaleDateString('tr-TR') : '—'}</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '16px' }}>{item.genel_toplam?.toLocaleString('tr-TR')} ₺</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>KDV: {item.kdv_toplam?.toLocaleString('tr-TR')} ₺</div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
                      background: statusStyle.bg, color: statusStyle.text
                    }}>
                      {item.durum}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
      <div style={{ width: '52px', height: '52px', background: `${color}15`, color: color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  )
}
