import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PanSea Voice Demo',
  description: 'Voice capture, transcription, and spoken responses (frontend only)'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 