"use client"

import { supabase } from './lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'

/* ─── Sabitler & İkonlar ─── */
const DURUM_RENKLER: Record<string, [string, string]> = {
  'Araç Kabul':     ['#374151', '#f3f4f6'],
  'Arıza Tespiti':  ['#92400e', '#fef3c7'],
  'Onay Bekliyor':  ['#b45309', '#fff7ed'],
  'İşlemde':        ['#1d4ed8', '#eff6ff'],
  'Kalite Kontrol': ['#7c3aed', '#f5f3ff'],
  'Teslime Hazır':  ['#059669', '#ecfdf5'],
}

const Icons = {
  users: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  tool: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  money: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  alert: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>,
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    totalCustomers: 0, 
    activeServices: 0, 
    todayRevenue: 0, 
    criticalStockCount: 0 
  })
  const [sonServisler, setSonServisler] = useState<any[]>([])
  const [statusDistrib, setStatusDistrib] = useState<Record<string, number>>({})
  const [criticalStocks, setCriticalStocks] = useState<any[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [mCount, sActive, sToday, slData, stData] = await Promise.all([
      // Total Customers
      supabase.from('cari_kart').select('*', { count: 'exact', head: true }),
      // Active Services
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }).in('durum', ['Araç Kabul', 'İşlemde', 'Arıza Tespiti', 'Onay Bekliyor']),
      // Today's Revenue (Completed services today)
      supabase.from('servis_karti').select('toplam_tutar').gte('giris_tarihi', today), 
      // Recent Services
      supabase.from('servis_karti').select('id, servis_no, durum, giris_tarihi, arac(plaka, marka, model), cari_kart(yetkili)').order('giris_tarihi', { ascending: false }).limit(8),
      // All Stock for counting and distribution
      supabase.from('stok').select('ad, miktar, kritik_seviye').limit(100)
    ])

    // Distribution & Stats
    const { data: allServices } = await supabase.from('servis_karti').select('durum')
    const distrib: Record<string, number> = {}
    allServices?.forEach(s => distrib[s.durum] = (distrib[s.durum] || 0) + 1)

    const revenue = (sToday.data || []).reduce((acc, curr) => acc + (curr.toplam_tutar || 0), 0)
    const critItems = (stData.data || []).filter(i => i.miktar <= (i.kritik_seviye || 5))

    setStats({
      totalCustomers: mCount.count || 0,
      activeServices: sActive.count || 0,
      todayRevenue: revenue,
      criticalStockCount: critItems.length
    })

    setSonServisler(slData.data || [])
    setStatusDistrib(distrib)
    setCriticalStocks(critItems.slice(0, 5))
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>
            Panel Özeti
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px', fontWeight: 500 }}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <StatCard 
          icon={Icons.users} 
          label="Toplam Müşteri" 
          value={stats.totalCustomers} 
          color="#3b82f6" 
          loading={loading}
        />
        <StatCard 
          icon={Icons.tool} 
          label="Aktif Servis" 
          value={stats.activeServices} 
          color="#f59e0b" 
          loading={loading}
        />
        <StatCard 
          icon={Icons.money} 
          label="Günlük Ciro" 
          value={stats.todayRevenue.toLocaleString('tr-TR') + ' ₺'} 
          color="#10b981" 
          loading={loading}
        />
        <StatCard 
          icon={Icons.alert} 
          label="Kritik Stok" 
          value={stats.criticalStockCount} 
          color="#ef4444" 
          loading={loading}
          warning={stats.criticalStockCount > 0}
        />
      </div>

      {/* ─── Main Content Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Sol: Son Servisler */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Son Kayıtlar</h2>
            <Link href="/servis-kayitlari" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>Tümünü Gör</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Müşteri</th>
                  <th>Araç</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: '40px', width: '100%' }} /></td></tr>
                  ))
                ) : sonServisler.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Kayıt bulunamadı</td></tr>
                ) : sonServisler.map(s => {
                  const d = DURUM_RENKLER[s.durum] || ['#64748b', '#f1f5f9']
                  return (
                    <tr key={s.id} onClick={() => window.location.href = `/servis-kayitlari/${s.id}`} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 700, color: '#3b82f6' }}>#{s.servis_no}</td>
                      <td style={{ fontWeight: 600 }}>{s.cari_kart?.yetkili}</td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '12px' }}>{s.arac?.plaka}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{s.arac?.marka} {s.arac?.model}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: d[1], color: d[0] }}>{s.durum}</span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sağ: Widgetlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Servis Dağılımı */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Servis Dağılımı</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                 [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '32px', width: '100%' }} />)
              ) : Object.keys(statusDistrib).length === 0 ? (
                <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>Veri yok</div>
              ) : Object.entries(statusDistrib).map(([status, count]) => {
                const d = DURUM_RENKLER[status] || ['#64748b', '#f1f5f9']
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d[0] }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{status}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Kritik Stok Widget */}
          <div className="card" style={{ borderLeft: stats.criticalStockCount > 0 ? '4px solid #ef4444' : 'none' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Kritik Stoklar</h3>
              <Link href="/stok" style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>Tümü</Link>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px 20px' }}>
              {loading ? (
                 [1, 2].map(i => <div key={i} className="skeleton" style={{ height: '40px', width: '100%' }} />)
              ) : criticalStocks.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>Tüm stoklar yeterli seviyede.</div>
              ) : criticalStocks.map(item => (
                <div key={item.ad} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.ad}</div>
                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Mevcut: {item.miktar} / Kritik: {item.kritik_seviye}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Hızlı Erişim ─── */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Hızlı Erişim
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <QuickButton label="Yeni Servis Kaydı" href="/servis-kayitlari/yeni" icon={Icons.tool} primary />
          <QuickButton label="Yeni Müşteri" href="/musteriler/yeni" icon={Icons.users} />
          <QuickButton label="Yeni Ürün Ekle" href="/stok/yeni" icon={Icons.plus} />
          <QuickButton label="Stok Girişi" href="/stok" icon={Icons.box} />
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, loading, warning = false }: any) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: color, background: `${color}15`, padding: '10px', borderRadius: '12px' }}>
          {icon}
        </div>
        {warning && <div style={{ background: '#fef2f2', color: '#ef4444', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>DİKKAT</div>}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>
          {loading ? <div className="skeleton" style={{ height: '34px', width: '60px' }} /> : value}
        </div>
      </div>
    </div>
  )
}

function QuickButton({ label, href, icon, primary = false }: any) {
  return (
    <Link 
      href={href} 
      className={primary ? "btn-primary" : "btn-secondary"} 
      style={{ 
        padding: '16px', 
        borderRadius: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px',
        height: '60px'
      }}
    >
      {icon}
      <span style={{ fontWeight: 700 }}>{label}</span>
    </Link>
  )
}