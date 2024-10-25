// context/WalletSelectorContext.tsx
'use client';

import React, { useCallback, useContext, useEffect, useState } from "react";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { CONTRACT_ID, DEFAULT_METHOD_NAMES } from '@/constants/contract';

interface AccountState {
  accountId: string;
  active: boolean;
}

interface WalletSelectorContextValue {
  selector: any | null;
  modal: any | null;
  accounts: Array<AccountState>;
  accountId: string | null;
}

const WalletSelectorContext = React.createContext<WalletSelectorContextValue | null>(null);

export const WalletSelectorContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selector, setSelector] = useState<any | null>(null);
  const [modal, setModal] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<Array<AccountState>>([]);

  const init = useCallback(async () => {
    try {
      console.log('Initializing wallet selector with contract:', CONTRACT_ID);
      
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
        methodNames: DEFAULT_METHOD_NAMES,
      });

      const state = _selector.store.getState();
      console.log('Initial wallet state:', state);
      setAccounts(state.accounts);

      setSelector(_selector);
      setModal(_modal);
    } catch (err) {
      console.error('Failed to initialize wallet selector:', err);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!selector) return;

    const subscription = selector.store.observable
      .subscribe((state: { accounts: Array<AccountState> }) => {
        console.log('Wallet state changed:', state);
        setAccounts(state.accounts);
      });

    return () => subscription.unsubscribe();
  }, [selector]);

  const accountId = accounts.find((account) => account.active)?.accountId || null;

  const contextValue = {
    selector,
    modal,
    accounts,
    accountId,
  };

  return (
    <WalletSelectorContext.Provider value={contextValue}>
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