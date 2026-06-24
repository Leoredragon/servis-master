"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateProfileAction } from "./actions"

interface ProfileSettingsProps {
    user: any
    profile: any
}

// Function to get initials from full name
function getInitials(name: string) {
    if (!name) return "U"
    const parts = name.split(" ").filter(p => p.length > 0)
    if (parts.length === 0) return "U"
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ProfileSettings({ user, profile }: ProfileSettingsProps) {
    const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || "")
    const [isSaving, setIsSaving] = useState(false)

    async function handleUpdateProfile(e: React.FormEvent) {
        e.preventDefault()
        setIsSaving(true)

        const formData = new FormData()
        formData.append("fullName", fullName)

        try {
            const res = await updateProfileAction(formData)
            if (res.success) {
                toast.success(res.message)
            } else {
                toast.error(res.message)
            }
        } catch (error: any) {
            toast.error("Profil güncellenemedi: " + error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const companyName = profile?.companies?.name || "Şirket Atanmamış"
    const packageName = profile?.package_name || "Bilinmiyor"
    const roleName = profile?.role === "admin" ? "Yönetici (Admin)" : "Kullanıcı"

    return (
        <div className="max-w-2xl mx-auto py-10 space-y-8 font-sans">
            {/* Header / Avatar */}
            <div className="flex flex-col items-center justify-center space-y-4 mb-8">
                <div className="h-24 w-24 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 text-3xl font-medium shadow-sm">
                    {getInitials(fullName)}
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{fullName}</h1>
                    <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-100/50 p-1 rounded-lg">
                    <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        Profil
                    </TabsTrigger>
                    <TabsTrigger value="company" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        Şirket Bilgileri
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                        Paket & Yetki
                    </TabsTrigger>
                </TabsList>

                {/* Profil Sekmesi */}
                <TabsContent value="profile" className="mt-4">
                    <Card className="border-zinc-200 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-zinc-700 font-semibold text-sm">
                                        Ad Soyad
                                    </Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="border-zinc-200 focus-visible:ring-zinc-400 bg-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-700 font-semibold text-sm">
                                        E-posta Adresi
                                    </Label>
                                    <Input
                                        id="email"
                                        value={user?.email || ""}
                                        disabled
                                        readOnly
                                        className="border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-zinc-400">E-posta adresi değiştirilemez.</p>
                                </div>
                                
                                <div className="pt-2">
                                    <Button 
                                        type="submit" 
                                        disabled={isSaving}
                                        className="w-full sm:w-auto bg-zinc-950 hover:bg-zinc-900 text-white shadow-sm"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            "Değişiklikleri Kaydet"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Şirket Bilgileri Sekmesi */}
                <TabsContent value="company" className="mt-4">
                    <Card className="border-zinc-200 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <div className="space-y-2">
                                <Label className="text-zinc-700 font-semibold text-sm uppercase tracking-wider">
                                    Bağlı Olunan Şirket / Servis
                                </Label>
                                <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-900 font-medium">
                                    {companyName}
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Şu an bu şirketin izole edilmiş alanında çalışıyorsunuz. Müşterileriniz ve finans kayıtlarınız tamamen size aittir.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Paket & Yetki Sekmesi */}
                <TabsContent value="plan" className="mt-4">
                    <Card className="border-zinc-200 shadow-sm bg-white">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                                <div className="space-y-2 flex-1">
                                    <Label className="text-zinc-700 font-semibold text-sm uppercase tracking-wider block">
                                        Mevcut Paket
                                    </Label>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100 px-3 py-1 text-sm font-medium">
                                        {packageName}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2 flex-1">
                                    <Label className="text-zinc-700 font-semibold text-sm uppercase tracking-wider block">
                                        Sistem Rolü
                                    </Label>
                                    <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 hover:bg-zinc-100 border border-zinc-200 px-3 py-1 text-sm font-medium">
                                        {roleName}
                                    </Badge>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-6 pt-4 border-t border-zinc-100">
                                Paket yükseltmeleri veya yetki değişiklikleri için lütfen destek ekibiyle iletişime geçin.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
