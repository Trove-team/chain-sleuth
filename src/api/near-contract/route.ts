// File: src/api/near-contract/route.ts

import { Elysia, t } from "elysia";
import { connect, keyStores, Contract, utils } from "near-api-js";
import dotenv from 'dotenv';

dotenv.config();

const config = {
  networkId: process.env.NEAR_NETWORK || "testnet",
  keyStore: new keyStores.InMemoryKeyStore(),
  nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org",
  walletUrl: process.env.NEAR_WALLET_URL || "https://wallet.testnet.near.org",
  helperUrl: process.env.NEAR_HELPER_URL || "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

const contractId = process.env.CONTRACT_ID || "your-contract-id.testnet";

// Define the interface for your contract methods
interface ContractMetadata {
  name: string;
  symbol: string;
  // ... other metadata fields
}

interface NFTMetadata {
  title: string;
  description: string;
  media: string;
  // ... other NFT metadata fields
}

interface NearContractMethods {
  get_contract_metadata: () => Promise<ContractMetadata>;
  getQueryPrice: () => Promise<string>;
  setQueryPrice: (args: { price: string }) => Promise<void>;
  payForQuery: () => Promise<{ success: boolean, transactionHash: string }>;
  mintNFT: (args: { address: string, metadata: NFTMetadata }) => Promise<{ tokenId: string }>;
}

// Combine the base Contract type with your custom methods
type NearContract = Contract & NearContractMethods;

async function getContract(): Promise<NearContract> {
  const near = await connect(config);
  const account = await near.account("dummy.testnet");
  return new Contract(account, contractId, {
    viewMethods: ["get_contract_metadata", "getQueryPrice"],
    changeMethods: ["setQueryPrice", "payForQuery", "mintNFT"],
    useLocalViewExecution: false,
  }) as NearContract;
}

// Define interfaces for your request bodies
interface SetQueryPriceBody {
  price: number;
}

interface MintNFTBody {
  address: string;
  metadata: any; // Replace 'any' with a more specific type if possible
}

const app = new Elysia()
  .get("/metadata", async () => {
    const contract = await getContract();
    return await contract.get_contract_metadata();
  })
  .get("/query-price", async () => {
    const contract = await getContract();
    return await contract.getQueryPrice();
  })
  .post("/set-query-price", async ({ body }: { body: SetQueryPriceBody }) => {
    const contract = await getContract();
    await contract.setQueryPrice({ price: body.price.toString() });
    return { success: true };
  })
  .post("/pay-for-query", async () => {
    const contract = await getContract();
    return await contract.payForQuery();
  })
  .post("/mint-nft", async ({ body }: { body: MintNFTBody }) => {
    const contract = await getContract();
    return await contract.mintNFT({ address: body.address, metadata: body.metadata });
  });

const nearContractRoutes = app;
export default nearContractRoutes;
