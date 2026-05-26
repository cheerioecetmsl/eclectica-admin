import type { Metadata } from "next";
import { Kalam, Patrick_Hand } from "next/font/google";
import "./globals.css";

const kalamFont = Kalam({
  variable: "--font-kalam",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const patrickHandFont = Patrick_Hand({
  variable: "--font-patrick-hand",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eclectica Scrapbook - Admin Portal",
  description: "Administrative control center for managing student memories.",
};

import AdminLayout from "@/components/AdminLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${kalamFont.variable} ${patrickHandFont.variable} antialiased h-full dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-zinc-100">
        <AdminLayout>
          {children}
        </AdminLayout>
      </body>
    </html>
  );
}
