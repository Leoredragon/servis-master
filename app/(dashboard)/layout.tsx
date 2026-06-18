import Sidebar from "@/components/dashboard/Sidebar"
import Header from "@/components/dashboard/Header"
import CommandPalette from "@/components/dashboard/CommandPalette"
import QuickActionFAB from "@/components/dashboard/QuickActionFAB"
import NewCustomerDialog from "@/components/customers/NewCustomerDialog"
import NewServiceDialog from "@/components/services/NewServiceDialog"
import NewInvoiceDialog from "@/components/invoices/NewInvoiceDialog"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans relative">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full">
                <Header />
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
            
            {/* Global Search and Shortcuts */}
            <CommandPalette />
            <QuickActionFAB />
            
            {/* Controllable global dialog instances without local trigger buttons */}
            <NewCustomerDialog triggerVisible={false} />
            <NewServiceDialog triggerVisible={false} />
            <NewInvoiceDialog triggerVisible={false} />
        </div>
    )
}