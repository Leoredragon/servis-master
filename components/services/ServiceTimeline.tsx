"use client"

import { useState } from "react"
import { Plus, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { addServiceStage } from "./actions"

export default function ServiceTimeline({ serviceId, initialStages = [] }: { serviceId: string, initialStages?: any[] }) {
    const [stages, setStages] = useState(initialStages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleAddStage(formData: FormData) {
        setLoading(true)
        const stageName = formData.get("stage_name") as string
        const description = formData.get("description") as string
        const personnelName = formData.get("personnel_name") as string

        const res = await addServiceStage({ serviceId, stageName, description, personnelName })
        setLoading(false)

        if (res.success) {
            toast.success("Aşama başarıyla eklendi.")
            setStages([...stages, res.data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
            setOpen(false)
        } else {
            toast.error("Aşama eklenemedi: " + res.message)
        }
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">İş Emri Aşamaları (Timeline)</h3>
                    <p className="text-sm text-zinc-500">Aracın servis operasyonlarındaki adım adım yolculuğu</p>
                </div>
                
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2 h-9 px-4 rounded-lg">
                            <Plus className="w-4 h-4" />
                            Yeni Aşama Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-white border-zinc-200">
                        <DialogHeader>
                            <DialogTitle>Yeni İşlem Aşaması Ekle</DialogTitle>
                            <DialogDescription>
                                Araca yapılan yeni işlemi, süreci ve yapan personeli kaydedin.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleAddStage} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Aşama Adı</Label>
                                <Input name="stage_name" placeholder="Örn: Kaporta Onarımı Başladı" required className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>İşlemi Yapan Personel</Label>
                                <Input name="personnel_name" placeholder="Örn: Ali Usta" required className="border-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <Label>Açıklama (Opsiyonel)</Label>
                                <Textarea name="description" placeholder="Yapılan işlemlerle ilgili notlar..." className="resize-none border-zinc-200" rows={3} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
                                    {loading ? "Ekleniyor..." : "Aşamayı Kaydet"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative border-l-2 border-zinc-100 ml-3 md:ml-4 space-y-8">
                {stages.length === 0 ? (
                    <div className="ml-8 text-sm text-zinc-500 py-4">Henüz kayıtlı bir operasyon aşaması bulunmuyor.</div>
                ) : (
                    stages.map((stage, idx) => (
                        <div key={stage.id || idx} className="relative pl-8">
                            {/* Dot */}
                            <div className="absolute w-3.5 h-3.5 bg-blue-600 border-4 border-white rounded-full -left-[8px] top-1 shadow-sm box-content"></div>
                            
                            <div className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-sm font-bold text-zinc-900">{stage.stage_name}</h4>
                                {stage.description && (
                                    <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{stage.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-100">
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium bg-zinc-100 px-2 py-1 rounded-md">
                                        <User className="w-3.5 h-3.5" />
                                        {stage.personnel_name}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(stage.created_at).toLocaleString('tr-TR', {
                                            day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
