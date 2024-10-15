// File: src/api/index.ts

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import refFinanceRoutes from './ref-finance/routes';
import pikespeakRoutes from './pikespeak/routes';
import nearContractRoutes from './near-contract/routes';

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: "Ref Finance Agent API",
        version: "1.0.0",
      },
    },
  }))
  .use(refFinanceRoutes)
  .use(pikespeakRoutes)
  .use(nearContractRoutes);

export default app;