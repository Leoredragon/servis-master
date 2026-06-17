"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { logout } from "@/app/(auth)/actions"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { User, Mail, Shield, LogOut, Key, Percent, FileText, Moon, Sun, Palette } from "lucide-react"

interface ProfileSettingsProps {
    user: any
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
    const [activeSection, setActiveSection] = useState<"profile" | "invoice" | "appearance">("profile")

    // Password Form State
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordLoading, setPasswordLoading] = useState(false)

    // Invoice Settings State
    const [defaultKdv, setDefaultKdv] = useState("20")
    const [defaultNotes, setDefaultNotes] = useState("")

    // Appearance State
    const [theme, setTheme] = useState("light")
    const [accentColor, setAccentColor] = useState("blue")

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedKdv = localStorage.getItem("default_kdv_rate") || "20"
        const savedNotes = localStorage.getItem("default_invoice_notes") || ""
        const savedTheme = localStorage.getItem("theme_preference") || "light"
        const savedAccent = localStorage.getItem("accent_color") || "blue"

        setDefaultKdv(savedKdv)
        setDefaultNotes(savedNotes)
        setTheme(savedTheme)
        setAccentColor(savedAccent)
    }, [])

    // Save Invoice Settings
    function handleSaveInvoiceSettings() {
        localStorage.setItem("default_kdv_rate", defaultKdv)
        localStorage.setItem("default_invoice_notes", defaultNotes)
        toast.success("Fatura varsayılan ayarları başarıyla kaydedildi!")
    }

    // Save Theme & Accent
    function handleSaveAppearanceSettings(newTheme: string, newAccent: string) {
        setTheme(newTheme)
        setAccentColor(newAccent)
        localStorage.setItem("theme_preference", newTheme)
        localStorage.setItem("accent_color", newAccent)

        // Apply dark mode class to document element
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }

        toast.success(`Arayüz tercihleri güncellendi: Tema: ${newTheme === "dark" ? "Koyu" : "Açık"}, Renk: ${newAccent}`)
    }

    // Change Password via Supabase Client SDK
    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()

        if (!password || password.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır.")
            return
        }

        if (password !== confirmPassword) {
            toast.error("Şifreler eşleşmiyor.")
            return
        }

        setPasswordLoading(true)
        const supabase = createClient()
        
        try {
            const { error } = await supabase.auth.updateUser({ password })
            if (error) {
                toast.error("Şifre güncellenirken hata oluştu: " + error.message)
            } else {
                toast.success("Şifreniz başarıyla güncellendi!")
                setPassword("")
                setConfirmPassword("")
            }
        } catch (err: any) {
            toast.error("Bir hata oluştu: " + err.message)
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Hesap & Sistem Ayarları</h2>
                <p className="text-sm text-zinc-500 mt-1">
                    Kişisel profilinizi, faturalandırma varsayılanlarını ve ekran görünümünü buradan yapılandırın.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Navigation Tabs */}
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveSection("profile")}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                            activeSection === "profile"
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Profil & Güvenlik
                    </button>
                    <button
                        onClick={() => setActiveSection("invoice")}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                            activeSection === "invoice"
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
                        }`}
                    >
                        <Percent className="w-4 h-4" />
                        Fatura Ayarları
                    </button>
                    <button
                        onClick={() => setActiveSection("appearance")}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2.5 transition-colors ${
                            activeSection === "appearance"
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
                        }`}
                    >
                        <Palette className="w-4 h-4" />
                        Görünüm & Tema
                    </button>
                </div>

                {/* Right Settings Cards */}
                <div className="md:col-span-3">
                    {/* SECTION 1: Profile & Password */}
                    {activeSection === "profile" && (
                        <div className="space-y-6">
                            <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-zinc-900">Profil Bilgileri</CardTitle>
                                            <CardDescription className="text-xs">Sistemde kayıtlı genel kullanıcı bilgileriniz.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ad Soyad</span>
                                            <div className="text-sm text-zinc-800 font-semibold">{user?.user_metadata?.full_name || "Kullanıcı"}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">E-posta</span>
                                            <div className="text-sm text-zinc-800 font-semibold">{user?.email}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Rol Yetkisi</span>
                                            <div className="text-sm text-zinc-800 font-semibold flex items-center gap-1">
                                                <Shield className="w-3.5 h-3.5 text-zinc-400" /> Yönetici (Admin)
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Kullanıcı ID</span>
                                            <div className="text-[10px] text-zinc-500 font-mono">{user?.id}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-zinc-900">Şifre Değiştir</CardTitle>
                                            <CardDescription className="text-xs">Güvenliğiniz için belirli aralıklarla şifrenizi güncelleyin.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <form onSubmit={handleChangePassword}>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="newPassword">Yeni Şifre</Label>
                                                <Input
                                                    id="newPassword"
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="En az 6 karakter"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                                                <Input
                                                    id="confirmPassword"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    placeholder="Şifreyi onaylayın"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-5 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
                                        <form action={logout}>
                                            <Button type="submit" variant="ghost" className="text-rose-600 hover:bg-rose-50 font-medium text-xs gap-1.5">
                                                <LogOut className="w-4 h-4" /> Oturumu Kapat
                                            </Button>
                                        </form>
                                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={passwordLoading}>
                                            {passwordLoading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    )}

                    {/* SECTION 2: Invoice Defaults */}
                    {activeSection === "invoice" && (
                        <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-zinc-900">Varsayılan Fatura Ayarları</CardTitle>
                                        <CardDescription className="text-xs">Fatura oluştururken otomatik yüklenen KDV ve açıklama/not bilgileri.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-2">
                                    <Label>Varsayılan KDV Oranı</Label>
                                    <Select value={defaultKdv} onValueChange={setDefaultKdv}>
                                        <SelectTrigger className="border-zinc-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="20">%20 (Standart Hizmet)</SelectItem>
                                            <SelectItem value="10">%10 (İndirimli KDV)</SelectItem>
                                            <SelectItem value="0">%0 (Muaf)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="defNotes">Fatura Altı Standart Notlar / Açıklama Şablonu</Label>
                                    <Textarea
                                        id="defNotes"
                                        value={defaultNotes}
                                        onChange={e => setDefaultNotes(e.target.value)}
                                        placeholder="Örn: 10.000 KM Servis Bakım Hizmeti ve Yedek Parça Bedeli..."
                                        className="h-24 resize-none border-zinc-200"
                                    />
                                    <p className="text-xs text-zinc-400 mt-1">Bu not, yeni fatura oluşturma ekranında ürün/hizmet kalem açıklaması alanına otomatik yazılacaktır.</p>
                                </div>
                            </CardContent>
                            <CardFooter className="p-5 bg-zinc-50/50 border-t border-zinc-100 flex justify-end">
                                <Button onClick={handleSaveInvoiceSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                    Fatura Ayarlarını Kaydet
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* SECTION 3: Appearance & Theme */}
                    {activeSection === "appearance" && (
                        <Card className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <Palette className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-zinc-900">Arayüz & Tema Tercihleri</CardTitle>
                                        <CardDescription className="text-xs">Çalışma ortamı görünümünüzü ve renk şemanızı değiştirin.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                <div className="space-y-3">
                                    <Label>Tema Modu</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveAppearanceSettings("light", accentColor)}
                                            className={`flex items-center justify-center gap-2 p-4 border rounded-lg text-sm font-semibold transition-all ${
                                                theme === "light"
                                                    ? "border-blue-600 bg-blue-50/30 text-blue-600 shadow-sm"
                                                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                        >
                                            <Sun className="w-4 h-4" /> Açık Tema
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSaveAppearanceSettings("dark", accentColor)}
                                            className={`flex items-center justify-center gap-2 p-4 border rounded-lg text-sm font-semibold transition-all ${
                                                theme === "dark"
                                                    ? "border-blue-600 bg-blue-50/30 text-blue-600 shadow-sm"
                                                    : "border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                                            }`}
                                        >
                                            <Moon className="w-4 h-4" /> Koyu Tema
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-zinc-100">
                                    <Label>OMES Arayüz Vurgu Rengi</Label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { name: "Mavi", color: "blue", hex: "bg-blue-600" },
                                            { name: "Yeşil", color: "emerald", hex: "bg-emerald-600" },
                                            { name: "Mor", color: "violet", hex: "bg-violet-600" },
                                            { name: "Pembe", color: "rose", hex: "bg-rose-600" },
                                            { name: "Turuncu", color: "amber", hex: "bg-amber-600" },
                                        ].map(colorObj => (
                                            <button
                                                key={colorObj.color}
                                                type="button"
                                                onClick={() => handleSaveAppearanceSettings(theme, colorObj.color)}
                                                className={`flex flex-col items-center gap-1.5 p-2.5 border rounded-lg text-xs font-semibold transition-all ${
                                                    accentColor === colorObj.color
                                                        ? "border-blue-600 bg-zinc-50 text-zinc-900"
                                                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-500"
                                                }`}
                                            >
                                                <span className={`w-6 h-6 rounded-full ${colorObj.hex} shadow-inner`} />
                                                {colorObj.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

// Simple card footer fallback
function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center ${className}`}>{children}</div>
}
