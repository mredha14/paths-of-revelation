import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paths of Revelation | Sacred Places Atlas",
  description: "A bilingual interactive atlas of sacred and historic places in Makkah and Madinah.",
  openGraph: { title: "Paths of Revelation", description: "Explore sacred places in Makkah and Madinah.", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
