// app/providers.tsx
'use client';

import React from 'react';
import { WalletSelectorContextProvider } from "@/context/WalletSelectorContext";
import { QueryProvider } from '@/providers/QueryProvider';
import dynamic from 'next/dynamic';
import { CONTRACT_ID } from '@/constants/contract';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Header = dynamic(() => import('@/components/common/Header'), {
  ssr: false
});

// Debug component
function EnvTest() {
  React.useEffect(() => {
    console.log('[PROVIDERS] Environment check:', {
      CONTRACT_ID,
      raw_env: process.env.NEXT_PUBLIC_CONTRACT_ID
    });
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    console.log('[PROVIDERS] Initializing with contract:', CONTRACT_ID);
  }, []);

  return (
    <QueryProvider>
      <WalletSelectorContextProvider>
        <EnvTest />
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
        <ToastContainer position="top-right" autoClose={5000} />
      </WalletSelectorContextProvider>
    </QueryProvider>
  );
}
