// File: src/api/pikespeak/routes.ts

import { Elysia, t } from "elysia";
import axios from "axios";

const PIKESPEAK_BASE_URL = "https://api.pikespeak.ai";
const PIKESPEAK_API_KEY = process.env.PIKESPEAK_API_KEY;

const pikespeakRoutes = new Elysia({ prefix: "/api/pikespeak" })
  .get("/ping", () => {
    return { status: "ok", message: "Pikespeak routes are working" };
  })
  .get("/account/transactions/:contract", async ({ params, query }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/transactions/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY },
        params: {
          limit: query.limit || 50,
          offset: query.offset || 0
        }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      return { error: `Error fetching transactions for account: ${params.contract}` };
    }
  }, {
    params: t.Object({
      contract: t.String()
    }),
    query: t.Object({
      limit: t.Optional(t.Number()),
      offset: t.Optional(t.Number())
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