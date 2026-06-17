"use client"

import { Button } from "@/components/ui/button"
import { Printer, Share2 } from "lucide-react"

interface ServiceDetailActionsProps {
    serviceId: string
    serviceCode: string
    customerName: string
    phone: string
    plate: string
    totalAmount: number
}

export default function ServiceDetailActions({
    serviceId,
    serviceCode,
    customerName,
    phone,
    plate,
    totalAmount,
}: ServiceDetailActionsProps) {
    function handlePrint() {
        window.print()
    }

    function handleWhatsAppNotify() {
        const cleanPhone = phone.replace(/[^0-9]/g, "") // Clean spaces and formatting
        const formattedPhone = cleanPhone.startsWith("0") 
            ? `90${cleanPhone.slice(1)}` 
            : cleanPhone.startsWith("90") 
            ? cleanPhone 
            : `90${cleanPhone}` // Fallback assume TR country code

        const message = `Sayın ${customerName}, ${plate} plakalı aracınızın ${serviceCode} kodlu teknik servis işlemleri tamamlanmıştır.\n\nToplam Tutar: ${totalAmount.toLocaleString('tr-TR')} ₺\n\nDetaylı servis formunuza bu linkten erişebilirsiniz: http://localhost:3000/services/${serviceId}`
        
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
                Formu Yazdır
            </Button>
            <Button
                variant="outline"
                onClick={handleWhatsAppNotify}
                className="gap-2 border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 h-9 text-xs"
            >
                <Share2 className="w-4 h-4 text-green-600" />
                WhatsApp'tan Bildir
            </Button>
        </div>
    )
}
