"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
    { name: "Oca", total: 12500 },
    { name: "Şub", total: 18000 },
    { name: "Mar", total: 16500 },
    { name: "Nis", total: 22000 },
    { name: "May", total: 28000 },
    { name: "Haz", total: 45250 },
]

export default function Overview() {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₺${value}`}
                />
                <Tooltip
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                />
                <Bar
                    dataKey="total"
                    fill="#0B5ED7"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}