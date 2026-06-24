"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { register } from "../actions"

function SubmitButton() {
    const { pending } = useFormStatus()
    
    return (
        <Button 
            type="submit" 
            disabled={pending} 
            className="w-full bg-zinc-950 hover:bg-zinc-900 text-white font-bold h-11 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Hesap Oluşturuluyor...
                </>
            ) : (
                "Hesap Oluştur"
            )}
        </Button>
    )
}

export default function RegisterForm() {
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const errorMsg = searchParams.get("message")

    useEffect(() => {
        if (errorMsg) {
            toast.error(errorMsg)
        }
    }, [errorMsg])

    return (
        <div className="w-full max-w-sm px-6">
            <div className="flex flex-col space-y-2 mb-8">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Kayıt Ol</h1>
                <p className="text-sm text-zinc-500">Servis Master dünyasına katılmak için bilgilerinizi girin.</p>
            </div>

            <form action={register} className="space-y-5">
                <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-zinc-700">Ad Soyad</Label>
                    <Input 
                        id="fullName" 
                        name="fullName" 
                        type="text" 
                        placeholder="Örn: Ahmet Yılmaz" 
                        required 
                        className="h-10 border-zinc-200 focus:border-zinc-400 focus:ring-0 rounded-lg text-sm bg-white"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-xs font-semibold text-zinc-700">Şirket / Servis Adı</Label>
                    <Input 
                        id="companyName" 
                        name="companyName" 
                        type="text" 
                        placeholder="Örn: Yılmaz Otomotiv" 
                        required 
                        className="h-10 border-zinc-200 focus:border-zinc-400 focus:ring-0 rounded-lg text-sm bg-white"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-zinc-700">E-posta Adresi</Label>
                    <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        placeholder="ornek@sirket.com" 
                        required 
                        className="h-10 border-zinc-200 focus:border-zinc-400 focus:ring-0 rounded-lg text-sm bg-white"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-zinc-700">Şifre</Label>
                    
                    <div className="relative">
                        <Input 
                            id="password" 
                            name="password" 
                            type={showPassword ? "text" : "password"} 
                            required 
                            className="h-10 border-zinc-200 focus:border-zinc-400 focus:ring-0 rounded-lg text-sm bg-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                <SubmitButton />

                <div className="text-center text-xs text-zinc-500 pt-2">
                    Zaten bir hesabınız var mı?{" "}
                    <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
                        Giriş Yapın
                    </Link>
                </div>
            </form>
        </div>
    )
}
