import { imageProcessor } from './utils/image-processor.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testStableDiffusion() {
    try {
        console.log('Testing Stable Diffusion integration...');
        
        // Test with a simple prompt
        const prompt = "a beautiful sunset over a cyberpunk city";
        console.log(`Generating image with prompt: "${prompt}"`);
        
        // Generate the image
        const imageBuffer = await imageProcessor.generateArt('cyberpunk', prompt);
        
        // Save the test image
        const filename = `test_${Date.now()}.png`;
        const savedPath = await imageProcessor.saveImage(imageBuffer, filename);
        
        console.log(`Successfully generated and saved image to: ${savedPath}`);
    } catch (error) {
        console.error('Error testing Stable Diffusion:', error);
    }
}

// Run the test
testStableDiffusion();
