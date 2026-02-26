import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Code with Heart",
  description: "Share and receive constructive feedback within the HTWG community",
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppHeader user={user}>{children}</AppHeader>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
