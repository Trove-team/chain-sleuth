// components/wallet/WalletButton.tsx
'use client';

import React from 'react';
import { useWalletSelector } from "@/context/WalletSelectorContext";

const WalletButton = () => {
  const { modal, accountId } = useWalletSelector();

  const handleClick = async () => {
    if (accountId) {
      const wallet = await modal?.wallet();
      wallet?.signOut();
    } else {
      modal?.show();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 rounded-lg transition-colors ${
        accountId 
          ? 'bg-blue-600 hover:bg-red-600 text-white' 
          : 'bg-green-500 hover:bg-green-600 text-white'
      }`}
    >
      {accountId || 'Connect Wallet'}
    </button>
  );
};

export default WalletButton;