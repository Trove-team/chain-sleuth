// File: src/api/near-contract/routes.ts

import { Elysia, t } from "elysia";
import { connect, keyStores, Contract } from 'near-api-js';
import axios from 'axios';

const PIKESPEAK_BASE_URL = "https://api.pikespeak.ai";
const PIKESPEAK_API_KEY = process.env.PIKESPEAK_API_KEY;

const pikespeakAxios = axios.create({
  baseURL: PIKESPEAK_BASE_URL,
  headers: {
    "X-API-Key": PIKESPEAK_API_KEY,
  },
});

const nearContractRoutes = new Elysia({ prefix: "/near-contract" })
  .post("/mint-nft/:accountId", async ({ params: { accountId } }) => {
    try {
      // Fetch Pikespeak data
      const [activity, ftTransfers, contractInteractions, social] = await Promise.all([
        pikespeakAxios.get(`/account/${accountId}/activity`),
        pikespeakAxios.get(`/account/${accountId}/ft-transfers`),
        pikespeakAxios.get(`/account/${accountId}/contract-interactions`),
        pikespeakAxios.get(`/account/${accountId}/social`),
      ]);

      // Calculate reputation score
      const reputationScore = calculateReputationScore(activity.data, ftTransfers.data, contractInteractions.data, social.data);

      // Generate summary
      const summary = `Account ${accountId} has a reputation score of ${reputationScore}. Activity: ${activity.data.length} events, FT Transfers: ${ftTransfers.data.length}, Contract Interactions: ${contractInteractions.data.length}, Social Connections: ${social.data.connections.length}.`;

      // Connect to NEAR
      const near = await connect({
        networkId: "testnet",
        keyStore: new keyStores.InMemoryKeyStore(),
        nodeUrl: "https://rpc.testnet.near.org",
      });

      const account = await near.account("your-account.testnet");
      const contract = new Contract(account, "nft-contract.testnet", {
        changeMethods: ["nft_mint"],
        viewMethods: [],
      });

      // Mint NFT
      // @ts-ignore: Contract method
      const result = await contract.nft_mint({
        token_id: `${accountId}-${Date.now()}`,
        metadata: {
          title: `${accountId} Reputation NFT`,
          description: summary,
          media: "https://placekitten.com/200/300", // Placeholder image
          extra: JSON.stringify({
            reputationScore,
            activityCount: activity.data.length,
            ftTransfersCount: ftTransfers.data.length,
            contractInteractionsCount: contractInteractions.data.length,
            socialConnectionsCount: social.data.connections.length,
          }),
        },
        receiver_id: accountId,
      });

      return {
        success: true,
        message: "NFT minted successfully",
        nftData: result,
      };
    } catch (error) {
      console.error("Error minting NFT:", error);
      return { error: "Failed to mint NFT" };
    }
  }, {
    params: t.Object({
      accountId: t.String(),
    }),
  });

function calculateReputationScore(activity: any, ftTransfers: any, contractInteractions: any, social: any): number {
  let score = 100;

  if (ftTransfers.length > 1000) score -= 10;

  const accountAge = calculateAccountAge(activity);
  if (accountAge > 365) score += 10;

  const badContractInteractions = countBadContractInteractions(contractInteractions);
  score -= badContractInteractions * 5;

  score += social.connections.length;

  return Math.max(0, Math.min(100, score));
}

function calculateAccountAge(activity: any): number {
  return 0; // Placeholder
}

function countBadContractInteractions(contractInteractions: any): number {
  return 0; // Placeholder
}

export default nearContractRoutes;