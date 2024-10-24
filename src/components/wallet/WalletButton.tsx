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
      className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
        accountId 
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {accountId ? accountId : 'Connect Wallet'}
    </button>
  );
};

export default WalletButton;