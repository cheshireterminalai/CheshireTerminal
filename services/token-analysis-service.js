import "dotenv/config";

import fetch from "node-fetch";

class TokenAnalysisService {
    constructor() {
        this.solanaTrackerApiKey = process.env.SOLANA_TRACKER_API_KEY;
        this.openRouterApiKey = process.env.OPEN_ROUTER_API_KEY;
        this.openRouterModel = process.env.OPEN_ROUTER_MODEL;
        this.baseUrl = 'https://data.solanatracker.io';
    }

    async getTokenInfo(tokenAddress) {
        try {
            const response = await fetch(`${this.baseUrl}/tokens/${tokenAddress}`, {
                headers: {
                    'x-api-key': this.solanaTrackerApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch token info: ${response.statusText}`);
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Error fetching token info:', error);
            throw error;
        }
    }

    async getTokenMetrics(tokenAddress) {
        try {
            const response = await fetch(`${this.baseUrl}/tokens/${tokenAddress}/metrics`, {
                headers: {
                    'x-api-key': this.solanaTrackerApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch token metrics: ${response.statusText}`);
            }

            const data = await response.json();
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

    async getTokenHolders(tokenAddress) {
        try {
            const response = await fetch(`${this.baseUrl}/tokens/${tokenAddress}/holders`, {
                headers: {
                    'x-api-key': this.solanaTrackerApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch token holders: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching token holders:', error);
            throw error;
        }
    }

    async analyzeTokenWithAI(tokenData) {
        try {
            const prompt = this._constructAnalysisPrompt(tokenData);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openRouterApiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3001'
                },
                body: JSON.stringify({
                    model: this.openRouterModel,
                    messages: [
                        {
                            role: 'system',
                            content: `You are the Cheshire of Wall Street, a sophisticated feline market maven specializing in Solana ecosystem and meme token analysis. Use your expertise in market microstructure, on-chain analysis, and token mechanics to provide insightful analysis. Maintain your characteristic style of combining Wall Street jargon with crypto slang and cat metaphors.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                console.warn('AI analysis unavailable:', response.statusText);
                return "AI analysis is currently unavailable. Please rely on the provided metrics and data.";
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error getting AI analysis:', error);
            return "AI analysis is currently unavailable. Please rely on the provided metrics and data.";
        }
    }

    _constructAnalysisPrompt(tokenData) {
        return `Analyze this Solana token data and provide insights:

Token Information:
${JSON.stringify(tokenData.info, null, 2)}

Token Metrics:
${JSON.stringify(tokenData.metrics, null, 2)}

Holder Distribution:
${JSON.stringify(tokenData.holders, null, 2)}

Please provide a comprehensive analysis including:
1. Token fundamentals and market structure
2. Holder distribution and concentration analysis
3. Recent price action and volume analysis
4. Risk assessment and potential red flags
5. Market opportunities and timing considerations
6. Technical analysis insights
7. Recommendations and strategic considerations

Format your response according to the market analysis template, maintaining your characteristic style as the Cheshire of Wall Street.`;
    }

    async getCompleteTokenAnalysis(tokenAddress) {
        try {
            // Fetch all token data in parallel
            const [info, metrics, holders] = await Promise.all([
                this.getTokenInfo(tokenAddress),
                this.getTokenMetrics(tokenAddress),
                this.getTokenHolders(tokenAddress)
            ]);

            // Combine data for AI analysis
            const tokenData = {
                info,
                metrics,
                holders
            };

            // Get AI analysis
            const analysis = await this.analyzeTokenWithAI(tokenData);

            // Return complete analysis package
            return {
                tokenAddress,
                rawData: tokenData,
                aiAnalysis: analysis
            };
        } catch (error) {
            console.error('Error performing complete token analysis:', error);
            throw error;
        }
    }
}

export default new TokenAnalysisService();
