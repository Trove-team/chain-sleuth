// components/common/Header.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import WalletButton from '@/components/wallet/WalletButton';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();

  const isActivePath = (path: string) => {
    return pathname === path ? 'text-black' : 'text-black hover:text-gray-700';
  };
  
  return (
    <header className="bg-white/20 backdrop-blur-lg text-black">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-black">
            Chain Sleuth
          </Link>
  
          <nav className="flex items-center space-x-8">
            <Link 
              href="/queries" 
              className={`${isActivePath('/queries')} transition-colors`}
            >
              Intake
            </Link>
            <Link 
              href="/graph" 
              className={`${isActivePath('/graph')} transition-colors`}
            >
              Graph
            </Link>
  
            {/* Wallet Button with black styling */}
            <WalletButton />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
