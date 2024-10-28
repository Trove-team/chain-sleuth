import React from 'react';
import { useWalletSelector } from '@/context/WalletSelectorContext';

const WalletConnector: React.FC = () => {
  const { selector, modal, accountId } = useWalletSelector();

  const handleSignIn = () => {
    modal?.show();
  };

  const handleSignOut = async () => {
    const wallet = await selector?.wallet();
    await wallet?.signOut();
  };

  return (
    <div className="flex items-center">
      {accountId ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm truncate max-w-[150px]">{accountId}</span>
          <button 
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button 
          onClick={handleSignIn}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnector;
