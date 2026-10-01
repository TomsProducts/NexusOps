import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "NEXUSOPS — AI IT Operations Platform",
  description: "Autonomous & Guided IT Operations Platform for Modern Small Infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-bgDark text-[#e8f1ff] antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
