"use client"

import { useRouter } from 'next/navigation'

export default function YeniFatura() {
  const router = useRouter()

  return (
    <div>
      <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-4">
        ← Geri
      </button>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Yeni Fatura</h1>
        <p className="text-gray-500">Fatura oluşturma ekranı yakında eklenecek.</p>
      </div>
    </div>
  )
}
