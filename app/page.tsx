"use client"

import { supabase } from './lib/supabase'
import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  menu: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  bell: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  more: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  calendar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
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
  const [bugunkuRandevular, setBugunkuRandevular] = useState<any[]>([])
  const router = useRouter()

  const loadData = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [mCount, sActive, sToday, slData, stData, bgRandevuData] = await Promise.all([
      supabase.from('cari_kart').select('*', { count: 'exact', head: true }),
      supabase.from('servis_karti').select('*', { count: 'exact', head: true }).in('durum', ['Araç Kabul', 'İşlemde', 'Arıza Tespiti', 'Onay Bekliyor']),
      supabase.from('servis_karti').select('toplam_tutar').gte('giris_tarihi', today), 
      supabase.from('servis_karti').select('id, servis_no, durum, gtoplam, giris_tarihi, arac(plaka, marka, model), cari_kart(yetkili)').order('giris_tarihi', { ascending: false }).limit(8),
      supabase.from('stok').select('ad, miktar, kritik_seviye').limit(100),
      supabase.from('ajanda').select('saat, baslik, cari_kart(yetkili)').eq('tarih', today).order('saat', { ascending: true }).limit(5)
    ])

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
    setBugunkuRandevular(bgRandevuData?.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="animate-fadeIn">
      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="desktop-only">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-1px' }}>Panel Özeti</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px', fontWeight: 500 }}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            <StatCard icon={Icons.users} label="Toplam Müşteri" value={stats.totalCustomers} color="#3b82f6" loading={loading} href="/musteriler" />
            <StatCard icon={Icons.tool} label="Aktif Servis" value={stats.activeServices} color="#f59e0b" loading={loading} href="/servis-kayitlari" />
            <StatCard icon={Icons.money} label="Günlük Ciro" value={stats.todayRevenue.toLocaleString('tr-TR') + ' ₺'} color="#10b981" loading={loading} href="/kasa" />
            <StatCard icon={Icons.alert} label="Kritik Stok" value={stats.criticalStockCount} color="#ef4444" loading={loading} warning={stats.criticalStockCount > 0} href="/stok" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Son Kayıtlar</h2>
                <Link href="/servis-kayitlari" className="btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }}>Tümünü Gör</Link>
              </div>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th>No</th><th>Müşteri</th><th>Araç</th><th>Durum</th><th>Tarih</th></tr>
                  </thead>
                  <tbody>
                    {loading ? [1,2,3,4,5].map(i => <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: '40px', width: '100%' }} /></td></tr>) : sonServisler.map(s => {
                      const d = DURUM_RENKLER[s.durum] || ['#64748b', '#f1f5f9']
                      return (
                        <tr key={s.id} onClick={() => router.push(`/servis-kayitlari/${s.id}`)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 700, color: '#3b82f6' }}>#{s.servis_no}</td>
                          <td style={{ fontWeight: 600 }}>{s.cari_kart?.yetkili}</td>
                          <td><div style={{ fontWeight: 700, fontSize: '12px' }}>{s.arac?.plaka}</div></td>
                          <td><span className="badge" style={{ background: d[1], color: d[0] }}>{s.durum}</span></td>
                          <td style={{ fontSize: '12px', color: '#64748b' }}>{new Date(s.giris_tarihi).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card">
                <div className="card-header"><h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Randevular</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {bugunkuRandevular.length === 0 ? <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Randevu yok</div> : bugunkuRandevular.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <div><div style={{ fontSize: '13px', fontWeight: 700 }}>{r.baslik}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{r.cari_kart?.yetkili}</div></div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6' }}>{r.saat}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>Kritik Stoklar</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {criticalStocks.map(item => (
                    <div key={item.ad} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.ad}</div>
                      <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 800 }}>{item.miktar}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="mobile-only" style={{ background: '#f4f7f9', minHeight: '100vh', paddingBottom: '90px', margin: '-32px -32px 0' }}>
         {/* Sticky Header */}
         <div className="mobile-header-sticky" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', borderBottom: 'none' }}>
            <button 
               onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
               style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
               {Icons.menu}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', color: '#fff', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}><Icon d={icons.service} size={16} /></div>
               <div style={{ display: 'flex', flexDirection: 'column' }}>
                 <span style={{ fontWeight: 900, letterSpacing: '-0.2px', fontSize: '14px', color: '#fff', lineHeight: 1 }}>SERVIS</span>
                 <span style={{ fontWeight: 700, letterSpacing: '2px', fontSize: '9px', color: '#60a5fa', marginTop: '2px' }}>MASTER</span>
               </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Icons.bell}</button>
            </div>
         </div>
         <div style={{ padding: '8px 20px', color: '#94a3b8', fontSize: '11px', fontWeight: 700, background: '#0f172a' }}>
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
         </div>

         <div style={{ padding: '20px' }}>
            {/* Welcome Card */}
            <div style={{ 
               background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
               borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '24px',
               boxShadow: '0 12px 24px -8px rgba(15,23,42,0.4)', position: 'relative', overflow: 'hidden'
            }}>
               <div style={{ position: 'relative', zIndex: 2 }}>
                 <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Hoş geldin, Yönetici</h2>
                 <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px', lineHeight: 1.4 }}>Bugün <strong style={{ color: '#fff' }}>{stats.activeServices}</strong> aktif servis ve <strong style={{ color: '#fff' }}>{bugunkuRandevular.length}</strong> randevu seni bekliyor.</p>
               </div>
               <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0) 70%)', borderRadius: '50%', zIndex: 1 }} />
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
               <MStatCard label="Müşteri" value={stats.totalCustomers} icon={Icons.users} color="#3b82f6" href="/musteriler" />
               <MStatCard label="Aktif Servis" value={stats.activeServices} icon={Icons.tool} color="#f59e0b" href="/servis-kayitlari" />
               <MStatCard label="Bugün Ciro" value={stats.todayRevenue.toLocaleString('tr-TR') + ' ₺'} icon={Icons.money} color="#10b981" href="/kasa" />
               <MStatCard label="Kritik Stok" value={stats.criticalStockCount} icon={Icons.alert} color="#ef4444" href="/stok" />
            </div>

            {/* Quick Actions Grid */}
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.3px' }}>Hızlı İşlemler</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
               <MActionButton label="Yeni Servis" href="/servis-kayitlari/yeni" icon={Icons.tool} color="#3b82f6" />
               <MActionButton label="Yeni Müşteri" href="/musteriler/yeni" icon={Icons.users} color="#10b981" />
               <MActionButton label="Yeni Randevu" href="/randevu" icon={Icons.calendar} color="#7c3aed" />
               <MActionButton label="Stok Giriş" href="/stok" icon={Icons.box} color="#f59e0b" />
            </div>

            {/* Recent Services List */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Son Servisler</h3>
               <Link href="/servis-kayitlari" style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>Tümü →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
               {sonServisler.slice(0, 5).map(s => {
                  const d = DURUM_RENKLER[s.durum] || ['#64748b', '#f1f5f9']
                  return (
                     <div key={s.id} onClick={() => router.push(`/servis-kayitlari/${s.id}`)} style={{ background: '#fff', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{s.arac?.plaka || 'Plakasız'}</div>
                           <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{s.cari_kart?.yetkili} <span style={{ opacity: 0.4, fontWeight: 500, fontSize: '12px' }}>#{s.servis_no}</span></div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                           <span style={{ fontSize: '11px', fontWeight: 800, background: d[1], color: d[0], padding: '4px 10px', borderRadius: '8px' }}>{s.durum}</span>
                           <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{s.gtoplam?.toLocaleString('tr-TR')} ₺</div>
                        </div>
                     </div>
                  )
               })}
            </div>

            {/* Today's Appointments */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Bugünkü Randevular</h3>
               <Link href="/randevu" style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>Tümü →</Link>
            </div>
            <div style={{ marginBottom: '40px' }}>
               {bugunkuRandevular.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1', padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>Bugün randevu yok</div>
               ) : bugunkuRandevular.map((r, i) => (
                  <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{r.saat}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>{r.cari_kart?.yetkili}</span>
                     </div>
                     <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>{r.baslik}</div>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}

/* ─── Mobile Specific Components ─── */
function MStatCard({ label, value, icon, color, href }: any) {
   return (
      <Link href={href} style={{ background: '#fff', borderRadius: '16px', padding: '16px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
         <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
         <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{value}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginTop: '2px' }}>{label}</div>
         </div>
      </Link>
   )
}

function MActionButton({ label, href, icon, color }: any) {
   return (
      <Link href={href} style={{ 
         background: '#fff', borderRadius: '16px', padding: '16px 12px', 
         display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
         textDecoration: 'none', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
         transition: 'transform 0.1s'
      }}>
         <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
         </div>
         <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>{label}</span>
      </Link>
   )
}

function StatCard({ icon, label, value, color, loading, warning = false, href }: any) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: color, background: `${color}15`, padding: '10px', borderRadius: '10px' }}>{icon}</div>
        {warning && <div style={{ background: '#fef2f2', color: '#ef4444', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>!</div>}
      </div>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>{loading ? <div className="skeleton" style={{ height: '32px', width: '60px' }} /> : value}</div>
      </div>
    </div>
  )
  return href ? <Link href={href} className="stat-card" style={{ textDecoration: 'none', padding: '1.25rem' }}>{content}</Link> : <div className="stat-card" style={{ padding: '1.25rem' }}>{content}</div>
}