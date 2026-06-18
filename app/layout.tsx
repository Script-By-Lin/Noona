import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Noona - Romantic Crush Game & Chat Response",
  description: "A beautiful space for romantic connection, cute letters, and real-time chat replies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-[#f0f4ed] flex items-center justify-center p-0 md:p-6 overflow-hidden md:overflow-auto">
        {children}
      </body>
    </html>
  );
}
