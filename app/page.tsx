import Link from "next/link"
import { Wrench, CheckCircle, Zap, Users, Package, FileText, ArrowRight, Shield, Clock, BarChart3 } from "lucide-react"

export const metadata = {
    title: "Servis Master | Teknik Servis Yönetim Sistemi",
    description: "Servis Master ile teknik servis operasyonlarınızı, müşteri takibinizi, stok ve finansal süreçlerinizi tek bir akıllı platformdan yönetin.",
}

const features = [
    {
        icon: Wrench,
        title: "Gelişmiş Servis Kokpiti",
        description: "3 sütunlu SPA tasarımı ile iş emirlerini, yedek parça rezervasyonlarını ve servis geçmişini tek ekranda yönetin.",
    },
    {
        icon: Users,
        title: "Müşteri 360°",
        description: "Her müşteri için tam cari hesap, araç geçmişi ve iletişim takibi. Hiçbir detay gözden kaçmaz.",
    },
    {
        icon: Package,
        title: "Akıllı Stok Yönetimi",
        description: "Otomatik rezervasyon ve kritik stok uyarıları ile yedek parçalarınız her zaman kontrol altında.",
    },
    {
        icon: FileText,
        title: "Hızlı Faturalama",
        description: "Servis kaydından tek tıkla profesyonel fatura oluşturun, ödeme durumunu takip edin.",
    },
    {
        icon: BarChart3,
        title: "Finansal Analitik",
        description: "Günlük tahsilat, kasa/banka bakiyeleri ve nakit akış grafikleri ile işletmenizin nabzını tutun.",
    },
    {
        icon: Shield,
        title: "Güvenli ve Hızlı",
        description: "Supabase altyapısı ile kurumsal güvenlik standartlarında, bulut tabanlı ve her cihazdan erişilebilir.",
    },
]

