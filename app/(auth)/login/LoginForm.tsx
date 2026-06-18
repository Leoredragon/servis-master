"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Zap } from "lucide-react"
import { toast } from "sonner"
import { login, demoLoginAction } from "../actions"

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
                    Giriş Yapılıyor...
                </>
            ) : (
                "Giriş Yap"
            )}
        </Button>
    )
}

export default function LoginForm() {
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [isDemoLoading, setIsDemoLoading] = useState(false)
    const errorMsg = searchParams.get("message")

    useEffect(() => {
        if (errorMsg) {
            toast.error(errorMsg)
        }
    }, [errorMsg])

    return (
        <div className="w-full max-w-sm px-6">
            <div className="flex flex-col space-y-2 mb-8">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">Hoş Geldiniz</h1>
                <p className="text-sm text-zinc-500">Hesabınıza giriş yapmak için e-posta ve şifrenizi girin.</p>
            </div>

            <form action={login} className="space-y-5">
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
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-xs font-semibold text-zinc-700">Şifre</Label>
                        <Link 
                            href="#" 
                            onClick={() => toast.info("Şifre sıfırlama işlemi için sistem yöneticinizle iletişime geçin.")}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors"
                        >
                            Şifremi Unuttum
                        </Link>
                    </div>
                    
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

                {/* Ayırıcı */}
                <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-zinc-200" />
                    <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest">veya</span>
                    <div className="flex-1 h-px bg-zinc-200" />
                </div>

                {/* Demo Giriş Butonu */}
                <button
                    type="button"
                    disabled={isDemoLoading}
                    onClick={async () => {
                        setIsDemoLoading(true)
                        try {
                            await demoLoginAction()
                        } catch {
                            setIsDemoLoading(false)
                        }
                    }}
                    className="w-full h-11 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isDemoLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Demo hesabı açılıyor...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                            Test Hesabıyla Hızlı Giriş (Demo)
                        </>
                    )}
                </button>

                <div className="text-center text-xs text-zinc-500 pt-2">
                    Hesabınız yok mu?{" "}
                    <Link href="/register" className="font-semibold text-zinc-900 hover:underline">
                        Kayıt Olun
                    </Link>
                </div>
            </form>
        </div>
    )
}
