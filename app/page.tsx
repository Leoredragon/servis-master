import Link from "next/link"
import Image from "next/image"
import {
    Wrench, CheckCircle, ArrowRight, Shield, Clock,
    BarChart3, Package, FileText, Users, Car,
    CalendarDays, Zap, Star, Check, ChevronRight
} from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
    title: "Servis Master | Teknik Servis Yönetim Sistemi",
    description: "Teknik servis operasyonlarınızı, müşteri takibinizi, stok ve faturalama süreçlerinizi tek platformdan yönetin. Hızlı iş emri, akıllı stok takibi ve anlık raporlama.",
}

const features = [
    {
        icon: Wrench,
        title: "3 Sütunlu Servis Kokpiti",
        description: "Müşteri bilgisi, iş adımları ve aksiyonlar — sayfayı kaydırmadan tek ekranda. Arıza kodu seçince çözüm otomatik dolabilir.",
        color: "blue",
    },
    {
        icon: Users,
        title: "Müşteri 360°",
        description: "Her müşteri için tam cari hesap, araç geçmişi, bakiye ve iletişim takibi. Hiçbir detay gözden kaçmaz.",
        color: "violet",
    },
    {
        icon: Package,
        title: "Akıllı Stok Yönetimi",
        description: "Otomatik parça rezervasyonu, kritik stok uyarıları ve stok hareketleri. Servis tamamlanınca stok otomatik düşer.",
        color: "emerald",
    },
    {
        icon: FileText,
        title: "Hızlı Faturalama",
        description: "Servis kaydından tek tıkla A4 fatura. Nakit, kart ve çek bölünmüş ödeme desteğiyle peşin tahsilat.",
        color: "orange",
    },
    {
        icon: BarChart3,
        title: "Finansal Analitik",
        description: "Günlük kasa, banka bakiyesi, 15 günlük gelir-gider grafiği ve açık faturalar anlık panelde.",
        color: "pink",
    },
    {
        icon: CalendarDays,
        title: "Randevu Ajandası",
        description: "Müşteri ve araç bazlı randevu takibi. Günlük, haftalık ve aylık takvim görünümü.",
        color: "cyan",
    },
]

const steps = [
    { num: "01", title: "Müşteri & Araç Kayıt", desc: "Telefon numarasıyla müşteriyi saniyeler içinde kaydedin veya bulun." },
    { num: "02", title: "Servis Kokpiti Aç", desc: "Araç kabulünden arıza tanısına, parça eklemeye kadar tek sayfada." },
    { num: "03", title: "Fatura & Tahsilat", desc: "Tek tıkla fatura, bölünmüş ödeme ve otomatik cari hesap güncelleme." },
]

const plans = [
    {
        name: "Başlangıç",
        price: "₺499",
        period: "/ay",
        desc: "Tek şube, küçük atölyeler için ideal.",
        highlight: false,
        features: [
            "500 servis kaydı / ay",
            "Müşteri & araç yönetimi",
            "Temel faturalama",
            "Stok takibi",
            "E-posta destek",
        ],
    },
    {
        name: "Profesyonel",
        price: "₺999",
        period: "/ay",
        desc: "Büyüyen atölyeler ve çok kullanıcılı ekipler.",
        highlight: true,
        features: [
            "Sınırsız servis kaydı",
            "Tüm Başlangıç özellikleri",
            "Gelişmiş stok rezervasyonu",
            "Finansal analitik & raporlar",
            "Çok kullanıcı (5 hesap)",
            "Öncelikli destek",
        ],
    },
    {
        name: "Kurumsal",
        price: "Özel",
        period: "",
        desc: "Zincir servisler ve özel entegrasyon.",
        highlight: false,
        features: [
            "Sınırsız şube",
            "Tüm Pro özellikleri",
            "API erişimi",
            "Özel raporlama",
            "SLA garantisi",
            "Yerinde eğitim & kurulum",
        ],
    },
]

const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
}

