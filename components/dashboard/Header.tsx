import { User, Bell } from "lucide-react"

export default function Header() {
    return (
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8">
            <div className="text-lg font-semibold text-zinc-800">
                {/* Sayfa başlıklarını dinamik olarak buraya da çekebiliriz ileride */}
                Yönetim Paneli
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                    <Bell className="w-5 h-5" />
                </button>
                <div className="h-8 w-8 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors">
                    <User className="w-4 h-4 text-zinc-600" />
                </div>
            </div>
        </header>
    )
}