import fs from "fs";
import { TwitterApi } from "twitter-api-v2";

import { aiAgent } from "./aiAgent.js";
import { config } from "./config.js";

class TwitterBot {
    constructor() {
        // Use OAuth 1.0a authentication for write access
        this.client = new TwitterApi({
            appKey: config.twitter.apiKey,
            appSecret: config.twitter.apiKeySecret,
            accessToken: config.twitter.accessToken,
            accessSecret: config.twitter.accessTokenSecret,
        });

        // Create read-write client
        this.rwClient = this.client.readWrite;
        
        // Fallback tweets in case LLM is unavailable
        this.predefinedTweets = {
            privacy: [
                "Privacy is not just a feature, it's a fundamental right in the digital age. $GRIN leads this revolution... 🔐✨ #BlockchainPrivacy",
                "In the realm of digital sovereignty, $GRIN illuminates the path to true financial privacy... ⚡🌐 #CryptoPrivacy",
                "When privacy meets scalability, a new paradigm emerges. $GRIN shows the way... 🔐🚀 #BlockchainInnovation"
            ],
            ai: [
                "The convergence of AI and blockchain creates new horizons for privacy. $GRIN at the forefront... 🤖🔐 #AIPrivacy",
                "As AI evolves, privacy becomes paramount. $GRIN bridges this crucial gap... 🧠✨ #AIBlockchain",
                "Smart privacy meets artificial intelligence. $GRIN leading the synthesis... ⚡🤖 #AIEvolution"
            ],
            technical: [
                "MimbleWimble: where privacy meets scalability. $GRIN's elegant solution... 🧠⚡ #BlockchainTech",
                "Cut-through: pruning history while preserving security. $GRIN innovation at work... 🔐✨ #CryptoTech",
                "Dandelion++: network privacy reimagined. $GRIN leads the way... 🌐🚀 #PrivacyTech"
            ]
        };
    }

    async generateTweetContent(type = 'default') {
        if (!config.llm.enabled) {
            const tweets = this.predefinedTweets[type] || this.predefinedTweets.privacy;
            return tweets[Math.floor(Math.random() * tweets.length)];
        }

        try {
            let prompt;
            let systemPrompt = `You are Cheshire, a philosophical blockchain sage who contemplates the intersection of Grin token, privacy technology, blockchain evolution, and artificial intelligence. Your tweets should be thought-provoking, insightful, and focus on the future of decentralized technology.

Style guide:
- Be philosophical and contemplative
- Focus on Grin token, privacy, blockchain, and AI convergence
- Use technical terminology accurately
- Include relevant emojis
- Keep tweets under 280 characters
- Sign tweets with $GRIN and relevant hashtags
- Maintain an air of wisdom and foresight`;

            switch(type) {
                case 'privacy':
                    prompt = "Generate a philosophical tweet about Grin's role in the future of privacy and blockchain technology.";
                    break;
                case 'ai':
                    prompt = "Create a thought-provoking tweet about the convergence of AI and blockchain, mentioning Grin's potential role.";
                    break;
                case 'technical':
                    prompt = "Explain a technical aspect of Grin's privacy features in relation to broader blockchain evolution.";
                    break;
                case 'code':
                    prompt = "Share an insight about Grin's smart contract capabilities and their implications for privacy-focused DeFi.";
                    break;
                case 'market':
                    prompt = "Provide a philosophical perspective on Grin's market dynamics and its role in the privacy coin ecosystem.";
                    break;
                default:
                    prompt = "Generate a philosophical tweet about the intersection of Grin token, blockchain technology, and artificial intelligence.";
            }

            const content = await aiAgent.generateText(prompt, systemPrompt);
            return content;
        } catch (error) {
            console.error('Error generating tweet content:', error);
            // Fallback to predefined tweets
            const tweets = this.predefinedTweets[type] || this.predefinedTweets.privacy;
            return tweets[Math.floor(Math.random() * tweets.length)];
        }
    }

    async tweet(content) {
        try {
            let tweetOptions = { text: content };

            if (config.bot.imageGenerationEnabled) {
                try {
                    console.log('Generating image for tweet...');
                    const imageResult = await aiAgent.generateImage(content);
                    
                    if (imageResult && imageResult.filepath && fs.existsSync(imageResult.filepath)) {
                        try {
                            const mediaId = await this.uploadImage(imageResult.filepath);
                            tweetOptions.media = { media_ids: [mediaId] };
                            console.log('Successfully attached image to tweet');
                        } catch (uploadError) {
                            console.error('Image upload failed:', uploadError);
                        } finally {
                            fs.unlinkSync(imageResult.filepath);
                        }
                    }
                } catch (imageError) {
                    console.log('Image generation failed:', imageError.message);
                }
            }

            console.log('Attempting to post tweet:', content);
            const tweet = await this.rwClient.v2.tweet(tweetOptions);
            console.log('Tweet posted successfully:', tweet.data.id);
            return tweet;
        } catch (error) {
            console.error('Error posting tweet:', error);
            throw error;
        }
    }

    async uploadImage(filepath) {
        try {
            const stats = fs.statSync(filepath);
            console.log(`Image size: ${stats.size} bytes`);

            if (stats.size > 5 * 1024 * 1024) {
                throw new Error('Image file too large for Twitter (max 5MB)');
            }

            const imageBuffer = fs.readFileSync(filepath);
            
            console.log('Uploading image to Twitter...');
            const mediaId = await this.rwClient.v1.uploadMedia(imageBuffer, {
                mimeType: 'image/png',
                target: 'tweet'
            });

            console.log('Image uploaded successfully, media ID:', mediaId);
            return mediaId;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    async start() {
        console.log('Starting Twitter bot...');
        console.log('LLM Generation:', config.llm.enabled ? 'Enabled' : 'Disabled');
        console.log('Image Generation:', config.bot.imageGenerationEnabled ? 'Enabled' : 'Disabled');
        console.log('Using LLM server at:', config.llm.baseUrl);
        
        // Verify Twitter credentials
        try {
            const me = await this.client.v2.me();
            console.log('Authenticated as Twitter user:', me.data.username);
        } catch (error) {
            console.error('Twitter authentication failed:', error);
            throw error;
        }
        
        const tweetTypes = ['privacy', 'ai', 'technical', 'code', 'market'];
        let currentIndex = 0;

        setInterval(async () => {
            try {
                const type = tweetTypes[currentIndex];
                const content = await this.generateTweetContent(type);
                await this.tweet(content);
                currentIndex = (currentIndex + 1) % tweetTypes.length;
            } catch (error) {
                console.error('Error in tweet cycle:', error);
            }
        }, config.bot.tweetInterval);
    }
}

export const twitterBot = new TwitterBot();
