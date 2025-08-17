import type { Metadata } from 'next';
import './globals.css';
import { AccountProvider } from '@/components/AccountContext';

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
      <body>
        <AccountProvider>
          {children}
        </AccountProvider>
      </body>
    </html>
  );
} 