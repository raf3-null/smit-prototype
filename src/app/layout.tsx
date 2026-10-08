import type { Metadata } from "next";
import "@fontsource/sarabun/400.css";
import "@fontsource/sarabun/500.css";
import "@fontsource/sarabun/600.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "ศาศวัต ห้องเย็น · ระบบจัดการภายใน",
  description: "คำสั่งซื้อ สินค้า ห้องเย็น และข้อมูลลูกค้า",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
