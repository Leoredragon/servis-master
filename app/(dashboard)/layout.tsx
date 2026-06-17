import Sidebar from "@/components/dashboard/Sidebar"
import Header from "@/components/dashboard/Header"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}