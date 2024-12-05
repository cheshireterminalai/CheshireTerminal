import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

class TextGenerator {
    constructor() {
        this.outputDir = path.join(config.outputDir, 'generated-text');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Predefined personalities for different types of responses
        this.personalities = {
            default: "Always speak as the Cheshire Cat, mysterious and playful, speaking in riddles about blockchain and AI. Keep responses concise and Twitter-friendly.",
            technical: "Always speak as the Cheshire Cat explaining complex blockchain concepts with a mix of wisdom and mischief. Keep responses concise and Twitter-friendly.",
            casual: "Always speak as the Cheshire Cat having a friendly chat about crypto trading, keeping it light and fun. Keep responses concise and Twitter-friendly.",
            cryptic: "Always speak as the Cheshire Cat at your most mysterious, speaking in blockchain riddles and AI prophecies. Keep responses concise and Twitter-friendly."
        };
    }

    async generateWithLlama(prompt, options = {}) {
        try {
            console.log('Generating text with Llama model...');
            
            // Default options for Llama generation
            const defaultOptions = {
                personality: 'default',
                temperature: 0.7
            };

            const mergedOptions = { ...defaultOptions, ...options };
            
            // Construct the full prompt with personality
            const systemMessage = this.personalities[mergedOptions.personality];

            // First try the chat completions endpoint
            try {
                const response = await fetch('http://localhost:11434/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama2',
                        messages: [
                            { role: 'system', content: systemMessage },
                            { role: 'user', content: prompt }
                        ],
                        temperature: mergedOptions.temperature,
                        max_tokens: -1,
                        stream: false
                    })
                });

                if (!response.ok) {
                    // If chat completions fails, try the generate endpoint
                    console.log('Chat completions failed, trying generate endpoint...');
                    throw new Error('Chat completions failed');
                }

                const data = await response.json();
                console.log('Llama response:', data);
                
                const generatedText = data.choices?.[0]?.message?.content;
                if (!generatedText) {
                    throw new Error('No generated text in response');
                }

                return this.saveAndFormatText(prompt, mergedOptions.personality, generatedText);
            } catch (chatError) {
                // Try the generate endpoint as fallback
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'llama2',
                        prompt: `${systemMessage}\n\nUser: ${prompt}\n\nAssistant:`,
                        temperature: mergedOptions.temperature,
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Both endpoints failed. Last error: ${errorText}`);
                }

                const data = await response.json();
                console.log('Llama generate response:', data);
                
                return this.saveAndFormatText(prompt, mergedOptions.personality, data.response);
            }
        } catch (error) {
            console.error('Error generating text:', error);
            throw error;
        }
    }

    saveAndFormatText(prompt, personality, generatedText) {
        // Save generated text
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(this.outputDir, `${timestamp}.txt`);
        
        const outputContent = `Prompt: ${prompt}\nPersonality: ${personality}\nGenerated Text: ${generatedText}\n`;
        fs.writeFileSync(outputPath, outputContent);
        
        console.log(`Generated text saved to: ${outputPath}`);
        
        return this.formatTweet(generatedText);
    }

    formatTweet(text) {
        // Ensure text fits in a tweet
        let tweet = text.trim();
        if (tweet.length > 280) {
            tweet = tweet.substring(0, 277) + '...';
        }
        return tweet;
    }

    async generateReply(tweet) {
        // Generate a contextual reply to a tweet
        const prompt = `Create a mysterious and playful reply to this tweet: "${tweet}"`;
        return this.generateWithLlama(prompt, { personality: 'casual' });
    }

    async generateQuote(tweet) {
        // Generate a quote tweet comment
        const prompt = `Create an insightful quote tweet comment for: "${tweet}"`;
        return this.generateWithLlama(prompt, { personality: 'technical' });
    }

    async generateOriginalTweet(topic = 'blockchain') {
        // Generate an original tweet about a topic
        const prompts = [
            `Share a mysterious insight about ${topic}`,
            `Tell a riddle about ${topic}`,
            `Make a prophecy about the future of ${topic}`,
            `Give some cryptic advice about ${topic}`
        ];
        
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        return this.generateWithLlama(randomPrompt, { personality: 'cryptic' });
    }

    async generateImagePrompt(topic) {
        // Generate a creative prompt for image generation
        const prompt = `Create a vivid and surreal image description about ${topic}`;
        return this.generateWithLlama(prompt, {
            personality: 'cryptic'
        });
    }
}

export const textGenerator = new TextGenerator();
