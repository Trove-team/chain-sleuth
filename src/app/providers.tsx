'use client';

import React from 'react';
import { WalletSelectorContextProvider } from "@/context/WalletSelectorContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletSelectorContextProvider>
      {children}
    </WalletSelectorContextProvider>
  );
}