// Configuration for the autonomous NFT generator
export const config = {
    // AI Configuration
    ai: {
        server: 'http://localhost:11439',
        model: 'qwen2.5-coder-3b-instruct',
        temperature: 0.8,
        maxTokens: -1
    },

    // Solana Configuration
    solana: {
        rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=ede1c44e-9fd5-46e0-a7aa-35b8a84c245f',
        wsUrl: 'wss://mainnet.helius-rpc.com/?api-key=ede1c44e-9fd5-46e0-a7aa-35b8a84c245f',
        // Note: In production, load these from environment variables
        wallet: {
            // Add your private key here as a Uint8Array
            privateKey: [],
            // This will be derived from the private key
            publicKey: ''
        }
    },

    // NFT Generation Settings
    nft: {
        // Base attributes for all generated NFTs
        baseAttributes: {
            creator: 'AI Autonomous Agent',
            collection: 'Autonomous Creations',
            sellerFeeBasisPoints: 500 // 5% royalty
        },
        
        // Image generation settings
        image: {
            width: 1024,
            height: 1024,
            format: 'png'
        }
    },

    // Storage Configuration
    storage: {
        // Local storage paths
        local: {
            outputDir: 'generated',
            imagesDir: 'generated/images',
            metadataDir: 'generated/metadata'
        },
        
        // Cloudinary configuration
        cloudinary: {
            cloud_name: 'do5z0jxol',
            api_key: '857259462313331',
            api_secret: '_iefbiaKFvWvXWZP2cZ_xetJLy8'
        },

        // IPFS configuration
        ipfs: {
            endpoint: 'https://cheshire.quicknode-ipfs.com/ipfs'
        },
        
        // Arweave configuration
        arweave: {
            host: 'https://node1.bundlr.network',
            timeout: 60000
        }
    },

    // Debug Configuration
    debug: {
        enabled: true,
        logLevel: 'debug', // 'debug', 'info', 'warn', 'error'
        saveLogsToFile: true,
        logFile: 'generated/logs/generation.log'
    }
};

// Helper function to update wallet configuration
export function updateWalletConfig(privateKey, publicKey) {
    config.solana.wallet.privateKey = privateKey;
    config.solana.wallet.publicKey = publicKey;
}

// Helper function to validate configuration
export function validateConfig() {
    const required = [
        'ai.server',
        'ai.model',
        'solana.rpcUrl',
        'solana.wsUrl',
        'storage.cloudinary.cloud_name',
        'storage.cloudinary.api_key',
        'storage.cloudinary.api_secret',
        'storage.ipfs.endpoint'
    ];

    const missing = required.filter(path => {
        const parts = path.split('.');
        let current = config;
        for (const part of parts) {
            if (current[part] === undefined) return true;
            current = current[part];
        }
        return false;
    });

    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    return true;
}
