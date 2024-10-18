// File: src/api/pikespeak/routes.ts

import { Elysia, t } from "elysia";
import axios from "axios";

const PIKESPEAK_BASE_URL = "https://api.pikespeak.ai";
const PIKESPEAK_API_KEY = process.env.PIKESPEAK_API_KEY;

const pikespeakAxios = axios.create({
  baseURL: PIKESPEAK_BASE_URL,
  headers: {
    "X-API-Key": PIKESPEAK_API_KEY,
  },
});

const pikespeakRoutes = new Elysia({ prefix: "/pikespeak" })
  .get("/ping", () => {
    return { status: "ok", message: "Pikespeak routes are working" };
  })
  .get("/account/:accountId/:endpoint", async ({ params: { accountId, endpoint }, query }) => {
    try {
      const response = await pikespeakAxios.get(`/account/${accountId}/${endpoint}`, { params: query });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      return {
        error: `Error fetching ${endpoint} data for account ${accountId} from Pikespeak`,
      };
    }
  }, {
    params: t.Object({
      accountId: t.String(),
      endpoint: t.Enum({
        activity: "activity",
        "ft-transfers": "ft-transfers",
        "contract-interactions": "contract-interactions",
        "probable-eth-address": "probable-eth-address",
        social: "social",
        "nft-transfers": "nft-transfers",
      }),
    }),
    query: t.Object({
      limit: t.Optional(t.Number()),
      offset: t.Optional(t.Number()),
    }),
  })
  .get("/account/:accountId/reputation", async ({ params: { accountId } }) => {
    try {
      const [activity, ftTransfers, contractInteractions, probableEthAddress, social] = await Promise.all([
        pikespeakAxios.get(`/account/${accountId}/activity`),
        pikespeakAxios.get(`/account/${accountId}/ft-transfers`),
        pikespeakAxios.get(`/account/${accountId}/contract-interactions`),
        pikespeakAxios.get(`/account/${accountId}/probable-eth-address`),
        pikespeakAxios.get(`/account/${accountId}/social`),
      ]);

      const reputationScore = calculateReputationScore(activity.data, ftTransfers.data, contractInteractions.data, social.data);

      return {
        accountId,
        reputationScore,
        probableEthAddress: probableEthAddress.data,
      };
    } catch (error) {
      console.error("Pikespeak API error:", error);
      return {
        error: `Error calculating reputation for account ${accountId}`,
      };
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

export default pikespeakRoutes;
