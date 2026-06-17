export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col justify-center items-center p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                        ServisMaster
                    </h1>
                </div>
                {children}
            </div>
        </div>
    )
}