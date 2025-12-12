'use client';

import '@reown/appkit-wallet-button/react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  return (
    <div className="relative">
      {/* Simple AppKit button - styled to match retro theme */}
      <button
        onClick={() => open()}
        className="retro-button bg-black text-white hover:bg-white hover:text-black"
      >
        {isConnected && address 
          ? <span className="hidden sm:inline">{address.slice(0, 6)}...{address.slice(-4)}</span>
          : <><span className="hidden sm:inline">CONNECT </span>WALLET</>
        }
      </button>
    </div>
  );
}

// Alternative: Use AppKit's built-in button component
export function ReownWalletButton() {
  // @ts-expect-error - AppKitButton is a custom element
  return <appkit-button />;
}

// Custom styled button with balance
export function WalletButtonWithBalance() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();

  return (
    <button
      onClick={() => open()}
      className="retro-button bg-black text-white hover:bg-white hover:text-black flex items-center gap-2"
    >
      {isConnected && address ? (
        <>
          <span className="hidden sm:inline">Connected:</span>
          <span className="font-bold">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">🔗</span>
          <span>CONNECT WALLET</span>
        </>
      )}
    </button>
  );
}

// Network switcher button
export function NetworkSwitcher() {
  const { open } = useAppKit();

  return (
    <button
      onClick={() => open({ view: 'Networks' })}
      className="retro-button bg-gray-100 text-gray-900 hover:bg-black hover:text-white"
    >
      <span className="hidden lg:inline">Switch </span>Network
    </button>
  );
}

