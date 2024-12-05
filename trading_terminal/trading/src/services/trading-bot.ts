import { EventEmitter } from "events";

import {
  SolanaTrackerService,
  TokenAnalysis,
} from "./solana-tracker-service.js";

export interface TradingSignal {
    type: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
    metrics: {
        price: number;
        marketCap: number;
        liquidity: number;
        volume24h: number;
        priceChange24h: number;
    };
    timestamp: number;
    tokenAddress: string;
}

export class TradingBot extends EventEmitter {
    private readonly trackerService: SolanaTrackerService;
    private isRunning: boolean = false;
    private monitoredTokens: Map<string, NodeJS.Timeout> = new Map();
    private signalHistory: Map<string, TradingSignal[]> = new Map();
    private readonly signalThresholds = {
        priceChange: 5,
        liquidity: 500000,
        riskScore: 7
    };

    constructor() {
        super();
        this.trackerService = new SolanaTrackerService();
    }

    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('Trading bot is already running');
            return;
        }

        console.log('Starting trading bot...');
        this.isRunning = true;
        this.emit('started');
    }

    stop(): void {
        if (!this.isRunning) {
            console.log('Trading bot is not running');
            return;
        }

        console.log('Stopping trading bot...');
        this.isRunning = false;
        
        // Clear all monitoring intervals
        for (const [tokenAddress, timer] of this.monitoredTokens) {
            clearInterval(timer);
            console.log(`Stopped monitoring ${tokenAddress}`);
        }
        this.monitoredTokens.clear();
        
        this.emit('stopped');
    }

    async analyzeToken(tokenAddress: string): Promise<TokenAnalysis> {
        try {
            console.log(`\nAnalyzing token ${tokenAddress}...`);
            const analysis = await this.trackerService.analyzeTokenMetrics(tokenAddress);
            
            // Generate trading signal based on analysis
            const signal = this.generateTradingSignal(analysis, tokenAddress);
            
            if (signal.type !== 'HOLD') {
                this.emit(signal.type.toLowerCase() + 'Signal', signal);
                this.addSignalToHistory(tokenAddress, signal);
            }

            return analysis;
        } catch (error) {
            console.error('Error analyzing token:', error);
            throw error;
        }
    }

    private generateTradingSignal(analysis: TokenAnalysis, tokenAddress: string): TradingSignal {
        const metrics = {
            price: analysis.metrics.currentPrice,
            marketCap: analysis.metrics.marketCap,
            liquidity: analysis.metrics.liquidity,
            volume24h: analysis.metrics.volume24h,
            priceChange24h: analysis.metrics.priceChange24h
        };

        // Signal generation logic
        let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let confidence = 0;
        let reason = '';

        // Buy signal conditions
        if (
            metrics.priceChange24h > this.signalThresholds.priceChange &&
            metrics.liquidity > this.signalThresholds.liquidity &&
            analysis.riskScore < this.signalThresholds.riskScore
        ) {
            type = 'BUY';
            confidence = this.calculateConfidence(metrics.priceChange24h, metrics.liquidity, analysis.riskScore);
            reason = 'Strong upward momentum with healthy metrics';
        }
        // Sell signal conditions
        else if (
            metrics.priceChange24h < -this.signalThresholds.priceChange ||
            analysis.riskScore > this.signalThresholds.riskScore
        ) {
            type = 'SELL';
            confidence = this.calculateConfidence(Math.abs(metrics.priceChange24h), metrics.liquidity, analysis.riskScore);
            reason = 'Negative momentum or high risk detected';
        }

        return {
            type,
            confidence,
            reason,
            metrics,
            timestamp: Date.now(),
            tokenAddress
        };
    }

    private calculateConfidence(priceChange: number, liquidity: number, riskScore: number): number {
        // Normalize values to 0-1 range
        const priceChangeScore = Math.min(Math.abs(priceChange) / 20, 1); // Cap at 20% change
        const liquidityScore = Math.min(liquidity / 1000000, 1); // Cap at $1M liquidity
        const riskScoreNorm = 1 - (riskScore / 10); // Invert risk score (0 is best)

        // Weight the factors
        const weights = {
            priceChange: 0.4,
            liquidity: 0.3,
            risk: 0.3
        };

        // Calculate weighted average
        const confidence = (
            priceChangeScore * weights.priceChange +
            liquidityScore * weights.liquidity +
            riskScoreNorm * weights.risk
        ) * 100;

        return Math.round(confidence);
    }

    async monitorToken(tokenAddress: string, interval: number = 300000): Promise<void> {
        if (this.monitoredTokens.has(tokenAddress)) {
            console.log(`Already monitoring token: ${tokenAddress}`);
            return;
        }

        // Initial analysis
        await this.analyzeToken(tokenAddress);

        // Set up periodic monitoring
        const timer = setInterval(async () => {
            if (this.isRunning) {
                await this.analyzeToken(tokenAddress);
            }
        }, interval) as NodeJS.Timeout;

        this.monitoredTokens.set(tokenAddress, timer);
        console.log(`Started monitoring token: ${tokenAddress}`);
    }

    stopMonitoringToken(tokenAddress: string): void {
        const timer = this.monitoredTokens.get(tokenAddress);
        if (timer) {
            clearInterval(timer);
            this.monitoredTokens.delete(tokenAddress);
            console.log(`Stopped monitoring token: ${tokenAddress}`);
        }
    }

    setSignalThresholds(thresholds: Partial<typeof this.signalThresholds>): void {
        Object.assign(this.signalThresholds, thresholds);
    }

    isMonitoring(tokenAddress: string): boolean {
        return this.monitoredTokens.has(tokenAddress);
    }

    getMonitoredTokens(): string[] {
        return Array.from(this.monitoredTokens.keys());
    }

    private addSignalToHistory(tokenAddress: string, signal: TradingSignal): void {
        if (!this.signalHistory.has(tokenAddress)) {
            this.signalHistory.set(tokenAddress, []);
        }
        const signals = this.signalHistory.get(tokenAddress)!;
        signals.push(signal);
        // Keep only last 100 signals
        if (signals.length > 100) {
            signals.shift();
        }
    }

    getSignalHistory(tokenAddress: string): TradingSignal[] {
        return this.signalHistory.get(tokenAddress) || [];
    }
}

// Export both the class and a default instance
export const tradingBot = new TradingBot();
export default tradingBot;
