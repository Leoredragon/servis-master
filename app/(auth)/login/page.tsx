import { Suspense } from "react"
import LoginForm from "./LoginForm"
import { Wrench } from "lucide-react"

export default function LoginPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 h-screen w-screen overflow-hidden font-sans bg-zinc-50 md:bg-white">
            {/* Sol Taraf: Premium Hero Görseli & Hoşgeldin Mesajı */}
            <div className="relative hidden md:flex flex-col justify-between p-12 bg-zinc-950 text-white select-none">
                {/* Background Image with Overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity"
                    style={{ backgroundImage: "url('/login_hero_bg.png')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-zinc-950/20 z-0" />

                {/* Logo & Brand */}
                <div className="relative z-10 flex items-center gap-2">
                    <div className="h-9 w-9 bg-white text-zinc-950 rounded-lg flex items-center justify-center shadow-md">
                        <Wrench className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="font-black tracking-wider text-xl uppercase">Servis Master</span>
                </div>

                {/* Slogan / Welcome Info */}
                <div className="relative z-10 max-w-md space-y-4">
                    <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                        Teknik Servis ve Atölye Operasyonlarında Yeni Standart.
                    </h2>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                        İş emirleri, yedek parça rezervasyonları, müşteri 360 cari hesap takibi ve gerçek zamanlı bildirimleri tek bir kokpitten yönetin.
                    </p>
                </div>

                {/* Footer Info */}
                <div className="relative z-10 text-xs text-zinc-400 font-medium">
                    &copy; 2026 Servis Master. Tüm hakları saklıdır.
                </div>
            </div>

            {/* Sağ Taraf: Minimalist Giriş Formu */}
            <div className="flex items-center justify-center bg-zinc-50 md:bg-white h-full">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></span>
                        <span className="text-sm font-medium">Yükleniyor...</span>
                    </div>
                }>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}