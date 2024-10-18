// File: src/api/pikespeak/routes.ts

import { Elysia } from "elysia";
import axios from "axios";

const PIKESPEAK_BASE_URL = "https://api.pikespeak.ai";
const PIKESPEAK_API_KEY = process.env.PIKESPEAK_API_KEY;

const pikespeakRoutes = new Elysia({ prefix: "/api/pikespeak" })
  .get("/ping", () => {
    return { status: "ok", message: "Pikespeak routes are working" };
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