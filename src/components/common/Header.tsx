// components/common/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import WalletButton from '@/components/wallet/WalletButton';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();

  const isActivePath = (path: string) => {
    return pathname === path ? 'text-white' : 'text-blue-100 hover:text-white';
  };

  return (
    <header className="bg-white bg-opacity-30 backdrop-filter backdrop-custom text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-2xl font-bold">
            Chain Sleuth
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-8">
            <Link 
              href="/queries" 
              className={`${isActivePath('/queries')} transition-colors`}
            >
              Queries
            </Link>
            <Link 
              href="/graph" 
              className={`${isActivePath('/graph')} transition-colors`}
            >
              Graph
            </Link>

            {/* Wallet Button */}
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;