import fs from "fs/promises";
import fetch from "node-fetch";
import path from "path";
import Replicate from "replicate";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageGenerationService {
    constructor() {
        this.replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
            userAgent: 'cheshire-terminal'
        });
        this.model = 'black-forest-labs/flux-1.1-pro-ultra:352185dbc99e9dd708b78b4e6870e3ca49d00dc6451a32fc6dd57968194fae5a';
    }

    async generateImage(options = {}) {
        try {
            console.log('Starting image generation with Replicate...');
            
            // Ensure prompt is not empty
            if (!options.prompt) {
                throw new Error('Prompt is required for image generation');
            }

            const input = {
                raw: false,
                prompt: options.prompt,
                aspect_ratio: options.aspectRatio || "1:1",
                output_format: "png",
                safety_tolerance: 2,
                image_prompt_strength: 0.1,
                seed: Math.floor(Math.random() * 1000000)
            };

            console.log('Using model:', this.model);
            console.log('With input:', input);

            // Generate image URL
            const imageUrl = await this.replicate.run(this.model, { input });

            if (!imageUrl) {
                throw new Error('No output received from Replicate');
            }

            // Download and save the image
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
            }

            // Create output directory if it doesn't exist
            const outputDir = path.join(__dirname, '..', 'generated', 'images');
            await fs.mkdir(outputDir, { recursive: true });

            // Generate unique filename
            const filename = `generated_${Date.now()}.png`;
            const outputPath = path.join(outputDir, filename);

            // Save the image
            const buffer = await response.arrayBuffer();
            await fs.writeFile(outputPath, Buffer.from(buffer));

            console.log('Image generated successfully:', outputPath);

            return {
                success: true,
                imageUrl: `/generated/images/${filename}`,
                metadata: {
                    prompt: options.prompt,
                    aspectRatio: options.aspectRatio || "1:1",
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            console.error('Image generation error:', error);
            throw new Error(`Failed to generate image: ${error.message}`);
        }
    }

    async generateBatch(prompts, options = {}) {
        const results = [];
        for (const prompt of prompts) {
            try {
                const result = await this.generateImage({ ...options, prompt });
                results.push(result);
            } catch (error) {
                console.error(`Failed to generate image for prompt "${prompt}":`, error);
                results.push({
                    success: false,
                    prompt,
                    error: error.message
                });
            }
        }
        return results;
    }
}

export default new ImageGenerationService();
