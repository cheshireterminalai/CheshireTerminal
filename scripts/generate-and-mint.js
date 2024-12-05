import dotenv from "dotenv";
import path from "path";

import { aiService } from "../services/ai-service.js";
import { logger } from "../utils/logger.js";
import { nftMinter } from "../utils/nft-minter.js";

// Load environment variables from the existing .env file
dotenv.config({ path: path.join(process.cwd(), 'cheshireterminal', '.env') });

async function generateAndMintNFT(userPrompt) {
    try {
        logger.info('Starting NFT generation process', { prompt: userPrompt });

        // Step 1: Generate image using AI service
        const generationResult = await aiService.generateImage(userPrompt);
        logger.info('Image generated successfully', { 
            path: generationResult.path,
            enhancedPrompt: generationResult.enhancedPrompt 
        });

        // Step 2: Get a creative description from LLaMA
        const description = await aiService.generateCheshireResponse(
            `Create a creative and whimsical description for an NFT with the prompt: ${generationResult.enhancedPrompt}`
        );

        // Step 3: Generate attributes using LLaMA
        const attributesResponse = await aiService.generateCheshireResponse(
            `Generate 3-5 unique attributes for an NFT based on this image prompt: ${generationResult.enhancedPrompt}. 
             Format them as JSON array like this: [{"trait_type": "Background", "value": "Mystical Forest"}, ...]`
        );
        
        // Parse attributes from the response
        const attributesMatch = attributesResponse.match(/\[.*\]/s);
        const attributes = attributesMatch ? JSON.parse(attributesMatch[0]) : [];

        // Step 4: Mint NFT
        const nftResult = await nftMinter.mintNFT(
            generationResult.path,
            `Cheshire Art: ${generationResult.enhancedPrompt.slice(0, 30)}...`,
            description,
            attributes
        );

        logger.info('NFT minted successfully', { 
            mintAddress: nftResult.mint,
            imageUrl: nftResult.imageUrl
        });

        return {
            success: true,
            ...nftResult,
            originalPrompt: userPrompt,
            enhancedPrompt: generationResult.enhancedPrompt,
            description,
            attributes
        };

    } catch (error) {
        logger.error('Failed to generate and mint NFT', error);
        throw error;
    }
}

// Get prompt from command line or use default
const prompt = process.argv[2] || "a mystical cheshire cat in wonderland";

// Generate and mint NFT
generateAndMintNFT(prompt)
    .then(result => {
        console.log('NFT Generated and Minted Successfully!');
        console.log('Mint Address:', result.mint);
        console.log('Explorer URL:', result.explorerUrl);
        console.log('Image URL:', result.imageUrl);
        console.log('Enhanced Prompt:', result.enhancedPrompt);
        console.log('Description:', result.description);
        console.log('Attributes:', result.attributes);
    })
    .catch(error => {
        console.error('Error:', error.message);
        process.exit(1);
    });
