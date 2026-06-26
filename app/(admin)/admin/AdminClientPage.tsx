"use client"

import { useState } from "react"
import { Building2, MoreHorizontal, Plus, Pencil, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { 
    adminCreateCompanyWithUser, 
    adminUpdateCompanyStatus, 
    adminDeleteCompany, 
    adminUpdateCompanyName 
} from "./actions"

export default function AdminClientPage({ formattedCompanies }: { formattedCompanies: any[] }) {
    const [createOpen, setCreateOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedCompany, setSelectedCompany] = useState<any>(null)
    const [newCompanyName, setNewCompanyName] = useState("")

    // Yeni Şirket Ekleme
    async function handleCreate(formData: FormData) {
        const res = await adminCreateCompanyWithUser(formData)
        if (res.success) {
            toast.success("Şirket ve kurucu kullanıcı başarıyla oluşturuldu.")
            setCreateOpen(false)
        } else {
            toast.error("Hata: " + res.message)
        }
    }

    // Şirket Adı Düzenleme
    async function handleEdit() {
        if (!newCompanyName) return
        const res = await adminUpdateCompanyName(selectedCompany.id, newCompanyName)
        if (res.success) {
            toast.success("Şirket adı güncellendi.")
            setEditOpen(false)
        } else {
            toast.error("Hata: " + res.message)
        }
    }

    // Durum Değiştirme (Aktif <-> Pasif)
    async function handleToggleStatus(company: any) {
        const newStatus = company.status === 'Aktif' ? 'passive' : 'active'
        const res = await adminUpdateCompanyStatus(company.id, newStatus)
        if (res.success) {
            toast.success(`Şirket durumu "${newStatus}" olarak güncellendi.`)
        } else {
            toast.error("Hata: " + res.message)
        }
    }

    // Şirketi Silme
    async function handleDelete() {
        const res = await adminDeleteCompany(selectedCompany.id)
        if (res.success) {
            toast.success("Şirket ve ilişkili veriler kalıcı olarak silindi.")
        } else {
            toast.error("Hata: " + res.message)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Aktif Şirketler (Tenant Listesi)</h2>
                
                {/* Yeni Şirket Ekleme Modalı */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 rounded-lg">
                            <Plus className="w-4 h-4" />
                            Yeni Servis/Şirket Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white border-zinc-200">
                        <DialogHeader>
                            <DialogTitle>Yeni Servis Ekle</DialogTitle>
                            <DialogDescription>
                                Yeni bir müşteri şirketi ve ilk yönetici hesabını oluşturun.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Şirket/Servis Adı</Label>
                                <Input name="companyName" required placeholder="Örn: X Teknik Servis" className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kurucu Ad Soyad</Label>
                                <Input name="fullName" required placeholder="Ahmet Yılmaz" className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kurucu E-posta</Label>
                                <Input name="email" type="email" required placeholder="ahmet@xservis.com" className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>Geçici Şifre</Label>
                                <Input name="password" type="password" required placeholder="En az 6 karakter" className="border-zinc-200" minLength={6} />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800">Oluştur ve Kaydet</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50/50">
                        <TableRow className="hover:bg-transparent border-zinc-200">
                            <TableHead className="font-medium text-zinc-500 h-11">Şirket Adı</TableHead>
                            <TableHead className="font-medium text-zinc-500 h-11">Kurucu E-posta</TableHead>
                            <TableHead className="font-medium text-zinc-500 h-11">Kayıt Tarihi</TableHead>
                            <TableHead className="font-medium text-zinc-500 h-11 text-center">Durum</TableHead>
                            <TableHead className="h-11 w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {formattedCompanies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">Henüz kayıtlı şirket bulunmuyor.</TableCell>
                            </TableRow>
                        ) : (
                            formattedCompanies.map((company) => (
                                <TableRow key={company.id} className="border-zinc-100 hover:bg-zinc-50/50">
                                    <TableCell className="font-medium text-zinc-900 py-4 flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-zinc-400" />
                                        {company.name}
                                    </TableCell>
                                    <TableCell className="text-zinc-500">{company.founderEmail}</TableCell>
                                    <TableCell className="text-zinc-500">{company.createdAt}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className={company.status === 'Aktif' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"}>
                                            {company.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        
                                        {/* 3 NOKTA MENÜSÜ */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100">
                                                    <span className="sr-only">Menüyü aç</span>
                                                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-white border-zinc-200 shadow-sm rounded-lg">
                                                <DropdownMenuItem onClick={() => { setSelectedCompany(company); setNewCompanyName(company.name); setEditOpen(true) }} className="cursor-pointer">
                                                    <Pencil className="mr-2 h-4 w-4 text-zinc-500" /> Şirketi Düzenle
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(company)} className="cursor-pointer">
                                                    <Power className="mr-2 h-4 w-4 text-zinc-500" /> 
                                                    {company.status === 'Aktif' ? 'Askıya Al (Pasif Yap)' : 'Aktif Et'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-100" />
                                                <DropdownMenuItem onClick={() => { setSelectedCompany(company); setDeleteOpen(true) }} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Şirketi Kalıcı Sil
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* ŞİRKET DÜZENLE MODALI */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white border-zinc-200">
                    <DialogHeader>
                        <DialogTitle>Şirketi Düzenle</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Şirket/Servis Adı</Label>
                            <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="border-zinc-200" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleEdit} className="bg-zinc-900 hover:bg-zinc-800">Güncelle</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SİLME ONAYI (ALERT DIALOG) */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-white border-zinc-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Şirketi Silmek İstediğinize Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-500">
                            Bu işlem <strong className="text-red-600">geri alınamaz</strong> ve bu teknik servise ait TÜM müşteriler, araçlar, faturalar ve servis kayıtları veritabanından kalıcı olarak silinecektir!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-200 hover:bg-zinc-50">İptal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Evet, Kalıcı Olarak Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
