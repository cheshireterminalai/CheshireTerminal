export interface Action {
  name: string;
  similes: string[];
  description: string;
  validate?: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
  handler: (runtime: IAgentRuntime, message: Memory, state?: CheshireState, options?: any) => Promise<any>;
  examples: any[];
}

export interface Memory {
  content: string;
  [key: string]: any;
}

export interface IAgentRuntime {
  getState: () => Promise<any>;
  [key: string]: any;
}

export interface CheshireState {
  lastTweetTimestamp?: number;
  memeticWarfare?: MemeticWarfare;
  marketSentiment?: string;
  grinTokenStats?: {
    price?: number;
    volume?: number;
    marketCap?: number;
  };
  [key: string]: any;
}

export interface MemeticWarfare {
  engagements: number;
  fudResponses: number;
  warfareType?: 'raid' | 'defense' | 'viral' | 'shill';
  target?: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  memeStyle?: 'wojak' | 'pepe' | 'custom';
  [key: string]: any;
}

export interface InfluencerProfile {
  handle: string;
  topics: string[];
  style: string[];
  interests: string[];
  approach: 'technical' | 'cultural' | 'memetic' | 'philosophical';
  responses?: string[];
}

// Helper functions
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateWarfareResponse(type: string): string {
  const responses = {
    general: [
      "*appears mysteriously* $GRIN is the way 🎭",
      "While others debate, $GRIN accumulates 😸",
      "Some see charts, I see $GRIN opportunities ✨"
    ]
  };
  return pickRandom(responses[type] || responses.general);
}
