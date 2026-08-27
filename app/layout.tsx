import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'دروب الوحي | Paths of Revelation',
  description: 'A bilingual, sourced map of prophetic heritage in Makkah and Madinah.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar"><body>{children}</body></html>;
}
