// app/src/app/layout.tsx
'use client';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import WalletProvider from '../components/providers/WalletProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>

            {/* Footer */}
            <Footer />
          </div>
        </WalletProvider>

        {/* Toast Container for Notifications */}
        <div id="toast-container" />
      </body>
    </html>
  );
}