// app/providers.tsx
'use client';

import React from 'react';
import { WalletSelectorContextProvider } from "@/context/WalletSelectorContext";
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/common/Header'), {
  ssr: false
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletSelectorContextProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-200 p-4">
          <div className="container mx-auto text-center">
            © {new Date().getFullYear()} Chain Sleuth
          </div>
        </footer>
      </div>
    </WalletSelectorContextProvider>
  );
}