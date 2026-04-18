"use client"

import { useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'info' | 'warning'
}

export default function ConfirmModal({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmText = 'Evet, Onaylıyorum', cancelText = 'Vazgeç',
  type = 'warning' 
}: ConfirmModalProps) {
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const colors = {
    danger:  { main: '#ef4444', bg: '#fef2f2', btn: '#ef4444', icon: '✕' },
    warning: { main: '#f59e0b', bg: '#fffbeb', btn: '#f59e0b', icon: '!' },
    info:    { main: '#3b82f6', bg: '#eff6ff', btn: '#3b82f6', icon: 'i' }
  }

  const color = colors[type]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', animation: 'modalSlideIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', overflow: 'hidden' }}>
        <div style={{ padding: '40px 24px 32px', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', height: '64px', background: color.bg, color: color.main, 
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 24px', fontSize: '28px', fontWeight: 900,
            border: `2px solid ${color.main}15`
          }}>
            {color.icon}
          </div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '15px', color: '#64748b', lineHeight: 1.6, fontWeight: 500 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', padding: '0 24px 32px' }}>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              flex: 1, padding: '14px', background: '#fff', border: '1.5px solid #e2e8f0', 
              borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#475569', 
              cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >{cancelText}</button>
          <button 
            type="button"
            onClick={() => { onConfirm(); onClose(); }} 
            style={{ 
              flex: 1, padding: '14px', background: color.btn, border: 'none', 
              borderRadius: '12px', fontSize: '14px', fontWeight: 800, color: '#fff', 
              cursor: 'pointer', boxShadow: `0 4px 12px ${color.main}40`, transition: 'all 0.2s' 
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px) }
          to   { opacity: 1; transform: scale(1) translateY(0) }
        }
      `}</style>
    </div>
  )
}