const stats = [
    { value: "10x", label: "Daha Hızlı İş Emri" },
    { value: "%98", label: "Müşteri Memnuniyeti" },
    { value: "0", label: "Kayıp Stok" },
    { value: "7/24", label: "Sistem Erişimi" },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
            {/* ── HEADER ─────────────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 backdrop-blur-md bg-zinc-950/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Wrench className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                        </div>
                        <span className="font-black text-lg tracking-tight text-white">Servis Master</span>
                    </div>

                    <Link
                        href="/login"
                        className="group inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-white/10"
                    >
                        Giriş Yap
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </header>

            {/* ── HERO ───────────────────────────────── */}
            <section className="relative min-h-screen flex items-center">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/landing_hero_bg.png')" }}
                />
                {/* Overlays */}
                <div className="absolute inset-0 bg-zinc-950/70" />
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-zinc-950/20" />
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
                    <div className="max-w-3xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Teknik Servis Operasyonları için Tasarlandı
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
                            Servis
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                                Yönetiminin
                            </span>
                            <br />
                            Yeni Standartı.
                        </h1>

                        <p className="text-lg text-zinc-300 leading-relaxed mb-10 max-w-xl font-medium">
                            İş emirleri, müşteri cari hesapları, yedek parça rezervasyonları ve faturalama — hepsini tek bir akıllı kokpitten yönetin.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/login"
                                className="group inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-2xl shadow-white/20"
                            >
                                Hemen Başlayın
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200"
                            >
                                Özellikleri Keşfet
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS ──────────────────────────────── */}
            <section className="bg-zinc-900 border-y border-zinc-800">
                <div className="max-w-7xl mx-auto px-6 py-14">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-4xl font-black text-white mb-1 tabular-nums">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-zinc-400 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────── */}
            <section id="features" className="py-28 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400 mb-4">
                            Özellikler
                        </p>
                        <h2 className="text-4xl font-black tracking-tight text-white mb-4">
                            İşletmenizin ihtiyacı olan her şey
                        </h2>
                        <p className="text-zinc-400 text-base max-w-xl mx-auto leading-relaxed">
                            Küçük atölyelerden büyük servis zincirlerine kadar ölçeklenen, eksiksiz bir operasyon platformu.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon
                            return (
                                <div
                                    key={feature.title}
                                    className="group relative p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:shadow-xl hover:shadow-zinc-900/50 hover:-translate-y-0.5"
                                >
                                    <div className="w-10 h-10 bg-zinc-800 group-hover:bg-zinc-700 rounded-xl flex items-center justify-center mb-4 transition-colors">
                                        <Icon className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-white text-base mb-2">{feature.title}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── WORKFLOW ───────────────────────────── */}
            <section className="py-28 bg-zinc-900 border-y border-zinc-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400 mb-4">
                                Nasıl Çalışır?
                            </p>
                            <h2 className="text-4xl font-black tracking-tight text-white mb-6 leading-tight">
                                Saniyeler içinde
                                <br />
                                iş emri, dakikalar içinde
                                <br />
                                fatura.
                            </h2>
                            <p className="text-zinc-400 text-base leading-relaxed mb-10">
                                Müşteri kaydından araç kabulüne, parça rezervasyonundan tahsilata uzanan tüm iş akışı birbirine bağlı ve otomatik.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { step: "01", text: "Müşteri ve araç kaydını hızla tamamlayın" },
                                    { step: "02", text: "Servis kokpitinde arızayı tanımlayın ve parça ekleyin" },
                                    { step: "03", text: "Tek tıkla fatura oluşturun ve tahsilat yapın" },
                                ].map((item) => (
                                    <div key={item.step} className="flex items-center gap-4 p-4 bg-zinc-950/60 rounded-xl border border-zinc-800">
                                        <span className="text-xs font-black text-zinc-500 tabular-nums w-6 shrink-0">{item.step}</span>
                                        <div className="w-px h-5 bg-zinc-700" />
                                        <span className="text-sm font-medium text-zinc-300">{item.text}</span>
                                        <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-[4/3] rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
                                <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                                    <div className="flex-1 mx-4 h-4 bg-zinc-800 rounded text-[10px] text-zinc-600 flex items-center px-2">
                                        servismaster.app/services/cockpit
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-3 gap-3 h-full">
                                    {/* Mock cockpit UI */}
                                    <div className="space-y-3">
                                        <div className="h-3 bg-zinc-800 rounded w-20" />
                                        <div className="bg-zinc-900 rounded-lg p-3 space-y-2 border border-zinc-800">
                                            <div className="h-2 bg-zinc-700 rounded w-full" />
                                            <div className="h-2 bg-zinc-700 rounded w-3/4" />
                                            <div className="h-2 bg-zinc-700 rounded w-1/2" />
                                        </div>
                                        <div className="bg-zinc-900 rounded-lg p-3 space-y-2 border border-zinc-800">
                                            <div className="h-2 bg-zinc-700 rounded w-full" />
                                            <div className="h-2 bg-zinc-700 rounded w-2/3" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-3 bg-zinc-800 rounded w-24" />
                                        <div className="bg-zinc-900 rounded-lg p-3 space-y-2 border border-zinc-800">
                                            <div className="h-16 bg-zinc-800 rounded" />
                                        </div>
                                        <div className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                                            <div className="h-2 bg-blue-900/60 rounded w-full mb-2" />
                                            <div className="h-2 bg-zinc-700 rounded w-full mb-2" />
                                            <div className="h-2 bg-zinc-700 rounded w-full" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-3 bg-zinc-800 rounded w-16" />
                                        <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-800/40">
                                            <div className="h-2 bg-emerald-700/60 rounded w-full mb-1" />
                                            <div className="text-[8px] text-emerald-400 font-bold">TAMAMLANDI</div>
                                        </div>
                                        <div className="bg-zinc-900 rounded-lg p-3 space-y-1.5 border border-zinc-800">
                                            <div className="h-2 bg-zinc-700 rounded w-full" />
                                            <div className="h-2 bg-zinc-700 rounded w-3/4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Glow effect */}
                            <div className="absolute -inset-4 bg-blue-500/5 rounded-3xl blur-2xl -z-10" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────── */}
            <section className="py-28 bg-zinc-950">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-8 tracking-wide uppercase">
                        <Clock className="w-3 h-3" />
                        Hemen Erişim Sağlayın
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
                        Atölyenizi dijital çağa
                        <br />
                        taşımaya hazır mısınız?
                    </h2>
                    <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-lg mx-auto">
                        Hemen giriş yapın ve Servis Master'ın tüm gücünü keşfedin. Kurulum yok, konfigürasyon yok.
                    </p>
                    <Link
                        href="/login"
                        className="group inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-base px-10 py-4 rounded-xl transition-all duration-200 shadow-2xl shadow-white/10"
                    >
                        Giriş Yap ve Başla
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────── */}
            <footer className="border-t border-zinc-800 bg-zinc-950">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-white rounded-md flex items-center justify-center">
                            <Wrench className="w-3 h-3 text-zinc-950 stroke-[2.5]" />
                        </div>
                        <span className="font-black text-sm tracking-tight text-white">Servis Master</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                        &copy; {new Date().getFullYear()} Servis Master. Tüm hakları saklıdır.
                    </p>
                    <Link
                        href="/login"
                        className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                    >
                        Giriş Yap →
                    </Link>
                </div>
            </footer>
        </div>
    )
}
