// src/api/index.ts
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import refFinanceRoutes from './ref-finance/route';
import pikespeakRoutes from './pikespeak/route';
import nearContractRoutes from './near-contract/route';
import testInvestigationRoutes from './near-contract/test-investigation/route';
import { POST as pipelinePost, GET as pipelineGet } from '../app/api/pipeline/route';
import queryEngineRoutes from './query-engine/route';

const app = new Elysia({ prefix: "/api", aot: false })
  .use(swagger({
    documentation: {
      info: {
        title: "Chain Sleuth Agent API",
        version: "1.0.0",
      },
      servers: [
        {
          url: "https://chain-sleuth.vercel.app",
          description: "Production server",
        },
      ],
    },
    path: '/swagger',
  }))
  .use(refFinanceRoutes)
  .use(pikespeakRoutes)
  .use(nearContractRoutes)
  .use(testInvestigationRoutes)
  .use(queryEngineRoutes)
  // Wrap the functions to fit the expected signature
  .post('/pipeline', async (context) => {
    const request = context.request;
    return await pipelinePost(request);
  })
  .get('/pipeline', async (context) => {
    const request = context.request;
    return await pipelineGet(request);
  });

const compiledApp = app.compile();

export const GET = compiledApp.handle;
export const POST = compiledApp.handle;

export default compiledApp;
