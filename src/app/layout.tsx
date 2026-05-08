import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Quantified Selves: When Data Becomes Self — Interactive Research by Yiling Xie",
  description: "An interactive exploration of how wearable technologies reshape our self-perception, behavior, and identity. Based on 117 survey responses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`min-h-full bg-slate-50 text-slate-800 antialiased ${inter.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}