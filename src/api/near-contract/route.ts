// File: src/api/near-contract/route.ts

import { Elysia, t } from "elysia";
import { connect, keyStores, Contract, utils } from "near-api-js";
import dotenv from 'dotenv';

dotenv.config();

const config = {
  networkId: process.env.NEAR_NETWORK || "testnet",
  keyStore: new keyStores.InMemoryKeyStore(),
  nodeUrl: process.env.NEAR_NODE_URL || "https://rpc.testnet.near.org",
  walletUrl: process.env.NEAR_WALLET_URL || "https://wallet.testnet.near.org",
  helperUrl: process.env.NEAR_HELPER_URL || "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

function handleContractError(error: unknown) {
  console.error("Contract interaction error:", error);
  if (error instanceof Error && error.toString().includes("Cannot read properties of undefined")) {
    return { error: "Contract method not found or not accessible" };
  }
  return { error: error instanceof Error ? error.message : String(error) };
}

interface NearContract extends Contract {
  get_contract_metadata: () => Promise<any>;
  getQueryPrice: () => Promise<string>;
  setQueryPrice: (args: { price: string }) => Promise<void>;
  payForQuery: (args: {}, gas: string, amount: string) => Promise<boolean>;
  mintNFT: (args: { address: string, metadata: { name: string, description: string } }) => Promise<boolean>;
}

const nearContractRoutes = new Elysia({ prefix: "/near-contract" })
  .get("/query-price", async () => {
    const near = await connect(config);
    let account;
    try {
      account = await near.account(process.env.NEAR_ACCOUNT_ID ?? 'default_account_id');
    } catch (error) {
      console.error("Error accessing NEAR account:", error);
      return { error: "Failed to access NEAR account" };
    }
    const contractName = process.env.NEAR_CONTRACT_NAME || "default_contract_name";
    const contract = new Contract(account, contractName, {
      viewMethods: ["get_contract_metadata", "getQueryPrice"],
      changeMethods: ["setQueryPrice", "payForQuery", "mintNFT"],
      useLocalViewExecution: true, // Set to true for blockchain queries
    }) as NearContract;

    try {
      const price = await contract.getQueryPrice();
      return { price };
    } catch (error) {
      return handleContractError(error);
    }
  })
  .post("/pay-for-query", async ({ body }) => {
    const near = await connect(config);
    let account;
    try {
      account = await near.account(process.env.NEAR_ACCOUNT_ID ?? 'default_account_id');
    } catch (error) {
      console.error("Error accessing NEAR account:", error);
      return { error: "Failed to access NEAR account" };
    }
    const contractName = process.env.NEAR_CONTRACT_NAME || "default_contract_name";
    const contract = new Contract(account, contractName, {
      viewMethods: ["get_contract_metadata", "getQueryPrice"],
      changeMethods: ["setQueryPrice", "payForQuery", "mintNFT"],
      useLocalViewExecution: true, // Set to true for blockchain queries
    }) as NearContract;

    try {
      const result = await contract.payForQuery(
        {},
        "300000000000000", // gas
        utils.format.parseNearAmount(body.amount) ?? "0" // Convert to yoctoNEAR, default to "0" if null
      );
      return { success: true, result };
    } catch (error) {
      return handleContractError(error);
    }
  }, {
    body: t.Object({
      amount: t.String()
    })
  })
  .post("/mint-nft", async ({ body }) => {
    const near = await connect(config);
    let account;
    try {
      account = await near.account(process.env.NEAR_ACCOUNT_ID ?? 'default_account_id');
    } catch (error) {
      console.error("Error accessing NEAR account:", error);
      return { error: "Failed to access NEAR account" };
    }
    const contractName = process.env.NEAR_CONTRACT_NAME || "default_contract_name";
    const contract = new Contract(account, contractName, {
      viewMethods: ["get_contract_metadata", "getQueryPrice"],
      changeMethods: ["setQueryPrice", "payForQuery", "mintNFT"],
      useLocalViewExecution: true, // Set to true for blockchain queries
    }) as NearContract;

    try {
      const result = await contract.mintNFT({
        address: body.address,
        metadata: body.metadata
      });
      return { success: true, result };
    } catch (error) {
      return handleContractError(error);
    }
  }, {
    body: t.Object({
      address: t.String(),
      metadata: t.Object({
        name: t.String(),
        description: t.String()
      })
    })
  });

export default nearContractRoutes;
