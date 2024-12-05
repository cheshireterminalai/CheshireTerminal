import { config } from "dotenv";
import fs from "fs/promises";
import fetch from "node-fetch";
import path from "path";
import Replicate from "replicate";

// Load environment variables
config({ path: path.join(process.cwd(), '.env') });

class NFTGenerationClient {
    constructor() {
        this.replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });
    }

    createMetadata(params) {
        const {
            name,
            description,
            image,
            animationUrl,
            externalUrl,
            attributes = [],
            properties = {}
        } = params;

        return {
            name,
            description,
            image,
            animation_url: animationUrl,
            external_url: externalUrl,
            attributes: attributes.map(attr => ({
                trait_type: attr.trait_type,
                value: attr.value
            })),
            properties: {
                files: [
                    {
                        uri: image,
                        type: 'image/png',
                        cdn: false
                    },
                    ...(animationUrl ? [{
                        uri: animationUrl,
                        type: 'video/mp4',
                        cdn: false
                    }] : []),
                    ...(properties.files || [])
                ],
                category: properties.category || 'image',
                ...properties
            }
        };
    }

    async startGeneration(options = {}) {
        try {
            console.log('Starting image generation with Replicate...');
            
            // Ensure prompt is not empty
            if (!options.prompt) {
                throw new Error('Prompt is required for image generation');
            }

            const output = await this.replicate.run(
                "black-forest-labs/flux-1.1-pro-ultra:352185dbc99e9dd708b78b4e6870e3ca49d00dc6451a32fc6dd57968194fae5a",
                {
                    input: {
                        prompt: options.prompt,
                        aspect_ratio: "1:1",
                        output_format: "png",
                        safety_tolerance: 2,
                        image_prompt_strength: 0.1,
                        seed: Math.floor(Math.random() * 1000000)
                    }
                }
            );

            if (!output) {
                throw new Error('No output received from Replicate');
            }

            // Download and save the image
            const imageUrl = output;
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }

            // Create output directory if it doesn't exist
            const outputDir = path.join(process.cwd(), 'generated', 'images');
            await fs.mkdir(outputDir, { recursive: true });

            // Generate unique filename
            const filename = `generated_${Date.now()}.png`;
            const outputPath = path.join(outputDir, filename);

            // Save the image
            const buffer = await response.arrayBuffer();
            await fs.writeFile(outputPath, Buffer.from(buffer));

            console.log('\n🖼️  Image generated successfully:', outputPath);
            console.log('📁 Output directory:', outputDir, '\n');

            return {
                success: true,
                imageUrl: outputPath,
                metadata: {
                    name: options.name || 'AI Generated NFT',
                    symbol: options.symbol || 'AIGEN',
                    description: options.description || 'AI Generated NFT Collection',
                    prompt: options.prompt,
                    style: options.style,
                    attributes: options.attributes || []
                }
            };
        } catch (error) {
            console.error('Generation error:', error);
            throw new Error(`Failed to generate image: ${error.message}`);
        }
    }

    async saveNFT(mintAddress, ownerAddress, metadata) {
        return {
            mintAddress,
            ownerAddress,
            metadata: this.createMetadata(metadata),
            status: 'saved'
        };
    }

    async getNFTMetadata(index) {
        return {
            index,
            status: 'placeholder'
        };
    }

    async getNFTByMintAddress(mintAddress) {
        return {
            mintAddress,
            status: 'placeholder'
        };
    }
}

export default NFTGenerationClient;
