import { artGenerator } from '../ai-art-generator.js';
import { solanaClient } from '../solana-client.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../generated');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const METADATA_DIR = path.join(OUTPUT_DIR, 'metadata');

// Ensure output directories exist
async function setupDirectories() {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(METADATA_DIR, { recursive: true });
}

// Save metadata to file
async function saveMetadata(metadata, filename) {
    const filePath = path.join(METADATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2));
    return filePath;
}

// Save image buffer to file
async function saveImage(imageBuffer, filename) {
    const filePath = path.join(IMAGES_DIR, filename);
    await fs.writeFile(filePath, imageBuffer);
    return filePath;
}

// Generate art using AI
async function generateArt(prompt) {
    // This is a placeholder for actual AI art generation
    // In reality, you would integrate with your preferred AI art generation service
    
    // For now, create a simple gradient image as a placeholder
    const width = 1024;
    const height = 1024;
    
    const gradient = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            gradient[i] = Math.floor((x / width) * 255);     // R
            gradient[i + 1] = Math.floor((y / height) * 255); // G
            gradient[i + 2] = 150;                           // B
            gradient[i + 3] = 255;                           // A
        }
    }

    const image = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
    })
    .composite([
        {
            input: gradient,
            raw: {
                width,
                height,
                channels: 4
            }
        }
    ])
    .png()
    .toBuffer();

    return image;
}

// Main generation process
async function generateAndMintNFT() {
    try {
        console.log('Setting up directories...');
        await setupDirectories();

        console.log('Generating art prompt...');
        const artPrompt = artGenerator.generateArtPrompt();
        console.log('Art prompt:', artPrompt);

        console.log('Generating metadata...');
        const metadata = artGenerator.generateMetadata(artPrompt);
        console.log('Metadata:', metadata);

        console.log('Generating art...');
        const imageBuffer = await generateArt(artPrompt.prompt);
        
        // Save files locally
        const timestamp = Date.now();
        const imageFilename = `${timestamp}_${metadata.name.replace(/\s+/g, '_')}.png`;
        const metadataFilename = `${timestamp}_${metadata.name.replace(/\s+/g, '_')}.json`;
        
        console.log('Saving files locally...');
        const imagePath = await saveImage(imageBuffer, imageFilename);
        const metadataPath = await saveMetadata(metadata, metadataFilename);
        
        console.log('Files saved:');
        console.log('Image:', imagePath);
        console.log('Metadata:', metadataPath);

        // Initialize Solana client with private key
        // Note: In production, load this securely from environment variables
        const privateKey = []; // Add your private key here
        await solanaClient.initialize(privateKey);

        console.log('Uploading to Arweave...');
        const imageUrl = await solanaClient.uploadImage(imageBuffer);
        console.log('Image uploaded:', imageUrl);

        console.log('Minting NFT...');
        const mintResult = await solanaClient.mintNFT(metadata, imageUrl);
        console.log('Minting successful:', mintResult);

        // Save mint result
        const mintResultPath = path.join(METADATA_DIR, `${timestamp}_mint_result.json`);
        await fs.writeFile(mintResultPath, JSON.stringify(mintResult, null, 2));

        console.log('Process complete!');
        console.log('Mint address:', mintResult.mint);
        console.log('Transaction successful!');

        return {
            success: true,
            metadata,
            artPrompt,
            mintResult,
            files: {
                image: imagePath,
                metadata: metadataPath,
                mintResult: mintResultPath
            }
        };
    } catch (error) {
        console.error('Error in generation process:', error);
        throw error;
    }
}

// Run the generation process
generateAndMintNFT()
    .then(result => {
        console.log('Generation completed successfully!');
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch(error => {
        console.error('Generation failed:', error);
        process.exit(1);
    });
