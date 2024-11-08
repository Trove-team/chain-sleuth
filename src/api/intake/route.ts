import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { createLogger } from '@/utils/logger';

const logger = createLogger('intake-route');

type AccountRequest = {
  body: {
    accountId: string;
  }
}

const intakeRoutes = new Elysia({ prefix: "/intake" })
  .use(swagger({
    documentation: {
      info: {
        title: "Chain Sleuth Intake API",
        version: "1.0.0"
      },
      tags: [
        { name: "Account", description: "Account management endpoints" }
      ]
    }
  }))
  .post("/account", {
    body: t.Object({
      accountId: t.String()
    }),
    response: t.Object({
      status: t.Union([t.Literal('success'), t.Literal('processing'), t.Literal('error')]),
      data: t.Optional(t.Object({
        exists: t.Boolean(),
        summary: t.Optional(t.Object({
          totalUsdValue: t.Number(),
          nearBalance: t.String(),
          defiValue: t.Number(),
          transactionCount: t.Number(),
          isBot: t.Boolean(),
          robustSummary: t.Optional(t.String()),
          shortSummary: t.Optional(t.String())
        })),
        taskId: t.Optional(t.String())
      })),
      error: t.Optional(t.String())
    }),
    handler: async ({ body }: AccountRequest) => {
      try {
        const { accountId } = body;
        const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/accounts/${accountId}/exists`, {
          headers: {
            'Authorization': `Bearer ${process.env.API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to check account: ${response.statusText}`);
        }

        const { exists } = await response.json();
        
        if (exists) {
          const summaryResponse = await fetch(
            `${process.env.NEO4J_API_URL}/api/v1/accounts/${accountId}/summary`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.API_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            return {
              status: 'success',
              data: { exists, summary }
            };
          }
        }

        // Start processing
        const processingResponse = await fetch(`${process.env.NEO4J_API_URL}/api/v1/pipeline/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.API_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accountId })
        });

        if (!processingResponse.ok) {
          throw new Error(`Failed to start processing: ${processingResponse.statusText}`);
        }

        const { taskId } = await processingResponse.json();
        return {
          status: 'processing',
          data: { exists, taskId }
        };

      } catch (error) {
        logger.error('Error processing account:', error);
        return {
          status: 'error',
          error: error instanceof Error ? error.message : 'Failed to process account'
        };
      }
    }
  });

export default intakeRoutes;