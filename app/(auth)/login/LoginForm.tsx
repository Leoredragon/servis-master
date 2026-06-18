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
import { login } from "../actions"

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
