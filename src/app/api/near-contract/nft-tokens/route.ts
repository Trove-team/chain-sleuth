// src/app/api/near-contract/nft-tokens/route.ts
import { NextResponse } from 'next/server';
import { connect, keyStores, Contract } from 'near-api-js';
import type { InvestigationContract } from '@/constants/contract';
import type { InvestigationNFTMetadata } from '@/types/investigation';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'chainsleuth2.testnet';

interface NFTTokensResponse {
  tokens: InvestigationNFTMetadata[];
  total: number;
}

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
        viewMethods: ['nft_tokens'],
        changeMethods: [],
        useLocalViewExecution: false,
      }
    ) as InvestigationContract;

    const tokens = await contract.nft_tokens({
      from_index: (page * limit).toString(),
      limit
    });

    return NextResponse.json(tokens);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error fetching NFT tokens:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch NFT tokens',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}