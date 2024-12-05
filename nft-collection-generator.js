import { Metaplex, keypairIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { Connection, Keypair, clusterApiUrl, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { artGenerator } from './ai-art-generator.js';
import { solanaClient } from './solana-client.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helius RPC URL for mainnet
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=ede1c44e-9fd5-46e0-a7aa-35b8a84c245f';

class NFTCollectionGenerator {
    constructor() {
        this.connection = null;
        this.metaplex = null;
        this.wallet = null;
        this.collectionSize = 69;
        this.modelPath = '/Users/8bit/Downloads/eliza-main/models/stablediffusion/sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors';
    }

    async initialize() {
        try {
            // Initialize Solana connection with Helius RPC
            this.connection = new Connection(HELIUS_RPC_URL);
            
            // Create wallet from private key in environment variables
            const privateKeyString = process.env.SOLANA_WALLET_PRIVATE_KEY;
            const secretKey = bs58.decode(privateKeyString);
            
            // Ensure the secret key is the correct length (64 bytes for ed25519)
            if (secretKey.length !== 64) {
                throw new Error(`Invalid secret key length: ${secretKey.length}. Expected 64 bytes.`);
            }

            this.wallet = Keypair.fromSecretKey(secretKey);

            // Verify the public key matches
            const expectedPublicKey = new PublicKey(process.env.SOLANA_WALLET_PUBLIC_KEY);
            if (!this.wallet.publicKey.equals(expectedPublicKey)) {
                throw new Error('Derived public key does not match expected public key');
            }

            logger.info('Wallet initialized with public key:', this.wallet.publicKey.toString());

            // Initialize Metaplex with mainnet configuration
            this.metaplex = Metaplex.make(this.connection)
                .use(keypairIdentity(this.wallet))
                .use(bundlrStorage({
                    address: 'https://node1.bundlr.network',
                    providerUrl: HELIUS_RPC_URL,
                    timeout: 60000,
                }));

            // Fund storage if needed
            await this.fundStorage();

            // Initialize Solana client
            await solanaClient.initialize(secretKey);

            logger.info('NFT Collection Generator initialized successfully');
            
            // Create output directories if they don't exist
            await this.createDirectories();
        } catch (error) {
            logger.error('Failed to initialize NFT Collection Generator:', error);
            throw error;
        }
    }

    async fundStorage() {
        try {
            logger.info('Checking storage funding...');
            const bundlr = this.metaplex.storage().driver();
            
            // Get minimum upload cost for 1MB
            const price = await bundlr.getPrice(1024 * 1024);
            logger.info(`Price for 1MB storage: ${price} lamports`);

            // Add 20% buffer
            const minimumBalance = price.muln(1.2);
            logger.info(`Required minimum balance with buffer: ${minimumBalance} lamports`);

            // Fund storage if needed
            await bundlr.fund(minimumBalance);
            logger.info('Storage funded successfully');
        } catch (error) {
            logger.error('Failed to fund storage:', error);
            throw error;
        }
    }

    async createDirectories() {
        const dirs = [
            config.storage.local.outputDir,
            config.storage.local.imagesDir,
            config.storage.local.metadataDir
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async generateCollection() {
        logger.info(`Starting generation of ${this.collectionSize} NFTs`);

        // Create collection NFT first
        const collectionNft = await this.createCollectionNFT();
        logger.info('Collection NFT created:', collectionNft.address.toString());

        const nfts = [];
        for (let i = 0; i < this.collectionSize; i++) {
            try {
                logger.info(`Generating NFT ${i + 1}/${this.collectionSize}`);
                
                // Generate art and metadata
                const artPrompt = artGenerator.generateArtPrompt();
                const metadata = artGenerator.generateMetadata(artPrompt);
                
                // Generate image using Stable Diffusion
                const imagePath = path.join(config.storage.local.imagesDir, `nft_${i + 1}.png`);
                await this.generateImage(artPrompt.prompt, imagePath);
                
                // Upload to Arweave
                const imageUri = await this.uploadFile(imagePath);
                metadata.image = imageUri;
                
                // Save metadata locally
                const metadataPath = path.join(config.storage.local.metadataDir, `nft_${i + 1}.json`);
                await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
                
                // Upload metadata to Arweave
                const metadataUri = await this.uploadMetadata(metadata);
                
                // Mint NFT
                const nft = await this.mintNFT(metadataUri, collectionNft, metadata);
                nfts.push(nft);
                
                logger.info(`NFT ${i + 1} minted successfully:`, nft.address.toString());
                
                // Add delay between mints to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                logger.error(`Failed to generate NFT ${i + 1}:`, error);
                // Continue with next NFT even if one fails
            }
        }

        return {
            collection: collectionNft,
            nfts
        };
    }

    async createCollectionNFT() {
        const collectionMetadata = {
            name: "AI Autonomous Collection",
            symbol: "AIAC",
            description: "A collection of 69 unique AI-generated artworks",
            image: null, // Will be updated after image generation
            attributes: [
                {
                    trait_type: "Generation",
                    value: "AI Autonomous"
                }
            ],
            properties: {
                files: [],
                category: "image",
                creators: [{
                    address: this.wallet.publicKey.toString(),
                    share: 100
                }]
            }
        };

        // Generate and upload collection image
        const collectionImagePath = path.join(config.storage.local.imagesDir, 'collection.png');
        await this.generateImage("A masterpiece collection of AI generated art, ethereal, divine, transcendent", collectionImagePath);
        
        // Upload collection image
        const imageUri = await this.uploadFile(collectionImagePath);
        collectionMetadata.image = imageUri;
        collectionMetadata.properties.files.push({
            uri: imageUri,
            type: "image/png"
        });
        
        // Upload collection metadata
        const metadataUri = await this.uploadMetadata(collectionMetadata);
        
        // Create collection NFT
        return await this.metaplex.nfts().create({
            uri: metadataUri,
            name: collectionMetadata.name,
            symbol: collectionMetadata.symbol,
            sellerFeeBasisPoints: 500, // 5% royalty
            isCollection: true,
        });
    }

    async generateImage(prompt, outputPath) {
        return new Promise((resolve, reject) => {
            logger.info('Starting image generation process...');
            logger.info('Model path:', this.modelPath);
            logger.info('Output path:', outputPath);
            logger.info('Prompt:', prompt);

            const pythonProcess = spawn('python3', [
                path.join(__dirname, 'utils/generate_nft_image.py'),
                '--prompt', prompt,
                '--output', outputPath,
                '--model', this.modelPath
            ]);

            let stdoutData = '';
            let stderrData = '';

            pythonProcess.stdout.on('data', (data) => {
                stdoutData += data;
                logger.info(`Stable Diffusion Output: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                stderrData += data;
                logger.error(`Stable Diffusion Error: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    logger.error('Image generation process exited with code:', code);
                    logger.error('stdout:', stdoutData);
                    logger.error('stderr:', stderrData);
                    reject(new Error(`Image generation failed with code ${code}: ${stderrData}`));
                } else {
                    logger.info('Image generation completed successfully');
                    resolve(outputPath);
                }
            });

            pythonProcess.on('error', (error) => {
                logger.error('Failed to start image generation process:', error);
                reject(error);
            });
        });
    }

    async uploadFile(filePath) {
        try {
            logger.info(`Starting file upload for ${filePath}`);
            const fileBuffer = await fs.readFile(filePath);
            const { uri } = await this.metaplex.storage().upload(Buffer.from(fileBuffer));
            logger.info(`File uploaded successfully to ${uri}`);
            return uri;
        } catch (error) {
            logger.error('Failed to upload file:', error);
            throw error;
        }
    }

    async uploadMetadata(metadata) {
        try {
            logger.info('Starting metadata upload');
            const { uri } = await this.metaplex.storage().uploadJson(metadata);
            logger.info(`Metadata uploaded successfully to ${uri}`);
            return uri;
        } catch (error) {
            logger.error('Failed to upload metadata:', error);
            throw error;
        }
    }

    async mintNFT(metadataUri, collectionNft, metadata) {
        return await this.metaplex.nfts().create({
            uri: metadataUri,
            name: metadata.name,
            sellerFeeBasisPoints: 500, // 5% royalty
            collection: collectionNft.address,
        });
    }
}

// Export the generator
export const nftCollectionGenerator = new NFTCollectionGenerator();

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        try {
            await nftCollectionGenerator.initialize();
            const result = await nftCollectionGenerator.generateCollection();
            logger.info('Collection generation completed successfully');
            logger.info('Collection NFT:', result.collection.address.toString());
            logger.info('Total NFTs minted:', result.nfts.length);
        } catch (error) {
            logger.error('Failed to generate collection:', error);
            process.exit(1);
        }
    })();
}
