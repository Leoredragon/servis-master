import NewServiceDialog from "@/components/services/NewServiceDialog"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal } from "lucide-react"

// Geçici (Mock) Veriler - İleride Supabase'den gelecek
const services = [
    {
        id: "SERV-2606-001",
        customer: "Ahmet Yılmaz",
        vehicle: "Honda CBR900RR - 34 ABC 123",
        date: "17 Haz 2026",
        status: "İşlemde",
        total: "12.500 ₺",
    },
    {
        id: "SERV-2606-002",
        customer: "Mehmet Demir",
        vehicle: "Kawasaki ZX-10R - 06 XYZ 987",
        date: "17 Haz 2026",
        status: "Beklemede",
        total: "-",
    },
    {
        id: "SERV-2606-003",
        customer: "Kurumsal Lojistik A.Ş.",
        vehicle: "Yamaha MT-09 - 35 DEF 456",
        date: "16 Haz 2026",
        status: "Tamamlandı",
        total: "4.500 ₺",
    },
]

export default function ServicesPage() {
    return (
        <div className="space-y-6">
            {/* Sayfa Üst Bilgisi ve Aksiyonlar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Servis Kayıtları</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        Tüm araç bakım, onarım ve operasyon süreçlerini buradan yönetin.
                    </p>
                </div>

                {/* Ortada flulaşarak açılan Yeni Servis Kaydı modalımız */}
                <NewServiceDialog />
            </div>

            {/* Tablo Alanı */}
            <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow>
                            <TableHead className="w-[120px] font-medium">Servis Kodu</TableHead>
                            <TableHead className="font-medium">Müşteri</TableHead>
                            <TableHead className="font-medium">Araç Bilgisi</TableHead>
                            <TableHead className="font-medium">Giriş Tarihi</TableHead>
                            <TableHead className="font-medium">Durum</TableHead>
                            <TableHead className="text-right font-medium">Toplam Tutar</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((service) => (
                            <TableRow key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                                <TableCell className="font-medium text-zinc-900">{service.id}</TableCell>
                                <TableCell>{service.customer}</TableCell>
                                <TableCell className="text-zinc-500">{service.vehicle}</TableCell>
                                <TableCell className="text-zinc-500">{service.date}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={
                                            service.status === "Tamamlandı" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" :
                                                service.status === "İşlemde" ? "bg-blue-50 text-blue-700 hover:bg-blue-50" :
                                                    "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                        }
                                    >
                                        {service.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">{service.total}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}