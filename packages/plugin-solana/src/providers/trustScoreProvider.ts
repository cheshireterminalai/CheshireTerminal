import {
    ProcessedTokenData,
    TokenSecurityData,
} from "../types/token.js";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { TokenProvider } from "./token.js";
import { WalletProvider } from "./wallet.js";
import {
    TrustScoreDatabase,
    RecommenderMetrics,
    TokenPerformance,
    TradePerformance,
    TokenRecommendation,
} from "@ai16z/plugin-trustdb";
import { settings } from "@ai16z/eliza";
import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";

// ... rest of the TrustScoreManager class implementation ...

export class TrustScoreManager {
    // ... class implementation ...
}

export const trustScoreProvider: Provider = {
    get: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string> => {
        try {
            const trustScoreDb = new TrustScoreDatabase(
                runtime.databaseAdapter.db
            );

            // Get the user ID from the message
            const userId = message.userId;

            if (!userId) {
                console.error("User ID is missing from the message");
                return "";
            }

            // Get the recommender metrics for the user
            const recommenderMetrics =
                await trustScoreDb.getRecommenderMetrics(userId);

            if (!recommenderMetrics) {
                console.error("No recommender metrics found for user:", userId);
                return "";
            }

            // Compute the trust score
            const trustScore = recommenderMetrics.trustScore;

            const user = await runtime.databaseAdapter.getAccountById(userId);

            // Format the trust score string
            const trustScoreString = `${user.name}'s trust score: ${trustScore.toFixed(2)}`;

            return trustScoreString;
        } catch (error) {
            console.error("Error in trust score provider:", error.message);
            return `Failed to fetch trust score: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
    },
};
