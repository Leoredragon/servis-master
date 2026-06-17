"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Trash2, Plus, Sparkles, Percent, Pencil, X, Check } from "lucide-react"
import { toast } from "sonner"
import { getCustomerGroups, createCustomerGroup, deleteCustomerGroup, updateCustomerGroup } from "./actions"

interface CustomerGroup {
    id: string
    name: string
    discount_rate: number
    created_at: string
}

interface ManageGroupsDialogProps {
    onGroupsChange?: () => void
}

export default function ManageGroupsDialog({ onGroupsChange }: ManageGroupsDialogProps) {
    const [open, setOpen] = useState(false)
    const [groups, setGroups] = useState<CustomerGroup[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Create form state
    const [name, setName] = useState("")
    const [discountRate, setDiscountRate] = useState("0")

    // Edit state
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")
    const [editDiscountRate, setEditDiscountRate] = useState("0")
    const [savingEdit, setSavingEdit] = useState(false)

    const fetchGroups = async () => {
        setLoading(true)
        try {
            const data = await getCustomerGroups()
            setGroups(data as unknown as CustomerGroup[])
        } catch (error) {
            console.error(error)
            toast.error("Gruplar yüklenirken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchGroups()
        }
    }, [open])

    const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!name.trim()) {
            toast.error("Grup adı zorunludur.")
            return
        }

        setSubmitting(true)
        try {
            const formData = new FormData()
            formData.append("name", name)
            formData.append("discountRate", discountRate)

            const res = await createCustomerGroup(formData)
            if (res.success) {
                toast.success("Müşteri grubu başarıyla oluşturuldu.")
                setName("")
                setDiscountRate("0")
                await fetchGroups()
                if (onGroupsChange) onGroupsChange()
            } else {
                toast.error(res.message || "Grup oluşturulurken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Grup oluşturulurken sistemsel hata oluştu.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteGroup = async (id: string, groupName: string) => {
        if (!confirm(`"${groupName}" grubunu silmek istediğinize emin misiniz? Bu gruba bağlı müşterilerin grup bağlantısı kaldırılacaktır.`)) {
            return
        }

        try {
            const res = await deleteCustomerGroup(id)
            if (res.success) {
                toast.success("Müşteri grubu silindi.")
                await fetchGroups()
                if (onGroupsChange) onGroupsChange()
            } else {
                toast.error(res.message || "Grup silinirken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Grup silinirken sistemsel hata oluştu.")
        }
    }

    const startEdit = (group: CustomerGroup) => {
        setEditingGroupId(group.id)
        setEditName(group.name)
        setEditDiscountRate(group.discount_rate.toString())
    }

    const cancelEdit = () => {
        setEditingGroupId(null)
        setEditName("")
        setEditDiscountRate("0")
    }

    const handleSaveEdit = async (id: string) => {
        if (!editName.trim()) {
            toast.error("Grup adı boş bırakılamaz.")
            return
        }
        setSavingEdit(true)
        try {
            const res = await updateCustomerGroup(id, editName.trim(), parseFloat(editDiscountRate) || 0)
            if (res.success) {
                toast.success("Grup başarıyla güncellendi.")
                cancelEdit()
                await fetchGroups()
                if (onGroupsChange) onGroupsChange()
            } else {
                toast.error(res.message || "Grup güncellenirken hata oluştu.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Grup güncellenirken sistemsel hata oluştu.")
        } finally {
            setSavingEdit(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900 gap-2 font-medium">
                    <Settings className="w-4 h-4 text-zinc-500" />
                    Grupları Yönet
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 bg-white overflow-hidden">
                {/* Header: Sabit */}
                <DialogHeader className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Müşteri İlişkileri</span>
                    </div>
                    <DialogTitle className="text-lg font-bold text-zinc-950">Müşteri Grupları</DialogTitle>
                    <DialogDescription className="text-zinc-500 text-xs">
                        Müşterilerinizi gruplandırın ve bu gruplara özel iskonto oranları tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                {/* Body: Kaydırılabilir */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Form: Yeni Grup Ekle */}
                    <form onSubmit={handleCreateGroup} className="px-6 py-5 border-b border-zinc-100 bg-white space-y-4">
                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Yeni Grup Ekle</div>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="groupName" className="text-xs text-zinc-600 font-medium">Grup Adı</Label>
                                <Input
                                    id="groupName"
                                    placeholder="Örn: VIP Müşteriler, Bayiler"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="border-zinc-200 text-xs h-9 focus-visible:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="groupDiscount" className="text-xs text-zinc-600 font-medium">Varsayılan İskonto Oranı (%)</Label>
                                <div className="relative">
                                    <Input
                                        id="groupDiscount"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={discountRate}
                                        onChange={(e) => setDiscountRate(e.target.value)}
                                        className="border-zinc-200 text-xs h-9 pr-8 focus-visible:ring-blue-500"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-zinc-400">
                                        <Percent className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 mt-2 gap-1.5 shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {submitting ? "Ekleniyor..." : "Grubu Kaydet"}
                        </Button>
                    </form>

                    {/* List: Mevcut Gruplar */}
                    <div className="px-6 py-5 space-y-3 bg-zinc-50/30">
                        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Mevcut Gruplar</div>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">Yükleniyor...</span>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-12 border border-dashed border-zinc-200 rounded-lg bg-white">
                                <p className="text-xs text-zinc-400">Tanımlı müşteri grubu bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {groups.map((group) => (
                                    <div
                                        key={group.id}
                                        className="bg-white border border-zinc-150 rounded-lg shadow-xs hover:border-zinc-300 transition-colors"
                                    >
                                        {editingGroupId === group.id ? (
                                            /* Edit Mode */
                                            <div className="p-3.5 space-y-3">
                                                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Grubu Düzenle</div>
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-zinc-600 font-medium">Grup Adı</Label>
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="h-8 text-xs border-zinc-200 focus-visible:ring-blue-500"
                                                            placeholder="Grup adı"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs text-zinc-600 font-medium">İskonto Oranı (%)</Label>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                value={editDiscountRate}
                                                                onChange={(e) => setEditDiscountRate(e.target.value)}
                                                                className="h-8 text-xs border-zinc-200 pr-8 focus-visible:ring-blue-500"
                                                            />
                                                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-zinc-400">
                                                                <Percent className="w-3 h-3" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={cancelEdit}
                                                        className="h-7 text-xs text-zinc-500 hover:text-zinc-700 gap-1"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        İptal
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => handleSaveEdit(group.id)}
                                                        disabled={savingEdit}
                                                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        {savingEdit ? "Kaydediliyor..." : "Kaydet"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* View Mode */
                                            <div className="flex items-center justify-between p-3.5">
                                                <div className="space-y-0.5">
                                                    <div className="font-semibold text-zinc-800 text-sm">{group.name}</div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                        <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                                            %{group.discount_rate} İskonto
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => startEdit(group)}
                                                        className="text-zinc-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        <span className="sr-only">Düzenle</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleDeleteGroup(group.id, group.name)}
                                                        className="text-zinc-400 hover:text-red-600 hover:bg-red-50 h-8 w-8"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        <span className="sr-only">Sil</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Sabit */}
                <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs h-9"
                    >
                        Kapat
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
