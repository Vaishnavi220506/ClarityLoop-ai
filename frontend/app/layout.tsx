import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'ClarityLoop – AI Assistant with Honest Feasibility Analysis',
  description:
    'ClarityLoop is an AI assistant that distinguishes possibility from practical feasibility, separates facts from assumptions, and helps you build with verified evidence.',
  keywords: ['AI assistant', 'feasibility analysis', 'multi-agent', 'project planning'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} gradient-bg min-h-screen`}>
        <Providers>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
