import { nftMinter } from './utils/nft-minter.js';
import { logger } from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyImage(imagePath) {
    try {
        await fs.access(imagePath);
        const stats = await fs.stat(imagePath);
        logger.info('Image file verified', {
            path: imagePath,
            size: stats.size,
            lastModified: stats.mtime
        });
        return true;
    } catch (error) {
        logger.error('Image file verification failed', {
            path: imagePath,
            error: error.message
        });
        return false;
    }
}

async function testNFTMint() {
    try {
        logger.info('Starting NFT minting test');

        const imagePath = path.join(__dirname, 'generated', 'images', 'collection.png');
        
        // Verify image exists
        const imageExists = await verifyImage(imagePath);
        if (!imageExists) {
            throw new Error('Image file not found or inaccessible');
        }

        // Mint the NFT
        const result = await nftMinter.mintNFT(
            imagePath,
            'AI Generated Collection #1',
            'A unique AI-generated artwork minted as an NFT on Solana',
            [
                {
                    trait_type: 'Artist',
                    value: 'AI Autonomous Agent'
                },
                {
                    trait_type: 'Generation',
                    value: 'Original'
                },
                {
                    trait_type: 'Collection',
                    value: 'AI Art Collection'
                },
                {
                    trait_type: 'Creation Date',
                    value: new Date().toISOString().split('T')[0]
                }
            ]
        );

        logger.info('NFT minted successfully', {
            mintAddress: result.mint,
            name: result.name,
            imageUrl: result.imageUrl,
            metadataUrl: result.metadataUrl
        });

        // Log Solana Explorer URLs
        const explorerUrl = `https://explorer.solana.com/address/${result.mint}?cluster=devnet`;
        const tokenUrl = `https://explorer.solana.com/token/${result.mint}?cluster=devnet`;
        
        logger.info('View on Solana Explorer', { 
            address: explorerUrl,
            token: tokenUrl
        });

        return result;
    } catch (error) {
        logger.error('NFT minting test failed', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Run the test
testNFTMint()
    .then(result => {
        logger.info('Test completed successfully', {
            mint: result.mint,
            explorer: `https://explorer.solana.com/address/${result.mint}?cluster=devnet`,
            token: `https://explorer.solana.com/token/${result.mint}?cluster=devnet`
        });
        process.exit(0);
    })
    .catch(error => {
        logger.error('Test failed', {
            message: error.message,
            stack: error.stack
        });
        process.exit(1);
    });
