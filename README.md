# Chain-Sleuth Agent

<img src="https://github.com/user-attachments/assets/aa54bac4-30ef-49bb-bac7-732ff561bd95" alt="cover_image" width="0"/>

Chain Sleuth is a a comprehnsive data querying tool that uses a Bitte.ai Plugin for facilitating near blockchain investigations and general blockchain data queries.

[![Demo](https://img.shields.io/badge/Demo-Visit%20Demo-brightgreen)](https://ref-finance-agent-next.vercel.app/)
[![Deploy](https://img.shields.io/badge/Deploy-on%20Vercel-blue)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMintbase%2Fref-finance-agent-next)

**Tooling:**


[![Framework](https://img.shields.io/badge/Framework-Next.js%2014-blue)](#)

## Project Walkthrough

Chain sleuth agent facilitates the development of AI-powered blockchain investigation agents. 

#### API Base URL

https://chain-sleuth.vercel.app/

#### Endpoints

- Token Metadata `GET` `/api/token/{token}`

- Swap Transactions `GET` `/api/swap/{tokenIn}/{tokenOut}/{quantity}`

#### Usage
Make LLM requests to the endpoints above. Refer to the full API documentation for detailed parameter and response information.


## Getting Started
[Docs to integrate](https://docs.mintbase.xyz/ai/assistant-plugins)  

### Installation

Set `NEAR_ENV="mainnet"` in your `.env.local` file.

```bash
# install dependencies
pnpm i

# start the development server
pnpm dev
```

## Demo
https://github.com/Mintbase/ref-finance-agent-next/assets/838839/3291eaf9-aa79-4c95-8c5f-673a6d72dc96

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

<img src="https://i.imgur.com/fgFX6BS.png" alt="detail_image" width="0"/>


