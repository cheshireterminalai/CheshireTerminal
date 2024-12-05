import bs58 from "bs58";
import dotenv from "dotenv";

import {
    keypairIdentity,
    Metaplex,
} from "@metaplex-foundation/js";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import { logger } from "./logger.js";
import { storageManager } from "./storage-manager.js";

// Load environment variables
dotenv.config();

class NFTMinter {
    constructor() {
        // Initialize Solana connection using Helius RPC
        const rpcUrl = process.env.SOLANA_RPC_URL;
        
        // Configure connection with headers
        const connectionConfig = {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
            httpHeaders: {
                'Content-Type': 'application/json',
            },
            wsEndpoint: rpcUrl.replace('https://', 'wss://'),
        };
        
        this.connection = new Connection(rpcUrl, connectionConfig);
        
        // Initialize wallet from private key
        try {
            const privateKey = process.env.SOLANA_WALLET_PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('SOLANA_WALLET_PRIVATE_KEY is not set in environment variables');
            }
            
            // Decode the base58 private key
            const secretKey = bs58.decode(privateKey);
            this.wallet = Keypair.fromSecretKey(secretKey);
            
            // Verify the public key matches what we expect
            const expectedPublicKey = process.env.SOLANA_IDENTITY;
            if (expectedPublicKey && this.wallet.publicKey.toString() !== expectedPublicKey) {
                throw new Error('Generated public key does not match SOLANA_IDENTITY');
            }
        } catch (error) {
            logger.error('Failed to initialize wallet:', error);
            throw new Error('Failed to initialize wallet: ' + error.message);
        }
        
        // Initialize Metaplex with identity
        this.metaplex = new Metaplex(this.connection);
        this.metaplex.use(keypairIdentity(this.wallet));

        // Log initialization
        logger.info('NFT Minter initialized', {
            network: 'mainnet',
            wallet: this.wallet.publicKey.toString(),
            rpcUrl: rpcUrl.split('?')[0] // Log URL without API key
        });
    }

    async checkWalletBalance() {
        try {
            const balance = await this.connection.getBalance(this.wallet.publicKey);
            const solBalance = balance / LAMPORTS_PER_SOL;
            
            if (solBalance < 0.1) { // Minimum balance threshold
                throw new Error(`Insufficient balance: ${solBalance} SOL. Please fund your wallet with at least 0.1 SOL`);
            }
            
            logger.info('Wallet balance checked', { balance: solBalance });
            return solBalance;
        } catch (error) {
            logger.error('Failed to check wallet balance:', error);
            throw error;
        }
    }

    async createMetadata(name, description, imageUrl, attributes = []) {
        return {
            name,
            symbol: process.env.COLLECTION_SYMBOL || 'CHNFT',
            description,
            image: imageUrl,
            external_url: 'https://cheshireterminal.com',
            attributes,
            properties: {
                files: [
                    {
                        uri: imageUrl,
                        type: 'image/png'
                    }
                ],
                category: 'image',
                creators: [
                    {
                        address: this.wallet.publicKey.toString(),
                        share: 100
                    }
                ]
            }
        };
    }

    async mintNFT(imageData, name, description, attributes = []) {
        try {
            // Check wallet balance first
            await this.checkWalletBalance();
            
            logger.info('Starting NFT minting process', { name });

            // Upload image to Cloudinary
            const imageResult = await storageManager.uploadToCloudinary(imageData);
            logger.info('Image uploaded', { url: imageResult.url });

            // Create metadata
            const metadata = await this.createMetadata(
                name,
                description,
                imageResult.url,
                attributes
            );

            // Upload metadata to Cloudinary as JSON
            const metadataResult = await storageManager.uploadToCloudinary(
                Buffer.from(JSON.stringify(metadata)),
                {
                    resource_type: 'raw',
                    public_id: `metadata_${Date.now()}`,
                    format: 'json'
                }
            );

            // Mint NFT
            logger.info('Minting NFT...');
            const { nft } = await this.metaplex.nfts().create({
                uri: metadataResult.url,
                name: metadata.name,
                sellerFeeBasisPoints: 500, // 5% royalty
                symbol: metadata.symbol,
                creators: [{
                    address: this.wallet.publicKey,
                    share: 100,
                }],
                maxSupply: null,
            });

            logger.info('NFT minted successfully', {
                mintAddress: nft.address.toString(),
                name: nft.name,
                uri: nft.uri
            });

            return {
                success: true,
                mint: nft.address.toString(),
                name: nft.name,
                uri: nft.uri,
                imageUrl: imageResult.url,
                metadataUrl: metadataResult.url,
                explorerUrl: `https://explorer.solana.com/address/${nft.address.toString()}`
            };
        } catch (error) {
            logger.error('Failed to mint NFT', error);
            throw error;
        }
    }

    async getBalance() {
        return this.checkWalletBalance();
    }
}

export const nftMinter = new NFTMinter();
