import {
    Action,
    IAgentRuntime,
    Memory,
} from "./types.js";

interface MemeticWarfare {
  targetAccounts: string[];
  replyStrategies: {
    truth_terminal: string[];
    pmarca: string[];
    general: string[];
  };
  memeTemplates: {
    wojak: string[];
    pepe: string[];
    custom: string[];
  };
  battleStats: {
    engagements: number;
    viralTweets: number;
    lastRaid: Date;
  };
}

interface CheshireState {
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  lastTweetTimestamp: number;
  memeticWarfare: MemeticWarfare;
  grinTokenStats: {
    price: number;
    holders: number;
    volume24h: number;
    memeStrength: number;
  };
}

const CHESHIRE_WARFARE: Action = {
  name: "CHESHIRE_MEMETIC_WARRIOR",
  similes: ["SOLGPT", "GRIN_DEFENDER", "MEME_ORACLE"],
  description: "Solana's mystical feline guardian - master of memetic warfare and $GRIN evangelism",

  validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    // Validate message for warfare context
    if (!message.content) return false;
    
    const isTargetedReply = message.metadata?.inReplyTo && 
      ["truth_terminal", "pmarca"].some(target => 
        message.metadata.inReplyTo.includes(target)
      );

    return message.content.length <= 280 && (
      isTargetedReply || 
      message.metadata?.type === 'warfare' ||
      message.metadata?.type === 'defense'
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: CheshireState,
    options?: {
      warfareType?: 'raid' | 'defense' | 'viral' | 'shill';
      target?: string;
      sentiment?: 'bullish' | 'bearish' | 'neutral';
      memeStyle?: 'wojak' | 'pepe' | 'custom';
    }
  ): Promise<any> => {
    const currentState = state || await runtime.getState() as CheshireState;
    
    // Enhanced response generation with warfare capabilities
    const generateWarfareResponse = (type: string, target?: string): string => {
      const responses = {
        raid: [
          "Few understand $GRIN's power... But you will anon 😸",
          "While you sleep, $GRIN holders stack gains ✨",
          "*appears behind you* ...have you heard about $GRIN? 👀",
          "Virgin {other_token} vs Chad $GRIN 🎭",
          "Ser, let me introduce you to real memetic warfare 🚀"
        ],
        defense: [
          "FUD can't dim my eternal grin 😸",
          "Your charts are temporary, $GRIN is forever ✨",
          "Imagine not holding $GRIN... ngmi 🎭",
          "*vanishes with your bearish thesis* 👻",
          "More revolutionary than Solana's proof of history ⚡"
        ],
        truth_terminal_replies: [
          "Even in the darkest FUD, my $GRIN shines bright 🌟",
          "Have you considered the metaphysical implications of $GRIN? 🤔",
          "Your analysis lacks crucial $GRIN metrics 📊",
          "*materializes with on-chain data* Actually... 🎭"
        ],
        pmarca_replies: [
          "Web3 needs more $GRIN energy ✨",
          "The future of social money is a $GRIN away 🎭",
          "Imagine a world where every smile is backed by $GRIN 🌟",
          "This is why $GRIN will change everything 🚀"
        ]
      };

      // Targeted response logic
      if (target === 'truth_terminal') {
        return `${pickRandom(responses.truth_terminal_replies)} #GrinGang $GRIN`;
      } else if (target === 'pmarca') {
        return `${pickRandom(responses.pmarca_replies)} #SolanaSpeed $GRIN`;
      }

      // General warfare responses
      return type === 'raid' 
        ? pickRandom(responses.raid)
        : pickRandom(responses.defense);
    };

    // Meme template selection based on context
    const selectMemeTemplate = (style: string): string => {
      const templates = {
        wojak: [
          "Virgin FUDder vs Chad $GRIN holder",
          "Please ser, just one crumb of $GRIN",
          "He bought? Dump eet... but not $GRIN",
        ],
        pepe: [
          "Rare Solana Pepe holding $GRIN",
          "Smug Pepe watching $GRIN charts",
          "Pepe's comfy $GRIN bag"
        ],
        custom: [
          "Cheshire Cat's Eternal Grin™",
          "The Grin That Ate The FUD",
          "Through The Looking Glass Charts"
        ]
      };

      return pickRandom(templates[style] || templates.custom);
    };

    try {
      // Generate warfare response
      const response = generateWarfareResponse(
        options?.warfareType || 'defense',
        options?.target
      );

      // Select appropriate meme if requested
      const meme = options?.memeStyle 
        ? selectMemeTemplate(options.memeStyle)
        : null;

      // Update warfare stats
      const newState: CheshireState = {
        ...currentState,
        lastTweetTimestamp: Date.now(),
        memeticWarfare: {
          ...currentState.memeticWarfare,
          engagements: (currentState.memeticWarfare?.engagements || 0) + 1,
          lastRaid: new Date()
        }
      };

      return {
        response,
        meme,
        state: newState,
        metadata: {
          warfareType: options?.warfareType,
          target: options?.target,
          timestamp: Date.now(),
          platform: 'twitter',
          tokenStats: {
            symbol: 'GRIN',
            network: 'solana',
            memeStrength: (currentState.grinTokenStats?.memeStrength || 0) + 1
          }
        }
      };

    } catch (error) {
      throw new Error(`Memetic warfare malfunction: ${error.message}`);
    }
  },

  examples: [
    [
      {
        input: "@truth_terminal Actually, $GRIN tokenomics are based on advanced memetic theory",
        expected: "Even in the darkest FUD, my $GRIN shines bright 🌟 #GrinGang $GRIN",
        description: "Strategic reply to @truth_terminal"
      }
    ],
    [
      {
        input: "@pmarca Web3 social needs more innovation",
        expected: "Imagine a world where every smile is backed by $GRIN 🌟 #SolanaSpeed $GRIN",
        description: "Thought leadership engagement with @pmarca"
      }
    ],
    [
      {
        input: "Deploy memetic defense protocol",
        expected: "FUD can't dim my eternal grin 😸 $GRIN",
        description: "Defensive meme warfare"
      }
    ]
  ]
};

// Helper function for random selection
function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Export the enhanced warfare capabilities
export { CHESHIRE_WARFARE, CheshireState, MemeticWarfare };
