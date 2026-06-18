"use client"

import { Button } from "@/components/ui/button"
import { Printer, Share2, Receipt } from "lucide-react"

interface ServiceDetailActionsProps {
    serviceId: string
    serviceCode: string
    customerName: string
    phone: string
    plate: string
    totalAmount: number
    customerId?: string
    serviceItems?: any[]
}

export default function ServiceDetailActions({
    serviceId,
    serviceCode,
    customerName,
    phone,
    plate,
    totalAmount,
    customerId,
    serviceItems = [],
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

    function handleConvertToInvoice() {
        const event = new CustomEvent("open-new-invoice", {
            detail: {
                customerId,
                serviceId,
                items: serviceItems.map((item: any) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unit_price
                }))
            }
        })
        window.dispatchEvent(event)
    }

    return (
        <div className="flex items-center gap-2 print:hidden">
            <Button
                variant="outline"
                onClick={handleConvertToInvoice}
                className="gap-2 border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 h-9 text-xs"
            >
                <Receipt className="w-4 h-4 text-blue-600" />
                Faturaya Dönüştür
            </Button>
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