export default async function LandingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden scroll-smooth">

            {/* ── NAVBAR ─────────────────────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-zinc-950/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                            <Wrench className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                        </div>
                        <span className="font-black text-lg tracking-tight">Servis Master</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
                        <a href="#how" className="hover:text-white transition-colors">Nasıl Çalışır?</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Fiyatlar</a>
                    </nav>

                    <div className="flex items-center gap-5">
                        {user ? (
                            <Link
                                href="/dashboard"
                                className="group inline-flex items-center gap-1.5 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-sm px-4.5 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-white/10"
                            >
                                Yönetim Paneli
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-zinc-400 hover:text-white text-sm font-bold transition-colors"
                                >
                                    Giriş Yap
                                </Link>
                                <Link
                                    href="/register"
                                    className="group inline-flex items-center gap-1.5 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-sm px-4.5 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-white/10"
                                >
                                    Kayıt Ol
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* ── HERO ───────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center pt-16">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: "url('/landing_hero_bg.png')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/95 to-zinc-900/80" />
                {/* Glow orbs */}
                <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left */}
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/80 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            Teknik Servis &amp; Atölye Yönetimi
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                            Atölyenizi
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
                                dijital çağa
                            </span>
                            <br />
                            taşıyın.
                        </h1>

                        <p className="text-lg text-zinc-300 leading-relaxed mb-10 max-w-lg font-medium">
                            İş emirleri, müşteri cari hesapları, stok rezervasyonu ve anlık faturalama — hepsi tek bir akıllı platformda. Kurulum yok, karmaşıklık yok.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href={user ? "/dashboard" : "/login"}
                                className="group inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-2xl shadow-white/20"
                            >
                                {user ? "Yönetim Paneline Git" : "Ücretsiz Deneyin"}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                            <a
                                href="#features"
                                className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 backdrop-blur-sm border border-white/12 text-white font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200"
                            >
                                Özellikleri Gör
                            </a>
                        </div>

                        <div className="flex items-center gap-6 mt-10 text-sm text-zinc-500">
                            {["Kredi kartı gerekmez", "7 gün ücretsiz", "Anında kurulum"].map((t) => (
                                <span key={t} className="flex items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Right — Dashboard mockup */}
                    <div className="relative hidden lg:block">
                        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
                            <div className="h-8 bg-zinc-900 border-b border-white/8 flex items-center px-4 gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                                <span className="ml-3 text-[10px] text-zinc-600 font-mono">servismaster.app/dashboard</span>
                            </div>
                            <Image
                                src="/mockup_dashboard.png"
                                alt="Servis Master Dashboard Ekranı"
                                width={700}
                                height={460}
                                className="w-full object-cover"
                            />
                        </div>
                        <div className="absolute -inset-6 bg-blue-500/5 rounded-3xl blur-3xl -z-10" />
                    </div>
                </div>
            </section>

            {/* ── STATS ──────────────────────────────────────── */}
            <section className="border-y border-white/[0.06] bg-zinc-900/50">
                <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { val: "10x", label: "Daha Hızlı İş Emri" },
                        { val: "%0", label: "Kayıp Stok" },
                        { val: "7/24", label: "Bulut Erişim" },
                        { val: "5 dk", label: "Ortalama Fatura Süresi" },
                    ].map((s) => (
                        <div key={s.label}>
                            <div className="text-4xl font-black text-white mb-1">{s.val}</div>
                            <div className="text-sm text-zinc-500 font-medium">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ───────────────────────────────────── */}
            <section id="features" className="py-28">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400 mb-3">Özellikler</p>
                        <h2 className="text-4xl font-black tracking-tight mb-4">Tek platformda her şey var</h2>
                        <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
                            Küçük atölyeden çok şubeli servis zincirine kadar ölçeklenen, eksiksiz operasyon sistemi.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f) => {
                            const Icon = f.icon
                            const cls = colorMap[f.color]
                            return (
                                <div
                                    key={f.title}
                                    className="group p-6 rounded-2xl bg-zinc-900 border border-white/[0.06] hover:border-white/12 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${cls}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                                    <p className="text-zinc-400 text-sm leading-relaxed">{f.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* ── COCKPIT SCREENSHOT ─────────────────────────── */}
            <section className="py-20 bg-zinc-900/40 border-y border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-violet-400 mb-3">Servis Kokpiti</p>
                        <h2 className="text-3xl font-black tracking-tight mb-4">
                            Tüm detaylar, tek ekranda
                        </h2>
                        <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
                            3 sütunlu kokpit tasarımı ile müşteri bilgisi, iş adımları ve aksiyonlar aynı anda önünüzde.
                        </p>
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/8 shadow-2xl shadow-black/60 max-w-5xl mx-auto">
                        <div className="h-8 bg-zinc-900 border-b border-white/8 flex items-center px-4 gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                            <span className="ml-3 text-[10px] text-zinc-600 font-mono">servismaster.app/services/kokpit</span>
                        </div>
                        <Image
                            src="/mockup_cockpit.png"
                            alt="Servis Master Kokpit Ekranı"
                            width={1200}
                            height={700}
                            className="w-full object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ───────────────────────────────── */}
            <section id="how" className="py-28">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-400 mb-3">Nasıl Çalışır?</p>
                        <h2 className="text-4xl font-black tracking-tight mb-4">
                            Saniyeler içinde iş emri,<br />dakikalar içinde fatura
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {steps.map((s, i) => (
                            <div key={s.num} className="relative text-center p-8 rounded-2xl bg-zinc-900 border border-white/[0.06]">
                                <div className="text-5xl font-black text-white/5 absolute top-4 right-6 select-none">{s.num}</div>
                                <div className="w-12 h-12 bg-white/8 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/8">
                                    <span className="text-lg font-black text-white">{i + 1}</span>
                                </div>
                                <h3 className="font-bold text-white text-base mb-2">{s.title}</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                                {i < steps.length - 1 && (
                                    <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-700 hidden md:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PRICING ────────────────────────────────────── */}
            <section id="pricing" className="py-28 bg-zinc-900/40 border-y border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-orange-400 mb-3">Fiyatlandırma</p>
                        <h2 className="text-4xl font-black tracking-tight mb-4">Atölyenizin büyüklüğüne göre</h2>
                        <p className="text-zinc-400 max-w-md mx-auto text-base">
                            Tüm planlarda 7 günlük ücretsiz deneme. Kredi kartı gerekmez.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-2xl p-8 border transition-all duration-300 ${
                                    plan.highlight
                                        ? "bg-white text-zinc-950 border-white shadow-2xl shadow-white/20 scale-105"
                                        : "bg-zinc-900 text-white border-white/[0.08] hover:border-white/16"
                                }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-bold px-4 py-1.5 rounded-full border border-white/10">
                                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                        En Popüler
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.highlight ? "text-zinc-500" : "text-zinc-500"}`}>
                                        {plan.name}
                                    </div>
                                    <div className="flex items-end gap-1 mb-2">
                                        <span className="text-4xl font-black">{plan.price}</span>
                                        {plan.period && <span className={`text-sm pb-1 font-medium ${plan.highlight ? "text-zinc-500" : "text-zinc-500"}`}>{plan.period}</span>}
                                    </div>
                                    <p className={`text-sm leading-relaxed ${plan.highlight ? "text-zinc-600" : "text-zinc-500"}`}>{plan.desc}</p>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feat) => (
                                        <li key={feat} className="flex items-center gap-2.5 text-sm">
                                            <Check className={`w-4 h-4 shrink-0 ${plan.highlight ? "text-zinc-950" : "text-emerald-400"}`} />
                                            <span className={plan.highlight ? "text-zinc-700" : "text-zinc-300"}>{feat}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={user ? "/dashboard" : "/login"}
                                    className={`w-full text-center font-bold text-sm py-3.5 rounded-xl transition-all duration-200 block ${
                                        plan.highlight
                                            ? "bg-zinc-950 text-white hover:bg-zinc-800"
                                            : "bg-white/8 text-white hover:bg-white/14 border border-white/10"
                                    }`}
                                >
                                    {plan.price === "Özel" ? "Bize Ulaşın" : (user ? "Panele Git" : "Başlayın")}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ───────────────────────────────── */}
            <section className="py-28">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-400 mb-3">Kullanıcılar Ne Diyor?</p>
                        <h2 className="text-4xl font-black tracking-tight">Binlerce atölye güveniyor</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Murat Yılmaz",
                                role: "Servis Sahibi, İstanbul",
                                text: "Eskiden kağıt kalemle takip ediyorduk. Servis Master'a geçince haftalık raporlamam 5 dakikaya indi.",
                            },
                            {
                                name: "Ayşe Kaya",
                                role: "İşletme Müdürü, Ankara",
                                text: "Stok kaybımız sıfıra indi. Parça rezervasyonu otomatik, artık 'stok bitti' sürprizi yaşamıyoruz.",
                            },
                            {
                                name: "Hasan Demir",
                                role: "Oto Elektrik Servisi, İzmir",
                                text: "Müşterilerim hangi aşamada olduklarını sorduğunda saniyeler içinde cevap verebiliyorum.",
                            },
                        ].map((t) => (
                            <div key={t.name} className="p-6 rounded-2xl bg-zinc-900 border border-white/[0.06]">
                                <div className="flex gap-0.5 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                                <div>
                                    <div className="font-bold text-white text-sm">{t.name}</div>
                                    <div className="text-zinc-500 text-xs">{t.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────── */}
            <section className="py-28 bg-zinc-900/40 border-t border-white/[0.06]">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3.5 py-1.5 rounded-full mb-8 tracking-wide uppercase">
                        <Zap className="w-3 h-3" />
                        7 Gün Ücretsiz Deneyin
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 leading-tight">
                        Atölyenizi bugün<br />dijitale taşıyın.
                    </h2>
                    <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-md mx-auto">
                        Kredi kartı gerektirmez. 2 dakikada kurulum. İlk 7 gün tamamen ücretsiz.
                    </p>
                    <Link
                        href={user ? "/dashboard" : "/login"}
                        className="group inline-flex items-center justify-center gap-2 bg-white text-zinc-950 hover:bg-zinc-100 font-bold text-base px-10 py-4 rounded-xl transition-all duration-200 shadow-2xl shadow-white/10"
                    >
                        {user ? "Yönetim Paneline Git" : "Hemen Başlayın — Ücretsiz"}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ─────────────────────────────────────── */}
            <footer className="border-t border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-10">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-7 w-7 bg-white rounded-md flex items-center justify-center">
                                <Wrench className="w-3.5 h-3.5 text-zinc-950 stroke-[2.5]" />
                            </div>
                            <span className="font-black text-base tracking-tight">Servis Master</span>
                        </div>
                        <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                            Teknik servis ve atölye yönetiminde yeni standart. Hızlı, güvenilir, modern.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Ürün</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><a href="#features" className="hover:text-white transition-colors">Özellikler</a></li>
                            <li><a href="#pricing" className="hover:text-white transition-colors">Fiyatlar</a></li>
                            <li><Link href={user ? "/dashboard" : "/login"} className="hover:text-white transition-colors">{user ? "Yönetim Paneli" : "Giriş Yap"}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Destek</h4>
                        <ul className="space-y-2 text-sm text-zinc-400">
                            <li><a href="#" className="hover:text-white transition-colors">Yardım Merkezi</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">İletişim</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Gizlilik</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/[0.06] py-5">
                    <p className="text-center text-xs text-zinc-600">
                        &copy; {new Date().getFullYear()} Servis Master. Tüm hakları saklıdır.
                    </p>
                </div>
            </footer>
        </div>
    )
}
