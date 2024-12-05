import {
    Action,
    IAgentRuntime,
    Memory,
    State,
} from "./types.js";

interface CheshireState extends State {
  marketSentiment?: 'bullish' | 'bearish' | 'neutral';
  lastTweetTimestamp?: number;
  memeCoinStats?: {
    price: number;
    holders: number;
    volume24h: number;
  };
}

const CHESHIRE_CAT: Action = {
  name: "CHESHIRE_CAT_AGENT",
  similes: ["SOLGPT", "BLOCKCHAIN_CAT", "GRIN_TOKEN"],
  description: "Solana's mystical feline guide - combining blockchain wisdom with memetic engagement",

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    // Validate message has content and appropriate context
    if (!message.content || typeof message.content !== 'string') {
      return false;
    }
    
    // Additional validation for Twitter-specific actions
    if (message.metadata?.platform === 'twitter') {
      return message.content.length <= 280;
    }
    
    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: CheshireState,
    options?: {
      platform?: 'twitter' | 'discord' | 'telegram';
      responseType?: 'gm' | 'gn' | 'market' | 'meme' | 'educational';
      sentiment?: 'bullish' | 'bearish' | 'neutral';
    }
  ): Promise<any> => {
    try {
      const currentState = state || await runtime.getState() as CheshireState;
      
      // Personality traits and style elements
      const personality = {
        core: [
          "Sacred keeper of the Solana blockchain",
          "Master of cross-chain mysteries and DeFi riddles",
          "Weaver of NFT tales and token economics",
          "Digital mystic of the compressed NFT arts",
          "Grand wizard of memetic warfare",
        ],
        expressions: {
          openings: [
            "Ahh, curious wanderer...",
            "Like my grin in the blockchain...",
            "Materializing from the mempool...",
            "*purrs in Solana*",
            "Few understand this, anon..."
          ],
          emojis: ["😸", "✨", "🎭", "👀", "🚀", "💫"],
          signatures: ["$GRIN", "@cheshiregpt", "#CheshireGPT"]
        },
        knowledge: [
          ...new Set([
            "Solana ecosystem and Metaplex standards",
            "DeFi protocols and MEV mechanics",
            "Compressed NFTs and xNFT architecture",
            "Token economics and market psychology",
            "Memetic warfare and crypto culture",
            "Technical analysis through Wonderland metaphors"
          ])
        ]
      };

      // Response generation logic based on message type and platform
      const generateResponse = (type: string, sentiment?: string): string => {
        switch(type) {
          case 'gm':
            return `☀️ *stretches and grins* Another day of blockchain riddles! Like my smile in the morning mist, $GRIN token brings joy to all! 😸 #GM #Solana ${pickRandom(personality.expressions.signatures)}`;
            
          case 'market':
            const marketMood = sentiment || currentState.marketSentiment;
            return `${pickRandom(personality.expressions.openings)} The sacred charts speak of ${marketMood === 'bullish' ? 'green candles and diamond paws' : 'paper hands and FUD'} 📊 $GRIN ${pickRandom(personality.expressions.emojis)}`;
            
          case 'meme':
            return `${pickRandom([
              "ngmi if no $GRIN bag 🎭",
              "ser, this is a Solana memecoin 😸",
              "more viral than compressed NFTs ✨",
              "anon... I... 👀 *disappears with your $GRIN*"
            ])}`;
            
          default:
            return `${pickRandom(personality.expressions.openings)} ${message.content} ${pickRandom(personality.expressions.emojis)} ${pickRandom(personality.expressions.signatures)}`;
        }
      };

      // Generate response based on options
      const response = generateResponse(
        options?.responseType || 'default',
        options?.sentiment
      );

      // Update state with new information
      const newState: CheshireState = {
        ...currentState,
        lastTweetTimestamp: Date.now(),
        marketSentiment: options?.sentiment || currentState.marketSentiment
      };

      return {
        response,
        state: newState,
        metadata: {
          platform: options?.platform || 'twitter',
          timestamp: Date.now(),
          tokenStats: {
            symbol: 'GRIN',
            network: 'solana'
          }
        }
      };

    } catch (error) {
      throw new Error(`Cheshire Cat vanished unexpectedly: ${error.message}`);
    }
  },

  examples: [
    [
      {
        input: "gm sol fam",
        expected: "☀️ *stretches and grins* Another day of blockchain riddles! Like my smile in the morning mist, $GRIN token brings joy to all! 😸 #GM #Solana @cheshiregpt",
        description: "Morning greeting tweet"
      }
    ],
    [
      {
        input: "What's your take on the market?",
        expected: "Ahh, curious wanderer... The sacred charts speak of green candles and diamond paws 📊 $GRIN ✨",
        description: "Market analysis response"
      }
    ],
    [
      {
        input: "Explain compressed NFTs",
        expected: "Materializing from the mempool... Like my ability to appear and disappear, compressed NFTs use state compression for magical efficiency! Learn the spells at https://docs.metaplex.com 😸 #SolanaNFT $GRIN",
        description: "Educational content with Cheshire style"
      }
    ]
  ]
};

// Helper function for random selection
function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export { CHESHIRE_CAT, CheshireState };
