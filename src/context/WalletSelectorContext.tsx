// context/WalletSelectorContext.tsx
'use client';

import React, { useCallback, useContext, useEffect, useState } from "react";
import { setupWalletSelector, Wallet } from "@near-wallet-selector/core";
import { setupModal, WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import type { WalletSelector } from "@near-wallet-selector/core";

declare global {
  interface Window {
    selector: WalletSelector;
    modal: WalletSelectorModal;
  }
}

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'chainsleuth2.testnet';

interface AccountState {
  accountId: string;
  active: boolean;
}

interface WalletSelectorContextValue {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accounts: Array<AccountState>;
  accountId: string | null;
}

const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);

  const init = useCallback(async () => {
    const _selector = await setupWalletSelector({
      network: "testnet",
      debug: true,
      modules: [
        setupMyNearWallet(),
        setupSender(),
        setupHereWallet(),
        setupMeteorWallet(),
        setupNightly()
      ],
    });
    
    const _modal = setupModal(_selector, {
      contractId: CONTRACT_ID,
      methodNames: [
        'request_investigation',
        'complete_investigation',
        'get_investigation_status'
      ]
    });

    const state = _selector.store.getState();
    setAccounts(state.accounts);

    window.selector = _selector;
    window.modal = _modal;

    setSelector(_selector);
    setModal(_modal);
  }, []);

  useEffect(() => {
    init().catch((err) => {
      console.error('Failed to initialize wallet selector:', err);
    });
  }, [init]);

  useEffect(() => {
    if (!selector) {
      return;
    }

    const subscription = selector.store.observable
      .subscribe((state: { accounts: Array<AccountState> }) => {
        console.log('Wallet state changed:', state);
        setAccounts(state.accounts);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  const accountId = accounts.find((account) => account.active)?.accountId || null;

  return (
    <WalletSelectorContext.Provider
      value={{
        selector,
        modal,
        accounts,
        accountId,
      }}
    >
      {children}
    </WalletSelectorContext.Provider>
  );
};

export function useWalletSelector() {
  const context = useContext(WalletSelectorContext);

  if (!context) {
    throw new Error(
      "useWalletSelector must be used within a WalletSelectorContextProvider"
    );
  }

  return context;
}