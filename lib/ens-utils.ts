/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createPublicClient, http, isAddress, getAddress } from 'viem';
import { mainnet, base } from 'viem/chains';
import { normalize } from 'viem/ens';

/**
 * Resolve address to ENS name
 * Checks mainnet first (for both .eth and .base.eth names), then external APIs
 * Note: Base chain does not support ENS Universal Resolver, so we skip it
 */
export async function lookupENS(address: string): Promise<{ name: string | null; error?: string }> {
  try {
    if (!address || typeof address !== 'string') {
      return { name: null, error: 'Invalid address' };
    }

    // Normalize address - try checksummed first, then lowercase
    let normalizedAddress: `0x${string}`;
    let checksummedAddress: string | null = null;

    try {
      checksummedAddress = getAddress(address);
      normalizedAddress = checksummedAddress as `0x${string}`;
    } catch {
      normalizedAddress = address.toLowerCase() as `0x${string}`;
    }

    // Try mainnet first (Base ENS names like .base.eth are stored on mainnet)
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    try {
      const name = await mainnetClient.getEnsName({ address: normalizedAddress });
      if (name) {
        return { name };
      }
    } catch (error: any) {
      // console.log('[ENS Lookup] Mainnet lookup error:', error?.message || error);
    }

    // Skip Base chain lookup - Base does not support ENS Universal Resolver
    // Base names (.base.eth) are actually stored on Ethereum mainnet, not Base chain
    // So the mainnet lookup above should already catch them

    // Try external API fallback
    try {
      const addressesToTry = checksummedAddress
        ? [checksummedAddress, normalizedAddress]
        : [normalizedAddress];

      for (const addr of addressesToTry) {
        const apiResult = await lookupViaAPI(addr);
        if (apiResult) {
          return { name: apiResult };
        }
      }
    } catch (error) {
      // console.log('[ENS Lookup] API lookup failed:', error);
    }

    return { name: null };
  } catch (error: any) {
    console.error('ENS lookup error:', error);
    return { name: null, error: error.message || 'Failed to lookup ENS name' };
  }
}

/**
 * Fallback: Lookup ENS name via external API
 */
async function lookupViaAPI(address: string): Promise<string | null> {
  try {
    // Try ENSData API
    const response = await fetch(`https://api.ensdata.net/address/${address}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.name) return data.name;
      if (data?.ensName) return data.ensName;
      if (data?.domain) return data.domain;
    }
  } catch (error) {
    // console.log('ENSData API reverse lookup failed:', error);
  }

  try {
    // Try ENS Node API
    const response = await fetch(`https://api.alpha.ensnode.io/address/${address}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.name) return data.name;
    }
  } catch (error) {
    // console.log('ENS Node API reverse lookup failed:', error);
  }

  return null;
}

/**
 * Get ENS avatar URL
 */
export async function getENSAvatar(ensName: string): Promise<string | null> {
  try {
    if (!ensName || typeof ensName !== 'string') {
      return null;
    }

    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(),
    });

    try {
      const normalized = normalize(ensName);
      const avatar = await mainnetClient.getEnsAvatar({ name: normalized });
      return avatar || null;
    } catch (error) {
      // console.log('Avatar fetch failed:', error);
      return null;
    }
  } catch (error) {
    console.error('ENS avatar error:', error);
    return null;
  }
}

/**
 * Generate a deterministic avatar URL based on address (fallback)
 */
export function getAddressAvatar(address: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${address.toLowerCase()}`;
}

