// components/common/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import WalletConnector with no SSR
const WalletConnector = dynamic(() => import('@/components/WalletConnector'), {
  ssr: false,
  loading: () => <div className="h-10 w-32 bg-blue-500 rounded animate-pulse" />
});

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Chain Sleuth</Link>
        <nav className="flex items-center space-x-4">
          <Link href="/queries" className="hover:text-blue-200">Queries</Link>
          <Link href="/graph" className="hover:text-blue-200">Graph</Link>
          <WalletConnector />
        </nav>
      </div>
    </header>
  );
};

export default Header;