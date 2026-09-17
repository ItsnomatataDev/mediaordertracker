import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "IT's No Matata · Media Portal",
    template: "%s · IT's No Matata",
  },
  description: "Permanent helicopter media collection for Zambezi Helipad.",
  robots: { index: false, follow: false },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-black">{children}</body>
    </html>
  );
}
