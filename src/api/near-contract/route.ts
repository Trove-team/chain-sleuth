// File: src/api/near-contract/route.ts

import { Elysia, t } from "elysia";
import { connect, keyStores, Contract, Account } from "near-api-js";

const CONTRACT_ID = process.env.NEAR_CONTRACT_ID || "";
const NETWORK_ID = process.env.NEAR_NETWORK || "testnet";

const config = {
  networkId: NETWORK_ID,
  keyStore: new keyStores.InMemoryKeyStore(),
  nodeUrl: `https://rpc.${NETWORK_ID}.near.org`,
  walletUrl: `https://wallet.${NETWORK_ID}.near.org`,
  helperUrl: `https://helper.${NETWORK_ID}.near.org`,
  explorerUrl: `https://explorer.${NETWORK_ID}.near.org`,
};

// Define types for metadata and NFT token
interface NFTMetadata {
  title: string;
  description: string;
  media: string;
  summary: string;
  queried_name: string;
  querier: string;
  reputation_score: number;
}

interface NFTToken {
  token_id: string;
  owner_id: string;
  metadata: NFTMetadata;
}

// Define a custom type for our contract
interface NFTContract extends Omit<Contract, 'account'> {
  mint_nft: (args: { token_id: string; metadata: NFTMetadata; recipient: string }, gas?: string, deposit?: string) => Promise<void>;
  nft_token: (args: { token_id: string }) => Promise<NFTToken | null>;
  nft_tokens_for_owner: (args: { account_id: string }) => Promise<string[]>;
  get_mint_price: () => Promise<string>;
  nft_total_supply: () => Promise<number>;
}

const getContract = async (account: Account): Promise<NFTContract> => {
  return new Contract(
    account,
    CONTRACT_ID,
    {
      viewMethods: ["nft_token", "nft_tokens_for_owner", "get_mint_price", "nft_total_supply"],
      changeMethods: ["mint_nft"],
      useLocalViewExecution: false
    }
  ) as unknown as NFTContract;
};

const GENERIC_NFT_IMAGE_URL = 'ipfs://QmSNycrd5gWH7QAFKBVvKaT58c5S6B1tq9ScHP7thxvLWM';

const nearContractRoutes = new Elysia({ prefix: "/near-contract" })
  .post("/mint-nft", async ({ body }) => {
    const { token_id, queried_name, querier, summary } = body;
    try {
      const near = await connect(config);
      const account = await near.account(CONTRACT_ID);
      const contract = await getContract(account);

      const metadata: NFTMetadata = {
        title: `Reputation NFT for ${queried_name}`,
        description: `Reputation NFT minted by ${querier}`,
        media: "https://example.com/generic-nft-image.jpg", // Replace with your generic image URL
        summary,
        queried_name,
        querier,
        reputation_score: 10 // Default score as requested
      };

      await contract.mint_nft({
        token_id,
        metadata,
        recipient: querier,
      }, "300000000000000", // 0.3 NEAR as attached deposit
      );

      return {
        success: true,
        message: "NFT minted successfully",
        token_id,
        metadata
      };
    } catch (error) {
      console.error("Error minting NFT:", error);
      return { success: false, error: "Failed to mint NFT" };
    }
  }, {
    body: t.Object({
      token_id: t.String(),
      queried_name: t.String(),
      querier: t.String(),
      summary: t.String()
    }),
  })
  .get("/nft/:tokenId", async ({ params: { tokenId } }) => {
    try {
      const near = await connect(config);
      const account = await near.account(CONTRACT_ID);
      const contract = await getContract(account);
      const nftToken = await contract.nft_token({ token_id: tokenId });
      return nftToken || { error: "NFT not found" };
    } catch (error) {
      console.error("Error fetching NFT:", error);
      return { error: "Failed to fetch NFT" };
    }
  }, {
    params: t.Object({
      tokenId: t.String()
    })
  })
  .get("/nfts/:accountId", async ({ params: { accountId } }) => {
    try {
      const near = await connect(config);
      const account = await near.account(CONTRACT_ID);
      const contract = await getContract(account);
      const tokens = await contract.nft_tokens_for_owner({ account_id: accountId });
      return tokens;
    } catch (error) {
      console.error("Error fetching NFTs for account:", error);
      return { error: "Failed to fetch NFTs for account" };
    }
  }, {
    params: t.Object({
      accountId: t.String()
    })
  })
  .get("/mint-price", async () => {
    try {
      const near = await connect(config);
      const account = await near.account(CONTRACT_ID);
      const contract = await getContract(account);
      const mintPrice = await contract.get_mint_price();
      return { mintPrice };
    } catch (error) {
      console.error("Error fetching mint price:", error);
      return { error: "Failed to fetch mint price" };
    }
  })
  .get("/total-supply", async () => {
    try {
      const near = await connect(config);
      const account = await near.account(CONTRACT_ID);
      const contract = await getContract(account);
      const totalSupply = await contract.nft_total_supply();
      return { totalSupply };
    } catch (error) {
      console.error("Error fetching total supply:", error);
      return { error: "Failed to fetch total supply" };
    }
  });

export default nearContractRoutes;
