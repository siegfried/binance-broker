import "./globals.css";
import Link from "next/link";

function Navbar() {
  return (
    <div className="max-w-(--breakpoint-lg) mx-auto">
      <nav className="flex flex-row">
        <Link className="p-4" href={"/"}>Home</Link>
        <Link className="p-4" href={"/accounts"}>Account</Link>
        <Link className="p-4" href={"/exchange-info"}>Exchange Info</Link>
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
