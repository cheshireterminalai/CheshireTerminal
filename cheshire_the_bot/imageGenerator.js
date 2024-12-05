import { config } from './config.js';
import fs from 'fs';
import path from 'path';

class ImageGenerator {
    constructor() {
        this.outputDir = path.join(config.outputDir, 'generated-images');
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async generateImage(type = 'blockchain') {
        try {
            const prompt = this.generatePhilosophicalPrompt(type);
            console.log('Generating image with prompt:', prompt);

            const formattedPrompt = prompt.replace(/\s+/g, ' ').trim();

            const response = await fetch(`${config.llm.baseUrl}/images/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: formattedPrompt,
                    model: config.llm.imageModel.name,
                    ...config.llm.imageModel.defaultParams
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Response:', errorText);
                throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
            }

            const imageBuffer = await response.arrayBuffer();
            
            if (imageBuffer.byteLength < 10240) {
                console.error('Generated image is too small:', imageBuffer.byteLength, 'bytes');
                throw new Error('Generated image is invalid or corrupted');
            }

            const header = new Uint8Array(imageBuffer.slice(0, 8));
            const isPNG = header[0] === 0x89 && 
                         header[1] === 0x50 && // P
                         header[2] === 0x4E && // N
                         header[3] === 0x47 && // G
                         header[4] === 0x0D && // CR
                         header[5] === 0x0A && // LF
                         header[6] === 0x1A && // EOF
                         header[7] === 0x0A;   // LF

            if (!isPNG) {
                console.error('Generated file is not a valid PNG');
                throw new Error('Generated image is not a valid PNG file');
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `image-${timestamp}.png`;
            const filepath = path.join(this.outputDir, filename);

            fs.writeFileSync(filepath, Buffer.from(imageBuffer));
            console.log('Image saved to:', filepath);
            console.log('Image size:', imageBuffer.byteLength, 'bytes');

            return {
                filepath,
                prompt: formattedPrompt,
                timestamp,
                size: imageBuffer.byteLength
            };
        } catch (error) {
            console.error('Error generating image:', error);
            return null;
        }
    }

    generatePhilosophicalPrompt(type) {
        const concepts = {
            blockchain: [
                'digital neural network visualization',
                'cryptographic patterns in nature',
                'blockchain architecture visualization',
                'decentralized network topology',
                'privacy-focused technology concept'
            ],
            ai: [
                'artificial consciousness visualization',
                'neural network architecture',
                'quantum computing visualization',
                'digital brain synapses',
                'AI evolution concept'
            ],
            future: [
                'futuristic blockchain city',
                'decentralized utopia',
                'cybernetic evolution',
                'digital transformation concept',
                'technological singularity visualization'
            ],
            privacy: [
                'encrypted data streams',
                'privacy shield concept',
                'digital anonymity visualization',
                'secure blockchain vault',
                'cryptographic protection field'
            ]
        };

        const styles = [
            'philosophical concept art',
            'digital surrealism',
            'technological abstraction',
            'futuristic minimalism',
            'cyber-ethereal style'
        ];

        const modifiers = [
            'intricate detail',
            'volumetric lighting',
            'deep symbolism',
            'philosophical undertones',
            'technological aesthetic'
        ];

        const concept = concepts[type] ? 
            concepts[type][Math.floor(Math.random() * concepts[type].length)] :
            concepts.blockchain[Math.floor(Math.random() * concepts.blockchain.length)];
        
        const style = styles[Math.floor(Math.random() * styles.length)];
        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];

        return `${concept}, ${style}, ${modifier}, 4k, professional quality, trending on artstation`;
    }

    async generateTwitterImage(tweetContent) {
        let imageType = 'blockchain';
        if (tweetContent.toLowerCase().includes('privacy')) {
            imageType = 'privacy';
        } else if (tweetContent.toLowerCase().includes('ai')) {
            imageType = 'ai';
        } else if (tweetContent.toLowerCase().includes('future')) {
            imageType = 'future';
        }

        const result = await this.generateImage(imageType);
        
        if (!result || !result.filepath || !fs.existsSync(result.filepath)) {
            console.log('Image generation failed or produced invalid image');
            return null;
        }
        
        return result;
    }
}

export const imageGenerator = new ImageGenerator();
