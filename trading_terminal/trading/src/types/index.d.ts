declare module '@solana/web3.js';
declare module '@project-serum/anchor';

interface TokenInfo {
    name: string;
    symbol: string;
    mint: string;
    uri: string;
    decimals: number;
    image: string;
    description: string;
    extensions?: {
        twitter?: string;
        telegram?: string;
    };
    tags?: string[];
    creator?: {
        name: string;
        site: string;
    };
    hasFileMetaData: boolean;
}

interface TokenPool {
    liquidity: {
        quote: number;
        usd: number;
    };
    price: {
        quote: number;
        usd: number;
    };
    tokenSupply: number;
    lpBurn: number;
    tokenAddress: string;
    marketCap: {
        quote: number;
        usd: number;
    };
    market: string;
    quoteToken: string;
    decimals: number;
    security: {
        freezeAuthority: string | null;
        mintAuthority: string | null;
    };
    lastUpdated: number;
    createdAt: number;
    poolId: string;
}

interface TokenEvents {
    [key: string]: {
        priceChangePercentage: number;
    };
}

interface TokenRisk {
    rugged: boolean;
    risks: Array<{
        name: string;
        description: string;
        level: string;
        score: number;
    }>;
    score: number;
}

interface TokenAnalysis {
    token: TokenInfo;
    pools: TokenPool[];
    events: TokenEvents;
    risk: TokenRisk;
    buys: number;
    sells: number;
    txns: number;
}

interface TokenHolder {
    wallet: string;
    amount: number;
    value: {
        quote: number;
        usd: number;
    };
    percentage: number;
}

interface TokenHolders {
    total: number;
    accounts: TokenHolder[];
}

interface TokenATH {
    highest_price: number;
    timestamp: number;
}

interface TradingSignal {
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
}

interface SignalThresholds {
    priceChange: number;
    volume: number;
    liquidity: number;
}

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            SOLANA_TRACKER_API_KEY: string;
            SOLANA_RPC_URL: string;
            MONITORING_INTERVAL: string;
            SIGNAL_THRESHOLD_PRICE_CHANGE: string;
            SIGNAL_THRESHOLD_VOLUME: string;
            SIGNAL_THRESHOLD_LIQUIDITY: string;
            MONITORED_TOKENS: string;
        }
    }

    interface Window {
        solana: any;
    }

    namespace jest {
        interface Matchers<R> {
            toBeWithinRange(floor: number, ceiling: number): R;
        }
    }
}

export {
    SignalThresholds,
    TokenAnalysis,
    TokenATH,
    TokenEvents,
    TokenHolder,
    TokenHolders,
    TokenInfo,
    TokenPool,
    TokenRisk,
    TradingSignal,
};
