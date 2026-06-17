import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { register } from "../actions"

export default async function RegisterPage(props: { searchParams: Promise<{ message: string }> }) {
    const searchParams = await props.searchParams;

    return (
        <Card className="border-zinc-200 shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Kayıt Ol</CardTitle>
                <CardDescription className="text-center text-zinc-500">
                    Yeni bir hesap oluşturmak için bilgilerinizi girin
                </CardDescription>
            </CardHeader>

            <form action={register}>
                <CardContent className="space-y-4">
                    {searchParams?.message && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md text-center font-medium">
                            {searchParams.message}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Ad Soyad</Label>
                        <Input id="fullName" name="fullName" placeholder="Örn: Ahmet Yılmaz" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Şifre</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Hesap Oluştur
                    </Button>
                    <div className="text-center text-sm text-zinc-500">
                        Zaten bir hesabınız var mı?{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Giriş Yapın
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}