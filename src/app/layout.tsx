'use server'

import { errorLogs } from "@/error";
import { GlobalSettingsButton, ViewErrorsButton } from "./client";
import "./globals.css";
import Link from "next/link";
import { globalSettings } from "@/settings";

function Navbar() {
  return (
    <div className="max-w-(--breakpoint-lg) mx-auto">
      <nav className="flex flex-row">
        <Link className="p-4" href={"/"}>Dashboard</Link>
        <Link className="p-4" href={"/accounts"}>Account</Link>
        <Link className="p-4" href={"/exchange-info"}>Exchange Info</Link>
        <GlobalSettingsButton className="p-4 cursor-pointer" globalSettings={globalSettings}>Global Settings</GlobalSettingsButton>
        <ViewErrorsButton errorLogs={errorLogs} className="p-4">
          Errors
        </ViewErrorsButton>
      </nav>
    </div>
  )
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div>
          <div className="sticky top-0 shadow bg-slate-100"><Navbar /></div>
          <div className="max-w-(--breakpoint-lg) mx-auto p-4">
            {children}
          </div>
        </div>
        <div id="portal-root"></div>
      </body>
    </html>
  );
}
