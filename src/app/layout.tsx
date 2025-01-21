import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

function Navbar() {
  return (
    <div className="max-w-screen-lg mx-auto">
      <nav className="flex flex-row">
        <Link className="p-4" href={"/"}>Home</Link>
        <Link className="p-4" href={"/accounts"}>Account</Link>
      </nav>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div>
          <div className="bg-slate-100"><Navbar /></div>
          <div className="max-w-screen-lg mx-auto p-4">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
