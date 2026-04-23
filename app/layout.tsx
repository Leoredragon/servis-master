"use client"

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Inter } from 'next/font/google'
import { supabase } from './lib/supabase'
import { getTenantInfo } from './lib/auth'
import { MODULLER } from './lib/permissions'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900']
})

// ─── SVG İkonları ────────────────────────────────
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  dashboard:  'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V12h6v10',
  customers:  'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  service:    'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z',
  invoice:    'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  stock:      'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
  collapse:   'M15 18l-6-6 6-6',
  expand:     'M9 18l6-6-6-6',
  bell:       'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
  finance:    'M12 1v22 M17 5l-5-5-5 5 M7 19l5 5 5-5',
  cash:       'M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z M7 10h10 M7 14h10',
  bank:       'M3 21h18 M3 10h18 M5 6l7-3 7 3 M4 10v11 M11 10v11 M15 10v11 M20 10v11',
  check:      'M2 17h20 M2 7h20 M5 12h14',
  list:       'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  order:      'M9 12l2 2 4-4 M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  reports:    'M18 20V10 M12 20V4 M6 20v-6',
  extra:      'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z',
  support:    'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  calendar:   'M19 4h-2V3a1 1 0 00-2 0v1H9V3a1 1 0 00-2 0v1H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V10h14v10z',
  randevu:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
}

