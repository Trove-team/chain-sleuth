// File: src/api/index.ts

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import refFinanceRoutes from './ref-finance/route';
import pikespeakRoutes from './pikespeak/route';
//import nearContractRoutes from './near-contract/route';

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
  //.use(nearContractRoutes);

export default app;
