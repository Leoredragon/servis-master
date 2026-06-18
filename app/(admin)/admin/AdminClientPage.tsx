'use client'

import { useState, useTransition } from "react"
import { 
    Search, User, Key, Trash2, Shield, 
    Layers, AlertTriangle, CheckCircle, XCircle, Loader2
} from "lucide-react"
import { toast } from "sonner"
import { 
    updateUserPackageAction, 
    updateUserStatusAction, 
    updateUserRoleAction, 
    resetUserPasswordAction, 
    deleteUserAction 
} from "./actions"

interface Profile {
    id: string
    email: string
    full_name: string
    role: string
    package_name: string
    status: string
    created_at: string
}

export default function AdminClientPage({ initialProfiles }: { initialProfiles: Profile[] }) {
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles)
    const [search, setSearch] = useState("")
    
    // States for Password Reset Modal
    const [resettingUserId, setResettingUserId] = useState<string | null>(null)
    const [newPassword, setNewPassword] = useState("")
    const [isResetPending, startReset] = useTransition()

    // States for Delete Confirmation Modal
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [isDeletePending, startDelete] = useTransition()

    // Filtered profiles
    const filteredProfiles = profiles.filter(p => {
        const q = search.toLowerCase()
        return (
            p.email.toLowerCase().includes(q) ||
            (p.full_name || "").toLowerCase().includes(q) ||
            p.package_name.toLowerCase().includes(q)
        )
    })

    const targetResetUser = profiles.find(p => p.id === resettingUserId)
    const targetDeleteUser = profiles.find(p => p.id === deletingUserId)

    // Action Handlers
    async function handlePackageChange(userId: string, newPkg: string) {
        try {
            await updateUserPackageAction(userId, newPkg)
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, package_name: newPkg } : p))
            toast.success("Kullanıcı paketi güncellendi.")
        } catch (err: any) {
            toast.error(err.message || "Paket güncellenirken hata oluştu.")
        }
    }

    async function handleStatusChange(userId: string, newStatus: string) {
        try {
            await updateUserStatusAction(userId, newStatus)
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p))
            toast.success("Kullanıcı durumu güncellendi.")
        } catch (err: any) {
            toast.error(err.message || "Durum güncellenirken hata oluştu.")
        }
    }

    async function handleRoleChange(userId: string, newRole: string) {
        try {
            await updateUserRoleAction(userId, newRole)
            setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p))
            toast.success("Kullanıcı rolü güncellendi.")
        } catch (err: any) {
            toast.error(err.message || "Rol güncellenirken hata oluştu.")
        }
    }

    function handleResetPasswordSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!resettingUserId || !newPassword) return

        if (newPassword.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır.")
            return
        }

        startReset(async () => {
            try {
                await resetUserPasswordAction(resettingUserId, newPassword)
                toast.success("Şifre başarıyla güncellendi.")
                setResettingUserId(null)
                setNewPassword("")
            } catch (err: any) {
                toast.error(err.message || "Şifre sıfırlanırken hata oluştu.")
            }
        })
    }

    function handleDeleteSubmit() {
        if (!deletingUserId) return

        startDelete(async () => {
            try {
                await deleteUserAction(deletingUserId)
                setProfiles(prev => prev.filter(p => p.id !== deletingUserId))
                toast.success("Kullanıcı sistemden tamamen silindi.")
                setDeletingUserId(null)
            } catch (err: any) {
                toast.error(err.message || "Kullanıcı silinirken hata oluştu.")
            }
        })
    }

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Kayıtlı Firmalar / Üyeler</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Sistemdeki tüm kayıtlı bayileri izleyin, paket ve rol yetkilerini düzenleyin.
                    </p>
                </div>
                
                {/* Search bar */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Firma adı veya email arayın..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:outline-hidden transition-colors"
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/70 border-b border-zinc-200 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                <th className="px-6 py-4">Firma / Üye</th>
                                <th className="px-6 py-4">Kayıt Tarihi</th>
                                <th className="px-6 py-4">Paket Bilgisi</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Üyelik Durumu</th>
                                <th className="px-6 py-4 text-right">Yönetsel Eylemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm">
                            {filteredProfiles.length > 0 ? (
                                filteredProfiles.map(profile => (
                                    <tr key={profile.id} className="hover:bg-zinc-50/30 transition-colors">
                                        {/* Avatar / Name / Email */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                                                    <User className="w-4 h-4 text-zinc-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-zinc-900 truncate">
                                                        {profile.full_name || "İsimsiz Firma"}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 truncate">
                                                        {profile.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        {/* Created At */}
                                        <td className="px-6 py-4 text-zinc-500 text-xs">
                                            {new Date(profile.created_at).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>

                                        {/* Package (Changeable) */}
                                        <td className="px-6 py-4">
                                            <select
                                                value={profile.package_name}
                                                onChange={e => handlePackageChange(profile.id, e.target.value)}
                                                className="bg-transparent font-medium text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 outline-hidden focus:border-zinc-400 cursor-pointer"
                                            >
                                                <option value="Başlangıç">Başlangıç (₺499)</option>
                                                <option value="Profesyonel">Profesyonel (₺999)</option>
                                                <option value="Kurumsal">Kurumsal (Özel)</option>
                                            </select>
                                        </td>

                                        {/* Role (Changeable) */}
                                        <td className="px-6 py-4">
                                            <select
                                                value={profile.role}
                                                onChange={e => handleRoleChange(profile.id, e.target.value)}
                                                className="bg-transparent font-medium text-xs border border-zinc-200 rounded-md px-2.5 py-1.5 outline-hidden focus:border-zinc-400 cursor-pointer"
                                            >
                                                <option value="user">Üye (User)</option>
                                                <option value="admin">Yönetici (Admin)</option>
                                            </select>
                                        </td>

                                        {/* Status (Changeable) */}
                                        <td className="px-6 py-4">
                                            <select
                                                value={profile.status}
                                                onChange={e => handleStatusChange(profile.id, e.target.value)}
                                                className={`font-semibold text-xs border rounded-md px-2.5 py-1.5 outline-hidden cursor-pointer ${
                                                    profile.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:border-emerald-400'
                                                        : 'bg-rose-50 text-rose-700 border-rose-200 focus:border-rose-400'
                                                }`}
                                            >
                                                <option value="active">Aktif (Active)</option>
                                                <option value="suspended">Askıda (Suspended)</option>
                                            </select>
                                        </td>

                                        {/* Actions (Password Reset / Delete) */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setResettingUserId(profile.id)}
                                                    className="inline-flex items-center justify-center p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                                                    title="Şifre Değiştir"
                                                >
                                                    <Key className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingUserId(profile.id)}
                                                    className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Kullanıcıyı Sil"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-zinc-450 font-medium">
                                        Kayıtlı üye bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PASSWORD RESET MODAL */}
            {resettingUserId && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-5 border-b border-zinc-100">
                            <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                                <Key className="w-4 h-4 text-amber-500" /> Şifreyi Sıfırla
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                <span className="font-semibold">{targetResetUser?.email}</span> firması için yeni şifre belirleyin.
                            </p>
                        </div>
                        <form onSubmit={handleResetPasswordSubmit}>
                            <div className="p-5 space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-zinc-700">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="En az 6 karakter girin"
                                        required
                                        className="w-full h-10 px-3 text-sm bg-white border border-zinc-200 rounded-lg focus:border-zinc-400 focus:outline-hidden transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResettingUserId(null)
                                        setNewPassword("")
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-150 rounded-lg transition-colors"
                                >
                                    Vazgeç
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetPending}
                                    className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                                >
                                    {isResetPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                    Şifreyi Güncelle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deletingUserId && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="p-5 text-center">
                            <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-zinc-900 text-base">Üyeyi Silmek İstiyor musunuz?</h3>
                            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                                <span className="font-semibold text-zinc-800">{targetDeleteUser?.email}</span> firması, tüm servis kayıtları, faturaları, stokları ve araçlarıyla birlikte **tamamen ve geri alınamaz şekilde** silinecektir.
                            </p>
                        </div>
                        <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setDeletingUserId(null)}
                                className="w-full px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-150 rounded-lg transition-colors"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleDeleteSubmit}
                                disabled={isDeletePending}
                                className="w-full inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                            >
                                {isDeletePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                Evet, Tamamen Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
