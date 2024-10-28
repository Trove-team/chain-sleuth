import { Elysia, t } from "elysia";

interface InvestigationRequest {
  queried_name: string;
}

interface InvestigationStatus {
  stage: 'investigation-started' | 'investigation-in-progress' | 'investigation-complete';
  message: string;
  requestId: string;
}

interface CompletionRequest {
  requestId: string;
  robust_summary: string;
  short_summary: string;
  deposit: string; // Add deposit field
}

interface NFTMetadata {
  title: string;
  description: string;
  extra: string;
}

interface CompletionResponse {
  status: 'success' | 'error';
  message: string;
  tokenId: string;
  requestId: string;
  nftMetadata: NFTMetadata;
}

const testInvestigationRoutes = new Elysia({ prefix: "/near-contract/test-investigation" })
  .post("/", ({ body }) => {
    const { queried_name } = body as InvestigationRequest;
    const requestId = `test-${Date.now()}:${queried_name}`;
    return {
      status: 'success',
      requestId,
      message: 'Investigation requested successfully'
    };
  }, {
    body: t.Object({
      queried_name: t.String()
    })
  })
  .get("/status", ({ query }) => {
    const { requestId } = query as { requestId: string };
    // Simulate progress
    const progress = Math.random();
    let status: InvestigationStatus['stage'];
    if (progress < 0.3) status = 'investigation-started';
    else if (progress < 0.7) status = 'investigation-in-progress';
    else status = 'investigation-complete';
    
    return {
      stage: status,
      message: `Investigation is ${status}`,
      requestId
    } as InvestigationStatus;
  }, {
    query: t.Object({
      requestId: t.String()
    })
  })
  .post("/complete", ({ body }) => {
    const { requestId, robust_summary, short_summary, deposit } = body as CompletionRequest;
    
    // Check for the required deposit
    if (deposit !== '0.05') {
      return {
        status: 'error',
        message: 'Invalid deposit amount. Required: 0.05 NEAR',
      };
    }

    // Simulate NFT minting
    const tokenId = `nft-${Date.now()}`;
    return {
      status: 'success',
      message: 'Investigation completed and NFT minted',
      tokenId,
      requestId,
      nftMetadata: {
        title: `Investigation Result for ${requestId.split(':')[1]}`,
        description: robust_summary,
        extra: short_summary
      }
    } as CompletionResponse;
  }, {
    body: t.Object({
      requestId: t.String(),
      robust_summary: t.String(),
      short_summary: t.String(),
      deposit: t.String()
    })
  });

export default testInvestigationRoutes;
