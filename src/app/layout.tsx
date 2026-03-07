import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "规划设计院合同管理系统",
  description: "全生命周期业务运转中台",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-gray-50`}
      >
        {children}
      </body>
    </html>
  );
}
