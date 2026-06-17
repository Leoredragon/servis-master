import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-zinc-200 rounded" />
                    <div className="h-4 w-80 bg-zinc-150 rounded" />
                </div>
                <div className="h-10 w-36 bg-zinc-200 rounded" />
            </div>

            {/* Metric Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-white border border-zinc-200/60 shadow-sm">
                        <CardContent className="p-5 space-y-3">
                            <div className="h-4 w-24 bg-zinc-150 rounded" />
                            <div className="h-8 w-32 bg-zinc-200 rounded" />
                            <div className="h-3 w-40 bg-zinc-100 rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Layout Split Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Table Area Skeleton */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-zinc-200/60 rounded-lg p-5 space-y-4">
                        <div className="h-5 w-36 bg-zinc-200 rounded mb-4" />
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-zinc-200 rounded" />
                                    <div className="h-3. w-24 bg-zinc-150 rounded" />
                                </div>
                                <div className="h-5 w-16 bg-zinc-250 rounded" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Widgets Skeleton */}
                <div className="space-y-4">
                    <div className="bg-white border border-zinc-200/60 rounded-lg p-5 space-y-4">
                        <div className="h-5 w-28 bg-zinc-200 rounded mb-4" />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                                <div className="h-8 w-8 rounded-full bg-zinc-150" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 w-full bg-zinc-200/80 rounded" />
                                    <div className="h-3 w-16 bg-zinc-150 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