const menuGroups = [
  {
    title: 'Ana Menü',
    items: [
      { path: '/',                 name: 'Anasayfa',         icon: icons.dashboard, modul: MODULLER.DASHBOARD  },
      { path: '/musteriler',       name: 'Müşteriler',       icon: icons.customers, modul: MODULLER.MUSTERILER  },
      { path: '/servis-kayitlari', name: 'Servis Kayıtları', icon: icons.service,   modul: MODULLER.SERVIS    },
      { path: '/stok',             name: 'Stok Yönetimi',    icon: icons.stock,     modul: MODULLER.STOK      },
    ]
  },
  {
    title: 'Finansal Yönetim',
    items: [
      { path: '/faturalar',        name: 'Faturalar',        icon: icons.invoice,   modul: MODULLER.FATURALAR    },
      { path: '/gelir-gider',      name: 'Gelir Gider',      icon: icons.finance,   modul: MODULLER.KASA    },
      { path: '/kasa',             name: 'Kasa & Banka',     icon: icons.cash,      modul: MODULLER.KASA       },
      { path: '/cek-senet',        name: 'Çek Senet',        icon: icons.check,     modul: MODULLER.CEK_SENET      },
      { path: '/taksit-takip',     name: 'Taksit Takip',     icon: icons.list,      modul: MODULLER.TAKSIT       },
    ]
  },
  {
    title: 'Operasyonel',
    items: [
      { path: '/randevu',          name: 'Randevu / Ajanda', icon: icons.randevu,   modul: MODULLER.RANDEVU    },
      { path: '/teklif-siparis',   name: 'Teklif Sipariş',   icon: icons.order,     modul: MODULLER.TEKLIF      },
      { path: '/raporlar',         name: 'Raporlar',         icon: icons.reports,   modul: MODULLER.RAPORLAR    },
    ]
  },
  {
    title: 'Sistem',
    items: [
      { path: '/ek-moduller',      name: 'Ek Modüller',      icon: icons.extra,     modul: ""      },
      { path: '/ayarlar',          name: 'Ayarlar',          icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z', modul: "" },
      { path: '/canli-destek',     name: 'Canlı Destek',     icon: icons.support,   modul: ""    },
    ]
  }
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  
  // Mobil Kontrolü
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
      else setCollapsed(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  const [userEmail, setUserEmail] = useState('admin@servismaster.com')
  const [userInitial, setUserInitial] = useState('A')
  const [tenantCache, setTenantCache] = useState<any>(null)

  const pathname = usePathname()
  const router = useRouter()
  
  useEffect(() => {
    // Initial fetch
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        if(mounted) {
          setUserEmail(session.user.email)
          setUserInitial(session.user.email[0].toUpperCase())
        }
        getTenantInfo(session.user.id).then(info => {
          if (info && mounted) {
            localStorage.setItem('sm_tenant_info', JSON.stringify(info))
            setTenantCache(info)
          }
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && pathname !== '/login') {
        router.push('/login')
      } else if (session?.user?.email) {
        setUserEmail(session.user.email)
        setUserInitial(session.user.email[0].toUpperCase())
        getTenantInfo(session.user.id).then(info => {
          if (info) {
            localStorage.setItem('sm_tenant_info', JSON.stringify(info))
            setTenantCache(info)
          }
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  const isActive = useCallback((path: string) => 
    path === '/' ? pathname === '/' : pathname.startsWith(path), 
  [pathname])

  const toggleSidebar = useCallback(() => setCollapsed(prev => !prev), [])
  const toggleProfile = useCallback(() => setProfileOpen(prev => !prev), [])
  const closeProfile = useCallback(() => setProfileOpen(false), [])

  // Login veya Admin sayfasıysa standart layout'u gizle
  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return (
      <html lang="tr">
        <head>
          <title>{pathname === '/login' ? 'Giriş Yap' : 'SaaS Admin Paneli'} | Servis Master Pro</title>
        </head>
        <body className={inter.className} style={{ margin: 0, padding: 0, background: '#f0f2f5' }}>
          {children}
        </body>
      </html>
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <html lang="tr">
      <head>
        <title>Servis Master Pro</title>
        <meta name="description" content="Profesyonel Teknik Servis Yönetim Sistemi" />
      </head>
      <body className={inter.className} style={{ margin: 0, padding: 0, background: '#f0f2f5' }}>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
          
          {/* Mobil Overlay */}
          {isMobile && !collapsed && (
            <div 
              onClick={() => setCollapsed(true)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
                zIndex: 90, animation: 'fadeIn 0.2s ease'
              }}
            />
          )}

          {/* ─── Sidebar ─── */}
          <aside style={{
            position: isMobile ? 'fixed' : 'relative',
            left: isMobile && collapsed ? '-280px' : '0',
            top: 0, bottom: 0,
            width: collapsed && !isMobile ? '72px' : '260px',
            minWidth: collapsed && !isMobile ? '72px' : '260px',
            background: 'linear-gradient(175deg, #0d1b2a 0%, #132040 55%, #0d1929 100%)',
            display: 'flex', flexDirection: 'column',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            willChange: 'width, left',
            overflow: 'hidden',
            boxShadow: '4px 0 28px rgba(0,0,0,0.15)',
            zIndex: 100,
          }}>
            {/* Logo & Close Button (Mobile Only) */}
            <div style={{
              height: '64px', display: 'flex', alignItems: 'center',
              padding: '0 18px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              justifyContent: 'space-between', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.45)',
                  color: '#fff',
                }}>
                  <Icon d={icons.service} size={18} />
                </div>
                {(!collapsed || isMobile) && (
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px', lineHeight: 1 }}>SERVIS</div>
                    <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', marginTop: '2px' }}>MASTER PRO</div>
                  </div>
                )}
              </div>
              
              {!isMobile ? (
                <button onClick={toggleSidebar} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#64748b', borderRadius: '8px', width: '32px', height: '32px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon d={collapsed ? icons.expand : icons.collapse} size={14} />
                </button>
              ) : (
                <button onClick={() => setCollapsed(true)} style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
                  width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✕</button>
              )}
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
              {menuGroups.map(group => (
                <div key={group.title} style={{ marginBottom: '16px' }}>
                  {(!collapsed || isMobile) && (
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.2px', textTransform: 'uppercase', padding: '8px 12px', marginBottom: '4px' }}>
                      {group.title}
                    </div>
                  )}
                  {group.items.map(item => {
                    const active = isActive(item.path)
                    let hasAccess = true
                    if (item.modul && tenantCache?.izinler) {
                       const izin = tenantCache.izinler.find((i:any) => i.modul_kodu === item.modul)
                       hasAccess = izin ? izin.aktif : false
                    }

                    return (
                      <Link 
                        key={item.path} 
                        href={hasAccess ? item.path : '#'} 
                        onClick={() => isMobile && setCollapsed(true)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: `12px ${collapsed && !isMobile ? '0' : '12px'}`,
                          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                          borderRadius: '12px', marginBottom: '2px',
                          textDecoration: 'none', transition: 'all 0.15s',
                          background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                          color: hasAccess ? (active ? '#60a5fa' : '#94a3b8') : 'rgba(255,255,255,0.05)',
                          cursor: hasAccess ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <span style={{ flexShrink: 0, display: 'flex', color: 'inherit' }}>
                          <Icon d={item.icon} size={18} />
                        </span>
                        {(!collapsed || isMobile) && (
                          <span style={{ fontWeight: active ? 700 : 500, fontSize: '13px', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </nav>
          </aside>

          {/* ─── Main ─── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {/* Top Bar */}
            <header style={{
              height: '68px', background: '#ffffff', borderBottom: '1px solid #e8ecf0',
              display: 'flex', alignItems: 'center', padding: isMobile ? '0 16px' : '0 28px', gap: '16px',
              flexShrink: 0, position: 'sticky', top: 0, zIndex: 50
            }}>
              {isMobile && (
                <button onClick={() => setCollapsed(false)} style={{
                  background: '#f1f5f9', border: 'none', color: '#0f172a',
                  width: '40px', height: '40px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <Icon d={icons.list} size={20} />
                </button>
              )}

              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: isMobile ? '14px' : '16px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {menuGroups.flatMap(g => g.items).find(m => isActive(m.path))?.name || 'Panel'}
              </div>

              <div style={{ flex: 1 }}></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div 
                    onClick={toggleProfile}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                  >
                    {!isMobile && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{userEmail.split('@')[0]}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Yönetici</div>
                      </div>
                    )}
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                      {userInitial}
                    </div>
                  </div>

                  {profileOpen && (
                    <>
                      <div onClick={closeProfile} style={{ position: 'fixed', inset: 0, zIndex: 100 }}></div>
                      <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '200px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', zIndex: 101 }}>
                        <div style={{ padding: '8px' }}>
                          <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', border: 'none', background: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}>
                            <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" size={16} />
                            <span style={{ fontSize: '13px', fontWeight: 700 }}>Çıkış Yap</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Page */}
            <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px', background: '#f0f2f5' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}