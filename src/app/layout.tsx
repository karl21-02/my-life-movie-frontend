import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Life Movie",
  description: "내 디지털 흔적으로 나만의 인생 영화를 만드는 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
