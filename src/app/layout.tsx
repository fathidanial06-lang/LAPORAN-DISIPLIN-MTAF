import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Laporan Disiplin Murid - Madrasah Tahfiz Al Furqan",
  description:
    "Portal Laporan Disiplin Murid - Kedatangan, Sahsiah, Merit & Demerit. Unit Hal Ehwal Murid (HEM) Madrasah Tahfiz Al Furqan, Malaysia.",
  keywords: [
    "Madrasah Tahfiz Al Furqan",
    "Laporan Disiplin",
    "HEM",
    "Kedatangan",
    "Sahsiah",
    "Merit Demerit",
  ],
  authors: [{ name: "Unit HEM, Madrasah Tahfiz Al Furqan" }],
  icons: {
    icon: "/logo-mtaf.png",
    apple: "/logo-mtaf.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-disiplin-bg text-foreground">
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </body>
    </html>
  );
}
