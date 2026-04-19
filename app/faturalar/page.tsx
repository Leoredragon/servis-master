"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import Pagination from '../components/Pagination'

const Icons = {
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  invoice: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  income: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  expense: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  calendar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
}

export default function FaturalarPage() {
  const [loading, setLoading] = useState(true)
  const [faturalar, setFaturalar] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Tümü')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('fatura')
      .select('*, cari_kart(yetkili, tel), fat_isl(count)')
      .gte('fat_tarih', dateRange.start)
      .lte('fat_tarih', dateRange.end + 'T23:59:59')
      .order('fat_tarih', { ascending: false })
    
    if (error) console.error(error)
    else setFaturalar(data || [])
    setLoading(false)
  }, [dateRange])

  useEffect(() => { fetchData() }, [fetchData])

  const stats = useMemo(() => {
    const total = faturalar.length
    const income = faturalar.filter(x => x.fatura_turu === 'Satış').reduce((acc, curr) => acc + (curr.gtoplam || 0), 0)
    const expense = faturalar.filter(x => x.fatura_turu === 'Alış').reduce((acc, curr) => acc + (curr.gtoplam || 0), 0)
    const thisMonth = faturalar
      .filter(x => x.fatura_turu === 'Satış' && new Date(x.fat_tarih).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + (curr.gtoplam || 0), 0)

    return { total, income, expense, thisMonth }
  }, [faturalar])

  const filtered = useMemo(() => {
    return faturalar.filter(x => {
      const matchTab = activeTab === 'Tümü' || x.fatura_turu === activeTab
      const matchSearch = !search || 
        x.evrak_no?.toLowerCase().includes(search.toLowerCase()) || 
        x.cari_kart?.yetkili?.toLowerCase().includes(search.toLowerCase())
      return matchTab && matchSearch
    })
  }, [faturalar, activeTab, search])

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="animate-fadeIn" style={{ width: '100%', padding: '0 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Fatura ve Finans Yönetimi</h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>Tüm Alış, Satış ve iade faturalarınızı kalem bazlı detaylarla buradan yönetin.</p>
        </div>
        <Link href="/faturalar/yeni" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', textDecoration: 'none' }}>
          {Icons.plus} Yeni Fatura Oluştur
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={Icons.invoice} label="Toplam Fatura" value={stats.total} color="#475569" />
        <StatCard icon={Icons.income} label="Toplam Gelir (Satış)" value={`${stats.income.toLocaleString('tr-TR')} ₺`} color="#10b981" />
        <StatCard icon={Icons.expense} label="Toplam Gider (Alış)" value={`${stats.expense.toLocaleString('tr-TR')} ₺`} color="#ef4444" />
        <StatCard icon={Icons.calendar} label="Bu Ay Ciro" value={`${stats.thisMonth.toLocaleString('tr-TR')} ₺`} color="#3b82f6" />
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', flexShrink: 0 }}>
          {['Tümü', 'Satış', 'Alış', 'İade'].map(tab => (
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '4px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
           <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} style={{ border: 'none', background: 'none', fontSize: '12px', fontWeight: 600, outline: 'none' }} />
           <span style={{ color: '#cbd5e1' }}>—</span>
           <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} style={{ border: 'none', background: 'none', fontSize: '12px', fontWeight: 600, outline: 'none' }} />
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>{Icons.search}</span>
          <input 
            placeholder="Evrak no veya Müşteri ile ara..."
            style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '14px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Evrak No / Tür</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Müşteri</th>
              <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tarih</th>
              <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Kalem</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Matrah</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>KDV</th>
              <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Genel Toplam</th>
              <th style={{ textAlign: 'center', padding: '16px 24px', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}><td colSpan={8} style={{ padding: '24px' }}><div className="skeleton" style={{ height: '24px', width: '100%' }} /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>Fatura bulunamadı.</td></tr>
            ) : paginated.map(item => (
              <tr 
                key={item.id} 
                className="hover-row" 
                style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                onClick={() => window.location.href = `/faturalar/${item.id}`}
              >
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.evrak_no}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: item.fatura_turu === 'Satış' ? '#10b981' : '#ef4444', textTransform: 'uppercase', marginTop: '2px' }}>{item.fatura_turu}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{item.cari_kart?.yetkili || '—'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.cari_kart?.tel || '—'}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>{new Date(item.fat_tarih).toLocaleDateString('tr-TR')}</div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                   <span style={{ fontSize: '12px', fontWeight: 700, background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>{item.fat_isl?.[0]?.count || 0}</span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
                  {(item.toplam || item.gtoplam - item.kdv || 0).toLocaleString('tr-TR')} ₺
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
                  {(item.kdv || 0).toLocaleString('tr-TR')} ₺
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>{item.gtoplam?.toLocaleString('tr-TR')} ₺</div>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
                    background: item.odeme_durumu === 'Ödendi' ? '#f0fdf4' : '#f1f5f9',
                    color: item.odeme_durumu === 'Ödendi' ? '#15803d' : '#64748b'
                  }}>
                    {item.odeme_durumu || 'Bekliyor'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination 
        totalItems={filtered.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', borderLeft: `4px solid ${color}` }}>
      <div style={{ width: '52px', height: '52px', background: `${color}15`, color: color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  )
}
