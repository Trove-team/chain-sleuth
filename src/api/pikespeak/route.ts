// File: src/api/pikespeak/routes.ts

import { Elysia, t } from "elysia";
import axios from "axios";

const PIKESPEAK_BASE_URL = "https://api.pikespeak.ai";
const PIKESPEAK_API_KEY = process.env.PIKESPEAK_API_KEY;

const pikespeakRoutes = new Elysia({ prefix: "/pikespeak" })
  .get("/ping", () => {
    return { status: "ok", message: "Pikespeak routes are working" };
  })
  .get("/account/transactions/:contract", async ({ params, query }) => {
    const limit = query.limit ? parseInt(query.limit as string) : 50;
    const offset = query.offset ? parseInt(query.offset as string) : 0;

    if (isNaN(limit) || isNaN(offset) || limit < 1 || limit > 50 || offset < 0) {
      return new Response('Invalid limit or offset', { status: 400 });
    }

    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/transactions/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY },
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching transactions for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    }),
    query: t.Object({
      limit: t.Optional(t.String()),
      offset: t.Optional(t.String())
    })
  })
  .get("/account/tx-count/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/tx-count/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching transaction count for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/*", async ({ params, query }) => {
    const path = params["*"];
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/${path}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY },
        params: query
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      return { error: `Error fetching data from Pikespeak: ${path}` };
    }
  });

export default pikespeakRoutes;
