"use client"

import { useState, useRef, useEffect } from "react"
import { User, LogOut, Settings, ChevronDown, Loader2 } from "lucide-react"
import { logout } from "@/app/(auth)/actions"

export default function UserMenu() {
    const [open, setOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Dışarı tıklayınca kapat
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    async function handleLogout() {
        setIsLoggingOut(true)
        try {
            await logout()
        } catch {
            setIsLoggingOut(false)
        }
    }

    return (
        <div className="relative" ref={ref}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 h-9 px-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
            >
                <div className="h-7 w-7 bg-zinc-900 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl shadow-black/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Kullanıcı Bilgisi */}
                    <div className="px-4 py-3 border-b border-zinc-100">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-zinc-900 rounded-full flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-900 truncate">Servis Master</p>
                                <p className="text-[11px] text-zinc-500 truncate">Yönetici</p>
                            </div>
                        </div>
                    </div>

                    {/* Menü Öğeleri */}
                    <div className="py-1.5">
                        <a
                            href="/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                            <Settings className="w-4 h-4 text-zinc-400" />
                            Profil &amp; Ayarlar
                        </a>
                    </div>

                    {/* Çıkış Yap */}
                    <div className="border-t border-zinc-100 py-1.5">
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                            ) : (
                                <LogOut className="w-4 h-4 text-red-400" />
                            )}
                            {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
