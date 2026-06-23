"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Pen, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteInvoiceAction } from "./actions"

export function InvoiceRowActions({ invoiceId }: { invoiceId: string }) {
    const router = useRouter()
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        const res = await deleteInvoiceAction(invoiceId)
        setIsDeleting(false)

        if (res.success) {
            toast.success("Fatura ve bağlı finansal hareketler silindi.")
            setIsDeleteDialogOpen(false)
        } else {
            toast.error(res.message || "Fatura silinirken bir hata oluştu.")
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-300">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-white shadow-md border-zinc-200">
                    <DropdownMenuItem 
                        className="cursor-pointer gap-2 text-zinc-600 font-medium hover:bg-zinc-50 focus:bg-zinc-50"
                        onClick={() => router.push(`/invoices/${invoiceId}`)}
                    >
                        <Eye className="h-4 w-4 text-zinc-500" /> Görüntüle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="cursor-pointer gap-2 text-zinc-600 font-medium hover:bg-zinc-50 focus:bg-zinc-50"
                        onClick={() => router.push(`/invoices/${invoiceId}`)}
                    >
                        <Pen className="h-4 w-4 text-zinc-500" /> Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="cursor-pointer gap-2 text-rose-600 font-medium focus:text-rose-700 focus:bg-rose-50"
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" /> Sil
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-white sm:rounded-xl shadow-lg border-zinc-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-zinc-900">Faturayı Sil</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-zinc-500 leading-relaxed mt-2">
                            Bu faturayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve faturaya bağlı tüm kasa/banka hareketleri de kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
                        <AlertDialogCancel 
                            disabled={isDeleting}
                            className="border-zinc-200 font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                            İptal
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }} 
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-colors"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Siliniyor..." : "Sil"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
