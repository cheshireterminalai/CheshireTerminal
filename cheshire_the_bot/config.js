import dotenv from "dotenv";
import fs from "fs";
import {
    dirname,
    join,
} from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
    astraDb: {
        apiKey: 'AstraCS:HzpKNylEexwqowMPwUAmHiUX:f3fe18a474e58fd3d79d748b7960593fbff561c31b2f599616bba580e3f6f5cf',
        database: 'cheshire-ai',
        keyspace: 'ai_data',
        region: 'us-east1'
    },
    llm: {
        enabled: true,
        providers: {
            lmStudio: {
                baseUrl: process.env.LM_STUDIO_URL || 'http://localhost:1234',
                endpoints: {
                    models: '/api/v1/models',
                    chat: '/v1/chat/completions',
                    completions: '/v1/completions',
                    embeddings: '/v1/embeddings'
                }
            },
            exoLabs: {
                baseUrl: process.env.EXO_LABS_URL || 'http://localhost:52415',
                endpoints: {
                    chat: '/v1/chat/completions'
                }
            }
        },
        models: {
            text: "hugging-quants/llama-3.2-3b-instruct",
            vision: "llava-v1.5-7b",
            code: "qwen2.5-coder-14b-instruct",
            image: {
                name: "sd3.5_medium",
                defaultParams: {
                    prompt: "",
                    negative_prompt: "ugly, blurry, low quality, distorted, deformed",
                    steps: 30,
                    cfg_scale: 7.5,
                    width: 512,
                    height: 512,
                    sampler_name: "DPM++ 2M Karras",
                    enable_hr: false,
                    denoising_strength: 0.7,
                    batch_size: 1
                }
            }
        }
    },
    twitter: {
        apiKey: process.env.TWITTER_API_KEY,
        apiKeySecret: process.env.TWITTER_API_KEY_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
    solana: {
        rpcUrl: process.env.RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=e4e7f06a-1e90-4628-8b07-d4f3c30fc5c9',
        network: 'mainnet-beta',
        nftStorage: {
            bundlrAddress: 'https://node1.bundlr.network',
            providerUrl: 'https://mainnet.helius-rpc.com/?api-key=e4e7f06a-1e90-4628-8b07-d4f3c30fc5c9'
        }
    },
    bot: {
        interval: 900000, // 15 minutes
        tweetInterval: 3600000, // 1 hour
        imageGenerationEnabled: true,
        capabilities: {
            vision: true,
            code: true,
            smartContracts: true,
            dataStorage: true
        }
    },
    outputDir: join(__dirname, 'output')
};

if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
}

// Create images directory if it doesn't exist
const imagesDir = join(config.outputDir, 'generated-images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}
