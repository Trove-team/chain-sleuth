// app/api/near-contract/nft-tokens/route.ts
import { NextResponse } from 'next/server';
import { connect, keyStores, Contract } from 'near-api-js';
import type { NFTContract } from '../../../types/near-contract';
// Or if you prefer using path aliases:
// import type { NFTContract } from '@/types/near-contract';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'chainsleuth2.testnet';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const config = {
      networkId: "testnet",
      keyStore: new keyStores.InMemoryKeyStore(),
      nodeUrl: "https://rpc.testnet.near.org",
      walletUrl: "https://wallet.testnet.near.org",
      helperUrl: "https://helper.testnet.near.org",
      explorerUrl: "https://explorer.testnet.near.org",
    };

    const near = await connect(config);
    const account = await near.account("");

    const contract = new Contract(
      account,
      CONTRACT_ID,
      {
        viewMethods: ['nft_tokens', 'nft_total_supply', 'nft_tokens_for_owner', 'nft_token'],
        changeMethods: [],
      }
    ) as NFTContract;

    const tokens = await contract.nft_tokens({
      from_index: (page * limit).toString(),
      limit
    });

    return NextResponse.json(tokens);
  } catch (error: any) {
    console.error('Error fetching NFT tokens:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch NFT tokens',
        details: error.message
      },
      { status: 500 }
    );
  }
}