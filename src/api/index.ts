// src/api/index.ts
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import refFinanceRoutes from './ref-finance/route';
import pikespeakRoutes from './pikespeak/route';
import { POST as pipelinePost, GET as pipelineGet } from '../app/api/pipeline/route';
import { POST as processPost } from '../app/api/pipeline/process/route';
import queryEngineRoutes from './query-engine/route';
import intakeRoutes from './intake/route';

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
  .use(queryEngineRoutes)
  .use(intakeRoutes)
  
  // Wrap the functions to fit the expected signature
  .post('/pipeline', async (context) => {
    const request = context.request;
    return await pipelinePost(request);
  })
  .get('/pipeline', async (context) => {
    const request = context.request;
    return await pipelineGet(request);
  })
  .post('/pipeline/process', async (context) => {
    const request = context.request;
    return await processPost(request);
  });

const compiledApp = app.compile();

export const GET = compiledApp.handle;
export const POST = compiledApp.handle;

export default compiledApp;
