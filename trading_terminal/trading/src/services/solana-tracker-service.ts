import axios from "axios";

export interface TokenInfo {
    name: string;
    symbol: string;
    mint: string;
    uri: string;
    decimals: number;
    image: string;
    description: string;
    hasFileMetaData: boolean;
}

export interface TokenMetrics {
    currentPrice: number;
    marketCap: number;
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
}

export interface TokenAnalysis {
    token: TokenInfo;
    metrics: TokenMetrics;
    riskScore: number;
    riskFactors: string[];
}

export class SolanaTrackerService {
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly rateLimitDelay: number = 2000; // 2 seconds between requests
    private lastRequestTime: number = 0;

    constructor() {
        this.apiKey = process.env.SOLANA_TRACKER_API_KEY || '7d5348f1-b95e-4569-8256-375a2ac01437';
        this.baseUrl = 'https://data.solanatracker.io';
    }

    private get axiosConfig() {
        return {
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        };
    }

    private async makeRequest<T>(url: string, retries: number = 3): Promise<T> {
        // Ensure we wait between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }

        try {
            this.lastRequestTime = Date.now();
            const response = await axios.get(url, this.axiosConfig);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 429 && retries > 0) {
                console.log(`Rate limited, waiting ${this.rateLimitDelay * 2}ms before retry... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * 2));
                return this.makeRequest(url, retries - 1);
            }
            throw error;
        }
    }

    async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
        try {
            const data = await this.makeRequest<{ token: TokenInfo }>(
                `${this.baseUrl}/tokens/${tokenAddress}`
            );
            return data.token;
        } catch (error) {
            console.error('Error fetching token info:', error);
            throw error;
        }
    }

    async analyzeTokenMetrics(tokenAddress: string): Promise<TokenAnalysis> {
        try {
            const [tokenInfo, metrics] = await Promise.all([
                this.getTokenInfo(tokenAddress),
                this.getTokenMetrics(tokenAddress)
            ]);

            const riskAnalysis = await this.analyzeRisk(tokenAddress);

            return {
                token: tokenInfo,
                metrics,
                riskScore: riskAnalysis.score,
                riskFactors: riskAnalysis.factors
            };
        } catch (error) {
            console.error('Error analyzing token metrics:', error);
            throw error;
        }
    }

    private async getTokenMetrics(tokenAddress: string): Promise<TokenMetrics> {
        try {
            const data = await this.makeRequest<any>(
                `${this.baseUrl}/tokens/${tokenAddress}/metrics`
            );

            return {
                currentPrice: data.price?.usd || 0,
                marketCap: data.marketCap?.usd || 0,
                liquidity: data.liquidity?.usd || 0,
                volume24h: data.volume24h || 0,
                priceChange24h: data.priceChange24h || 0
            };
        } catch (error) {
            console.error('Error fetching token metrics:', error);
            throw error;
        }
    }

    private async analyzeRisk(tokenAddress: string): Promise<{ score: number; factors: string[] }> {
        try {
            const data = await this.makeRequest<any>(
                `${this.baseUrl}/tokens/${tokenAddress}/risk`
            );

            return {
                score: data.score || 0,
                factors: data.risks || []
            };
        } catch (error) {
            console.error('Error analyzing risk:', error);
            throw error;
        }
    }

    async getTrendingTokens(): Promise<TokenInfo[]> {
        try {
            const data = await this.makeRequest<TokenInfo[]>(
                `${this.baseUrl}/tokens/trending`
            );
            return data;
        } catch (error) {
            console.error('Error fetching trending tokens:', error);
            throw error;
        }
    }

    async getTokenHolders(tokenAddress: string): Promise<any> {
        try {
            const data = await this.makeRequest<any>(
                `${this.baseUrl}/tokens/${tokenAddress}/holders`
            );
            return data;
        } catch (error) {
            console.error('Error fetching token holders:', error);
            throw error;
        }
    }

    async getTokenATH(tokenAddress: string): Promise<{ price: number; timestamp: number }> {
        try {
            const data = await this.makeRequest<any>(
                `${this.baseUrl}/tokens/${tokenAddress}/ath`
            );
            return {
                price: data.highest_price || 0,
                timestamp: data.timestamp || 0
            };
        } catch (error) {
            console.error('Error fetching token ATH:', error);
            throw error;
        }
    }
}

// Create and export a default instance
export const solanaTrackerService = new SolanaTrackerService();
export default solanaTrackerService;
