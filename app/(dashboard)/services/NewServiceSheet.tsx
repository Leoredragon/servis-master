"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

export default function NewServiceSheet() {
    return (
        <Sheet>
            {/* Butonu direkt Sheet'in içine Trigger olarak veriyoruz */}
            <SheetTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Yeni Servis Kaydı
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl">Yeni Servis Kaydı</SheetTitle>
                    <SheetDescription>
                        Araç için yeni bir iş emri oluşturun. Gerekli alanları doldurup kaydedin.
                    </SheetDescription>
                </SheetHeader>

                <form className="space-y-6">
                    {/* Müşteri ve Araç Seçimi */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Müşteri Seçimi</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Müşteri arayın veya seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* İleride bunlar veritabanından gelecek */}
                                    <SelectItem value="ahmet">Ahmet Yılmaz</SelectItem>
                                    <SelectItem value="mehmet">Mehmet Demir</SelectItem>
                                    <SelectItem value="kurumsal">Kurumsal Lojistik A.Ş.</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Araç Seçimi</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Müşterinin aracını seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="honda">Honda CBR900RR (34 ABC 123)</SelectItem>
                                    <SelectItem value="kawasaki">Kawasaki ZX-10R (06 XYZ 987)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Servis Detayları */}
                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Servis Tipi</Label>
                                <Select defaultValue="bakim">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bakim">Periyodik Bakım</SelectItem>
                                        <SelectItem value="tamir">Tamir / Onarım</SelectItem>
                                        <SelectItem value="muayene">Muayene Hazırlık</SelectItem>
                                        <SelectItem value="modifikasyon">Modifikasyon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Öncelik</Label>
                                <Select defaultValue="normal">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dusuk">Düşük</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="yuksek">Yüksek</SelectItem>
                                        <SelectItem value="acil">Acil!</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Müşteri Şikayeti / Talep</Label>
                            <Textarea
                                placeholder="Müşterinin belirttiği sorunları veya istekleri buraya yazın..."
                                className="resize-none h-24"
                            />
                        </div>
                    </div>

                    <SheetFooter className="pt-6 mt-6 border-t border-zinc-100">
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            Kaydı Oluştur
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}