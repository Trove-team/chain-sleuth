// File: src/api/index.ts

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import refFinanceRoutes from './ref-finance/route';
import pikespeakRoutes from './pikespeak/route';
import nearContractRoutes from './near-contract/route';

import dotenv from 'dotenv';
dotenv.config();

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
  .use(nearContractRoutes);

const compiledApp = app.compile();

export const GET = compiledApp.handle;
export const POST = compiledApp.handle;

export default compiledApp;
