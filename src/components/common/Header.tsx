import React from 'react';
import Link from 'next/link';
import WalletConnector from '@/components/WalletConnector';

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
