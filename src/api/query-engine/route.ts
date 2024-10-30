import { Elysia, t } from "elysia";
import axios from "axios";

const NEO4J_API_URL = process.env.NEO4J_API_URL;
const NEO4J_API_KEY = process.env.NEO4J_API_KEY;

const queryEngineRoutes = new Elysia({ prefix: "/query-engine" })
  .post("/query", async ({ body }) => {
    try {
      const response = await axios.post(`${NEO4J_API_URL}/query`, body, {
        headers: {
          'Authorization': `Bearer ${NEO4J_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error("Query Engine error:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Response data:", error.response.data);
        return new Response(error.response.data, { status: error.response.status });
      }
      return new Response('Error processing query', { status: 500 });
    }
  }, {
    body: t.Object({
      query: t.String(),
      accountId: t.Optional(t.String())
    })
  });

export default queryEngineRoutes;
