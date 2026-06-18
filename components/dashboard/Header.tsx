import { Search } from "lucide-react"
import NotificationCenter from "./NotificationCenter"
import UserMenu from "./UserMenu"

export default function Header() {
    return (
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-zinc-800">
                    Yönetim Paneli
                </div>
                
                {/* Global Search Shortcut Button */}
                <button 
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent("open-global-search"))
                    }}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 transition-colors w-64 text-left cursor-pointer"
                >
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Hızlı arama yapın...</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[9px] font-bold text-zinc-400 opacity-100 border-zinc-200">
                      <span className="text-[10px]">⌘</span>K
                    </kbd>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {/* Real-time Notification Center */}
                <NotificationCenter />
                
                {/* Kullanıcı Menüsü (Profil + Çıkış Yap) */}
                <UserMenu />
            </div>
        </header>
    )
}