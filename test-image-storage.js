import { artGenerator } from './ai-art-generator.js';
import { imageProcessor } from './utils/image-processor.js';
import { logger } from './utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

// Use a sample image for testing
async function getSampleImage() {
    try {
        // Create a simple test image using Sharp
        const { default: sharp } = await import('sharp');
        return await sharp({
            create: {
                width: 512,
                height: 512,
                channels: 4,
                background: { r: 0, g: 100, b: 200, alpha: 1 }
            }
        })
        .png()
        .toBuffer();
    } catch (error) {
        logger.error('Failed to create sample image', error);
        throw error;
    }
}

async function testImageStorage() {
    try {
        logger.info('Starting image storage test');

        // Generate art prompt
        const artPrompt = artGenerator.generateArtPrompt();
        logger.info('Generated art prompt', { prompt: artPrompt.prompt });

        // Get sample image instead of generating one
        const imageBuffer = await getSampleImage();
        logger.info('Created sample image', { size: imageBuffer.length });

        // Process the image
        const processedBuffer = await imageProcessor.processImage(imageBuffer);
        
        // Save to Cloudinary
        const imageResult = {
            buffer: processedBuffer,
            cloudinary: await imageProcessor.saveImage(processedBuffer, 'test-image.png')
        };
        
        logger.info('Saved image', { 
            cloudinaryUrl: imageResult.cloudinary.cloudinary.url,
            size: imageResult.buffer.length
        });

        // Generate and upload metadata
        const metadata = await artGenerator.generateMetadata(artPrompt, imageResult);
        logger.info('Generated and uploaded metadata', {
            name: metadata.name,
            ipfsUrl: metadata.ipfs.url
        });

        return {
            prompt: artPrompt,
            image: imageResult,
            metadata: metadata
        };
    } catch (error) {
        logger.error('Test failed', error);
        throw error;
    }
}

// Run the test
testImageStorage()
    .then(result => {
        logger.info('Test completed successfully', {
            imageUrl: result.image.cloudinary.cloudinary.url,
            metadataUrl: result.metadata.ipfs.url
        });
        process.exit(0);
    })
    .catch(error => {
        logger.error('Test failed', error);
        process.exit(1);
    });
