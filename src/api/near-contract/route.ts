// File: src/api/near-contract/route.ts

import { Elysia, t } from "elysia";
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

      // Placeholder for NFT minting
      const nftMintingResult = {
        success: true,
        message: "NFT minting simulation successful",
        nftData: {
          token_id: `${accountId}-${Date.now()}`,
          metadata: {
            title: `${accountId} Reputation NFT`,
            description: summary,
            media: "https://placekitten.com/200/300", // Placeholder image
          },
        },
      };

      return {
        success: true,
        message: "NFT minted successfully (simulated)",
        nftData: nftMintingResult,
      };
    } catch (error) {
      console.error("Error in NFT minting simulation:", error);
      return { error: "Failed to simulate NFT minting" };
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
