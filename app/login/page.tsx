"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setLoading(false)
      setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* ─── SOL PANEL (Masaüstü için) ─── */}
      <div className="login-left-panel" style={{ 
        flex: 1, 
        background: 'linear-gradient(135deg, #0d1b2a, #1e3a5f)',
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Dekoratif Daireler */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', filter: 'blur(40px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(40px)' }}></div>

        <div style={{ zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              color: '#fff'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '28px', letterSpacing: '-0.5px', lineHeight: 1 }}>SERVIS</div>
              <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '14px', letterSpacing: '4px', marginTop: '4px' }}>MASTER PRO</div>
            </div>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1px' }}>
            Profesyonel Teknik Servis Yönetimi
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6, marginBottom: '48px' }}>
            İşletmenizin tüm operasyonlarını tek bir merkezden kolayca ve güvenle yönetin.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} text="Kapsamlı Müşteri & Cihaz Takibi" />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} text="Gelişmiş Finans & Fatura Yönetimi" />
            <Feature icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 1 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>} text="Dinamik Stok ve Depo Kontrolü" />
          </div>
        </div>
      </div>

      {/* ─── SAĞ PANEL (Login Formu) ─── */}
      <div className="login-right-panel" style={{
        width: '100%', maxWidth: '480px',
        background: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '40px 60px',
        position: 'relative'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Hoş Geldiniz</h2>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Hesabınıza giriş yaparak panelinize erişin.</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>E-posta Adresi</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="login-input"
              placeholder="admin@servismaster.com"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', color: '#0f172a' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>Şifre</label>
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: 'all 0.2s', background: '#f8fafc', color: '#0f172a', letterSpacing: showPassword ? 'normal' : '2px' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '38px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Beni Hatırla</span>
            </label>
          </div>

          <button type="submit" disabled={loading} style={{
             width: '100%', padding: '16px', marginTop: '10px',
             background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
             color: '#fff', border: 'none', borderRadius: '12px',
             fontWeight: 800, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
             boxShadow: '0 10px 20px rgba(37,99,235,0.2)', opacity: loading ? 0.7 : 1,
             transition: 'transform 0.1s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>
          © {new Date().getFullYear()} Servis Master Pro
        </div>
      </div>

      <style>{`
        .login-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 4px rgba(59,130,246,0.1) !important;
          background: #fff !important;
        }
        @media (max-width: 900px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { max-width: 100% !important; padding: 30px !important; }
        }
      `}</style>
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ background: 'rgba(96,165,250,0.1)', padding: '10px', borderRadius: '10px' }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: '15px' }}>{text}</div>
    </div>
  )
}
