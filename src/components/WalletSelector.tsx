"use client";
import React, { useEffect, useState } from 'react';
import { setupWalletSelector, WalletSelector as NearWalletSelector } from '@near-wallet-selector/core';
import { setupModal, WalletSelectorModal } from '@near-wallet-selector/modal-ui';
import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupSender } from '@near-wallet-selector/sender';
import { setupNightly } from '@near-wallet-selector/nightly';
import { setupLedger } from '@near-wallet-selector/ledger';
import { setupWalletConnect } from '@near-wallet-selector/wallet-connect';

const WalletSelector: React.FC = () => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [selector, setSelector] = useState<NearWalletSelector | null>(null);

  useEffect(() => {
    setupWalletSelector({
      network: 'mainnet',
      modules: [
        setupMeteorWallet(),
        setupMyNearWallet(),
        setupHereWallet(),
        setupSender(),
        setupNightly(),
        setupLedger(),
      ],
    }).then((selector) => {
      setSelector(selector);
      const modal = setupModal(selector, { contractId: 'chainsleuth.near' });
      setModal(modal);

      selector.on('accountsChanged', (accounts) => {
        if (Array.isArray(accounts) && accounts.length > 0) {
          setAccountId(accounts[0].accountId);
        } else {
          setAccountId(null);
        }
      });
      return () => {
        selector.off('accountsChanged', (accounts) => {
          if (Array.isArray(accounts) && accounts.length > 0) {
            setAccountId(accounts[0].accountId);
          } else {
            setAccountId(null);
          }
        });
      };
    });
  }, []);

  const handleSignIn = () => {
    if (modal) {
      modal.show();
    }
  };

  const handleSignOut = async () => {
    if (selector) {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccountId(null);
    }
  };

  return (
    <div>
      {accountId ? (
        <button onClick={handleSignOut} className="bg-red-500 text-white px-4 py-2 rounded">
          Sign Out ({accountId})
        </button>
      ) : (
        <button onClick={handleSignIn} className="bg-green-500 text-white px-4 py-2 rounded">
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletSelector;
