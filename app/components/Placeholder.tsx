export default function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '80px', height: '80px', background: '#eff6ff', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', color: '#3b82f6' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5l-5-5-5 5M7 19l5 5 5-5"/>
        </svg>
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>{title}</h1>
      <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '460px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
        Bu modül şu anda geliştirme aşamasındadır. Servis Master Pro deneyimini bir üst seviyeye taşıyacak özellikler yakında burada olacak.
      </p>
      <div style={{ marginTop: '40px', display: 'flex', gap: '10px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', opacity: 0.3 }}></div>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6', opacity: 0.6 }}></div>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></div>
      </div>
    </div>
  )
}
