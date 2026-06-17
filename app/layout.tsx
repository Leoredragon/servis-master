import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ServisMaster | Yönetim Paneli",
  description: "Teknik Servis ve Operasyon Yönetim Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme_preference') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      {/* inter.variable ile css değişkenini inject edip, font-sans ile tailwind'e bağlıyoruz */}
      <body className={`${inter.variable} font-sans antialiased bg-zinc-50 text-zinc-900`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}