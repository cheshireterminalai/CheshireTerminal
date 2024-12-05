import { nftCollectionGenerator } from './nft-collection-generator.js';
import { logger } from './utils/logger.js';

// Override collection size for testing
nftCollectionGenerator.collectionSize = 1;

async function testNFTGeneration() {
    try {
        logger.info('Starting NFT generator test...');
        
        // Initialize the generator
        await nftCollectionGenerator.initialize();
        logger.info('Generator initialized successfully');
        
        // Generate a single test NFT
        const result = await nftCollectionGenerator.generateCollection();
        
        logger.info('Test NFT generated successfully');
        logger.info('Collection NFT address:', result.collection.address.toString());
        logger.info('NFT address:', result.nfts[0].address.toString());
        
        return result;
    } catch (error) {
        logger.error('Failed to generate test NFT:', error);
        throw error;
    }
}

// Run the test if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    (async () => {
        try {
            await testNFTGeneration();
        } catch (error) {
            logger.error('Test failed:', error);
            process.exit(1);
        }
    })();
}
