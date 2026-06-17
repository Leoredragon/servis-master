"use client"

import { Button } from "@/components/ui/button"
import { Printer, Share2 } from "lucide-react"

interface InvoiceDetailActionsProps {
    invoiceId: string
    invoiceNo: string
    customerName: string
    phone: string
    totalAmount: number
    paymentType: string
}

export default function InvoiceDetailActions({
    invoiceId,
    invoiceNo,
    customerName,
    phone,
    totalAmount,
    paymentType,
}: InvoiceDetailActionsProps) {
    function handlePrint() {
        window.print()
    }

    function handleWhatsAppNotify() {
        const cleanPhone = phone.replace(/[^0-9]/g, "") // Clean phone formatting
        const formattedPhone = cleanPhone.startsWith("0") 
            ? `90${cleanPhone.slice(1)}` 
            : cleanPhone.startsWith("90") 
            ? cleanPhone 
            : `90${cleanPhone}`

        const paymentLabel = paymentType === "acik_hesap" 
            ? "Açık Hesap (Cari)" 
            : paymentType === "nakit" 
            ? "Nakit" 
            : paymentType === "kredi_karti" 
            ? "Kredi Kartı" 
            : "Havale/EFT"

        const message = `Sayın ${customerName}, ${invoiceNo} numaralı faturanız düzenlenmiştir.\n\nFatura Tutarı: ${totalAmount.toLocaleString('tr-TR')} ₺\nÖdeme Yöntemi: ${paymentLabel}\n\nFatura detaylarınıza bu linkten erişebilirsiniz: http://localhost:3000/invoices/${invoiceId}`
        
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank")
    }

    return (
        <div className="flex items-center gap-2 print:hidden">
            <Button
                variant="outline"
                onClick={handlePrint}
                className="gap-2 border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 h-9 text-xs"
            >
                <Printer className="w-4 h-4" />
                Faturayı Yazdır
            </Button>
            <Button
                variant="outline"
                onClick={handleWhatsAppNotify}
                className="gap-2 border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 h-9 text-xs"
            >
                <Share2 className="w-4 h-4 text-green-600" />
                WhatsApp'tan Paylaş
            </Button>
        </div>
    )
}
