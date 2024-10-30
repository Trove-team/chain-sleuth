// components/wallet/WalletButton.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWalletSelector } from "@/context/WalletSelectorContext";

const WalletButton = () => {
  const { selector, modal, accountId } = useWalletSelector();  // Add selector
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = async () => {
    if (accountId) {
      setShowDropdown(!showDropdown);
    } else {
      modal?.show();
    }
  };

  const handleSignOut = async () => {
    try {
      if (selector) {
        const wallet = await selector.wallet();
        await wallet.signOut();
        setShowDropdown(false);
        // Reload the page to clear any cached state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleClick}
        className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
          accountId 
            ? 'bg-black text-white hover:bg-gray-800' 
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {accountId ? (
          <span className="truncate max-w-[150px] inline-block">
            {accountId}
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {accountId && showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletButton;