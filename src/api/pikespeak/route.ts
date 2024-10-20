// File: src/api/pikespeak/routes.ts

import { Elysia, t } from "elysia";
import axios from "axios";

const PIKESPEAK_BASE_URL = process.env.PIKESPEAK_BASE_URL || "https://api.pikespeak.ai";
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
  .get("/account/balance/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/balance/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching balance for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/account/wealth/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/wealth/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching wealth for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/account/:infos/:contract", async ({ params, query }) => {
    const { infos, contract } = params;
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/${infos}/${contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY },
        params: query
      });
      return response.data;
    } catch (error) {
      console.error(`Pikespeak API error for endpoint ${infos}:`, error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        if (error.response.status === 404) {
          return new Response(`Endpoint /account/${infos}/${contract} not found in Pikespeak API`, { status: 404 });
        }
      }
      return new Response(`Error fetching ${infos} for account ${contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      infos: t.String(),
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
  })
  .get("/account/ft-transfer/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/ft-transfer/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching FT transfers for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/account/incoming-near/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/incoming-near/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching incoming NEAR for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/account/outgoing-near/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/outgoing-near/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching outgoing NEAR for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/account/incoming-token/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/incoming-token/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching incoming tokens for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/account/outgoing-token/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/outgoing-token/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching outgoing tokens for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  })
  .get("/bridge/probable-eth-addresses/:account", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/bridge/probable-eth-addresses/${params.account}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching probable ETH addresses for account: ${params.account}`, { status: 500 });
    }
  }, {
    params: t.Object({
      account: t.String()
    })
  })
  .get("/event-historic/account/relationships/:contract", async ({ params, query }) => {
    const { contract } = params;
    const { search, limit } = query;

    if (!search || typeof search !== 'string' || search.length < 4) {
      return new Response("Search parameter is required and should be at least 4 characters long", { status: 400 });
    }

    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/event-historic/account/relationships/${contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY },
        params: { 
          search,
          limit: limit || '50'  // default to 50 if not provided
        }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        return new Response(`Pikespeak API error: ${JSON.stringify(error.response.data)}`, { status: error.response.status });
      }
      return new Response(`Error fetching relationships for account: ${contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    }),
    query: t.Object({
      search: t.String(),
      limit: t.Optional(t.String())
    })
  })
  .get("/account/contract-interactions/:contract", async ({ params }) => {
    try {
      const response = await axios.get(`${PIKESPEAK_BASE_URL}/account/contract-interactions/${params.contract}`, {
        headers: { "X-API-Key": PIKESPEAK_API_KEY }
      });
      return response.data;
    } catch (error) {
      console.error("Pikespeak API error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      return new Response(`Error fetching contract interactions for account: ${params.contract}`, { status: 500 });
    }
  }, {
    params: t.Object({
      contract: t.String()
    })
  });

export default pikespeakRoutes;
