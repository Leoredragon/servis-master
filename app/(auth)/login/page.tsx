import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "../actions"

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
    const searchParams = await props.searchParams;

    return (
        <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Giriş Yap</CardTitle>
                <CardDescription className="text-center text-zinc-500">
                    Sisteme erişmek için e-posta ve şifrenizi girin
                </CardDescription>
            </CardHeader>

            {/* Form etiketini ekledik ve action parametresine server fonksiyonumuzu verdik */}
            <form action={login}>
                <CardContent className="space-y-4">
                    {searchParams?.message && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md text-center font-medium">
                            {searchParams.message}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        {/* name="email" attribute'u server action için zorunlu */}
                        <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Şifre</Label>
                            <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                Şifremi unuttum
                            </Link>
                        </div>
                        {/* name="password" attribute'u eklendi */}
                        <Input id="password" name="password" type="password" required />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Sisteme Giriş Yap
                    </Button>
                    <div className="text-center text-sm text-zinc-500">
                        Hesabınız yok mu?{" "}
                        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                            Kayıt Olun
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}