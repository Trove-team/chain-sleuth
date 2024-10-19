'use client';

import React from 'react';
import Link from 'next/link';
import WalletSelector from './WalletSelector';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">Chain Sleuth</Link>
          <nav>
            <ul className="flex space-x-4">
              <li><Link href="/queries">Queries</Link></li>
              <li><Link href="/graph">Graph</Link></li>
            </ul>
          </nav>
          <WalletSelector />
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-gray-200 p-4">
        <div className="container mx-auto text-center">
          © 2023 Chain Sleuth
        </div>
      </footer>
    </div>
  );
};

export default Layout;
