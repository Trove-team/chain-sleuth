// File: src/api/ref-finance/routes.ts

import { Elysia } from "elysia";
import {
  EstimateSwapView,
  Transaction,
  WRAP_NEAR_CONTRACT_ID,
  estimateSwap,
  fetchAllPools,
  ftGetTokenMetadata,
  getExpectedOutputFromSwapTodos,
  getStablePools,
  instantSwap,
  nearDepositTransaction,
  nearWithdrawTransaction,
  percentLess,
  scientificNotationToString,
  separateRoutes,
} from "@ref-finance/ref-sdk";
import Big from "big.js";

import { searchToken } from "@/utils/search-token";

const refFinanceRoutes = new Elysia({ prefix: "/ref-finance" })
  .get("/token/:token", async ({ params: { token } }) => {
    const tokenMatch = searchToken(token)[0];
    if (!tokenMatch) {
      return {
        error: `Token ${token} not found`,
      };
    }
    const tokenMetadata = await ftGetTokenMetadata(tokenMatch.id);
    if (!tokenMetadata) {
      return {
        error: `Metadata for token ${token} not found`,
      };
    }

    return {
      ...tokenMetadata,
      icon: "",
    };
  })
  .get("/swap/:tokenIn/:tokenOut/:quantity", async ({ params: { tokenIn, tokenOut, quantity }, headers }) => {
    const mbMetadata = JSON.parse(headers["mb-metadata"] || "{}");
    const accountId = mbMetadata?.accountData?.accountId || "near";

    const { ratedPools, unRatedPools, simplePools } = await fetchAllPools();

    const stablePools = unRatedPools.concat(ratedPools);

    const stablePoolsDetail = await getStablePools(stablePools);

    const tokenInMatch = searchToken(tokenIn)[0];
    const tokenOutMatch = searchToken(tokenOut)[0];

    if (!tokenInMatch || !tokenOutMatch) {
      return {
        error: `Unable to find token(s) tokenInMatch: ${tokenInMatch?.name} tokenOutMatch: ${tokenOutMatch?.name}`,
      };
    }

    const [tokenInData, tokenOutData] = await Promise.all([
      ftGetTokenMetadata(tokenInMatch.id),
      ftGetTokenMetadata(tokenOutMatch.id),
    ]);

    if (tokenInData.id === tokenOutData.id) {
      if (tokenInData.id === WRAP_NEAR_CONTRACT_ID) {
        return { error: "This endpoint does not support wrapping / unwrap NEAR directly" };
      }
      return { error: "TokenIn and TokenOut cannot be the same" };
    }

    const refEstimateSwap = (enableSmartRouting: boolean) => {
      return estimateSwap({
        tokenIn: tokenInData,
        tokenOut: tokenOutData,
        amountIn: quantity,
        simplePools,
        options: {
          enableSmartRouting,
          stablePools,
          stablePoolsDetail,
        },
      });
    };

    const swapTodos: EstimateSwapView[] = await refEstimateSwap(true).catch(() => {
      return refEstimateSwap(false); // fallback to non-smart routing if unsupported
    });

    const transactionsRef: Transaction[] = await instantSwap({
      tokenIn: tokenInData,
      tokenOut: tokenOutData,
      amountIn: quantity,
      swapTodos,
      slippageTolerance: 0.03,
      AccountId: accountId,
      referralId: "chainsleuth.near",
    });

    if (tokenInData.id === WRAP_NEAR_CONTRACT_ID) {
      transactionsRef.splice(-1, 0, nearDepositTransaction(quantity));
    }

    if (tokenOutData.id === WRAP_NEAR_CONTRACT_ID) {
      const outEstimate = getExpectedOutputFromSwapTodos(swapTodos, tokenOutData.id);

      const routes = separateRoutes(swapTodos, tokenOutData.id);

      const bigEstimate = routes.reduce((acc, cur) => {
        const curEstimate = Big(cur[cur.length - 1].estimate);
        return acc.add(curEstimate);
      }, outEstimate);

      const minAmountOut = percentLess(0.01, scientificNotationToString(bigEstimate.toString()));

      transactionsRef.push(nearWithdrawTransaction(minAmountOut));
    }

    return transactionsRef;
  });

  export const [routeName]Routes = [routeName]Routes;