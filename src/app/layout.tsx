import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RetailRadar - Find High-Upside Retail Properties',
  description: 'Discover undervalued retail properties with high vacancy upside potential. AI-powered analysis of commercial real estate opportunities.',
  keywords: 'retail property, commercial real estate, CRE, strip centers, vacancy, investment',
  openGraph: {
    title: 'RetailRadar',
    description: 'Find high-upside retail properties',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  );
}
