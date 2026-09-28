import { AppInstall } from "@/components/app-install";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: {
    default: "IT's No Matata · Media Portal",
    template: "%s · IT's No Matata",
  },
  description: "Media package collection for ZHC, JETBOAT and EleCrew.",
  applicationName: "Matata Media",
  appleWebApp: { capable: true, title: "Matata Media", statusBarStyle: "default" },
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-black">{children}<AppInstall /></body>
    </html>
  );
}
