import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PanSea Banking Assistant - Voice-Enabled Banking',
  description: 'Use your voice to manage banking accounts, make transfers, check balances, and more with AI-powered assistance'
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