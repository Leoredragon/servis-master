import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { register } from "../actions"

export default async function RegisterPage(props: { searchParams: Promise<{ message: string }> }) {
    const searchParams = await props.searchParams;

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        ServisMaster
                    </h1>
                </div>
                
                <Card className="border-zinc-200 shadow-sm bg-white">
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
                                <Input id="fullName" name="fullName" placeholder="Örn: Ahmet Yılmaz" required className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" name="email" type="email" placeholder="ornek@sirket.com" required className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Şifre</Label>
                                <Input id="password" name="password" type="password" required className="border-zinc-200" />
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
            </div>
        </div>
    )
}