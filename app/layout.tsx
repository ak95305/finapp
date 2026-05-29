import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppDataProvider } from "@/context/AppDataContext";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinApp",
  description: "Personal finance tracker",
  appleWebApp: { capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${geist.className} bg-gray-50 dark:bg-gray-950 min-h-screen antialiased`}>
        <AppDataProvider>
          {/* Mobile-first container — centered on desktop */}
          <div className="mx-auto max-w-[430px] min-h-screen flex flex-col relative bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 pb-16">
              {children}
            </div>
          </div>
          <BottomNav />
        </AppDataProvider>
      </body>
    </html>
  );
}
