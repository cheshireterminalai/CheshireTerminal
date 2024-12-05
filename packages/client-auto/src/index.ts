import {
    Client,
    IAgentRuntime,
} from "@ai16z/eliza";
import {
    TokenProvider,
    WalletProvider,
} from "@ai16z/plugin-solana";
import { TrustScoreDatabase } from "@ai16z/plugin-trustdb";
import {
    Connection,
    PublicKey,
} from "@solana/web3.js";

export class AutoClient {
    interval: NodeJS.Timeout;
    runtime: IAgentRuntime;
    walletProvider: InstanceType<typeof WalletProvider>;
    trustScoreDb: TrustScoreDatabase;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;

        const connection = new Connection(runtime.getSetting("RPC_URL"));
        const publicKey = new PublicKey(runtime.getSetting("WALLET_PUBLIC_KEY"));
        
        this.trustScoreDb = new TrustScoreDatabase(runtime.databaseAdapter.db);
        this.walletProvider = new WalletProvider(connection, publicKey);

        // start a loop that runs every x seconds
        this.interval = setInterval(
            async () => {
                await this.makeTrades();
            },
            60 * 60 * 1000
        ); // 1 hour in milliseconds
    }

    async makeTrades() {
        console.log("Running auto loop");

        // Get recommendations from the last hour
        const startDate = new Date(new Date().getTime() - 60 * 60 * 1000);
        const endDate = new Date();
        
        const recommendations = this.trustScoreDb.getRecommendationsByDateRange(startDate, endDate);
        
        // Get recommender metrics for each recommendation to filter by trust score
        const highTrustRecommendations = (await Promise.all(
            recommendations.map(async (rec) => {
                const metrics = this.trustScoreDb.getRecommenderMetrics(rec.recommenderId);
                if (metrics && metrics.trustScore > 0.7) {
                    return rec;
                }
                return null;
            })
        )).filter((rec): rec is NonNullable<typeof rec> => rec !== null);

        // Get information for all tokens which were recommended
        const tokenInfos = await Promise.all(
            highTrustRecommendations.map(async (recommendation) => {
                const tokenProvider = new TokenProvider(
                    recommendation.tokenAddress,
                    this.walletProvider
                );
                const tokenInfo = await tokenProvider.getProcessedTokenData();
                return { tokenInfo };
            })
        );

        // get any additional information we might need
        // make sure we're looking at the right tokens and data

        // shaw -- TODOs
        // compose thesis context
        // write a thesis which trades and why

        // compose trade context
        // geratate trades with LLM
        // parse trades from LLM
        // post thesis to twitter

        // malibu todos
        // execute trades
    }
}

export const AutoClientInterface: Client = {
    start: async (runtime: IAgentRuntime) => {
        const client = new AutoClient(runtime);
        return client;
    },
    stop: async (runtime: IAgentRuntime) => {
        console.warn("Direct client does not support stopping yet");
    },
};

export default AutoClientInterface;
