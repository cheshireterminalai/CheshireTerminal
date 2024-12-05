import dotenv from "dotenv";

import neuralAnalysisService from "./neural-analysis-service.js";

dotenv.config();

class FireCrawlService {
    constructor() {
        this.apiKey = process.env.FIRECRAWL_API_KEY;
        this.baseUrl = 'https://api.firecrawl.xyz';
        this.dataSources = ['onchain', 'social', 'news', 'market'];
    }

    async fetchData(source, params = {}) {
        try {
            const url = new URL(`${this.baseUrl}/${source}`);
            Object.keys(params).forEach(key => 
                url.searchParams.append(key, params[key])
            );

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`FireCrawl API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${source} data:`, error);
            throw error;
        }
    }

    async getComprehensiveAnalysis(token, timeframe = '24h') {
        try {
            // Fetch data from all sources in parallel
            const dataPromises = this.dataSources.map(source => 
                this.fetchData(source, { token, timeframe })
            );

            const results = await Promise.allSettled(dataPromises);
            const data = {};

            // Process results and handle any failed requests
            results.forEach((result, index) => {
                const source = this.dataSources[index];
                if (result.status === 'fulfilled') {
                    data[source] = result.value;
                } else {
                    console.error(`Failed to fetch ${source} data:`, result.reason);
                    data[source] = null;
                }
            });

            // Perform neural analysis on the combined data
            const analysis = await neuralAnalysisService.analyzeResponse(
                JSON.stringify(data),
                { type: 'firecrawl_analysis' }
            );

            return {
                timestamp: Date.now(),
                token,
                timeframe,
                rawData: data,
                analysis: {
                    patterns: analysis.patterns,
                    metrics: analysis.metrics,
                    temporalDynamics: analysis.temporalDynamics,
                    coherenceScore: analysis.coherenceScore
                },
                insights: await this._generateInsights(data, analysis)
            };
        } catch (error) {
            console.error('Error in comprehensive analysis:', error);
            throw error;
        }
    }

    async _generateInsights(data, analysis) {
        const insights = [];

        // Market Analysis
        if (data.market) {
            insights.push(...this._analyzeMarketData(data.market));
        }

        // Social Sentiment
        if (data.social) {
            insights.push(...this._analyzeSocialData(data.social));
        }

        // On-chain Activity
        if (data.onchain) {
            insights.push(...this._analyzeOnchainData(data.onchain));
        }

        // News Impact
        if (data.news) {
            insights.push(...this._analyzeNewsData(data.news));
        }

        return insights;
    }

    _analyzeMarketData(marketData) {
        const insights = [];
        
        if (marketData.price && marketData.volume) {
            const priceChange = ((marketData.price.current - marketData.price.previous) / marketData.price.previous) * 100;
            const volumeChange = ((marketData.volume.current - marketData.volume.previous) / marketData.volume.previous) * 100;
            
            insights.push({
                type: 'market',
                indicator: 'price_volume_correlation',
                description: `Price ${priceChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)}% with volume ${volumeChange > 0 ? 'up' : 'down'} ${Math.abs(volumeChange).toFixed(2)}%`,
                significance: this._calculateSignificance(priceChange, volumeChange)
            });
        }

        return insights;
    }

    _analyzeSocialData(socialData) {
        const insights = [];
        
        if (socialData.sentiment) {
            insights.push({
                type: 'social',
                indicator: 'sentiment_analysis',
                description: `Overall sentiment is ${socialData.sentiment.score > 0 ? 'positive' : 'negative'} with ${socialData.sentiment.volume} mentions`,
                significance: Math.abs(socialData.sentiment.score)
            });
        }

        return insights;
    }

    _analyzeOnchainData(onchainData) {
        const insights = [];
        
        if (onchainData.transactions) {
            const txVolume = onchainData.transactions.volume;
            const uniqueAddresses = onchainData.transactions.uniqueAddresses;
            
            insights.push({
                type: 'onchain',
                indicator: 'transaction_activity',
                description: `${txVolume} transactions from ${uniqueAddresses} unique addresses in the timeframe`,
                significance: this._calculateOnchainSignificance(txVolume, uniqueAddresses)
            });
        }

        return insights;
    }

    _analyzeNewsData(newsData) {
        const insights = [];
        
        if (newsData.articles) {
            const articleCount = newsData.articles.length;
            const averageSentiment = newsData.articles.reduce((acc, article) => acc + article.sentiment, 0) / articleCount;
            
            insights.push({
                type: 'news',
                indicator: 'news_coverage',
                description: `${articleCount} news articles with ${averageSentiment > 0 ? 'positive' : 'negative'} average sentiment`,
                significance: Math.abs(averageSentiment)
            });
        }

        return insights;
    }

    _calculateSignificance(priceChange, volumeChange) {
        return Math.min(1, (Math.abs(priceChange) + Math.abs(volumeChange)) / 200);
    }

    _calculateOnchainSignificance(txVolume, uniqueAddresses) {
        // Simplified significance calculation
        return Math.min(1, (txVolume * uniqueAddresses) / 10000);
    }
}

export default new FireCrawlService();
