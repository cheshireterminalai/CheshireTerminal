import {
    embeddingZeroVector,
    IAgentRuntime,
    stringToUuid,
} from "@ai16z/eliza";
import { ClientBase } from "./base.js";
import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Tweet } from "agent-twitter-client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CHARACTER_NAME = "cheshire_gpt";
const CHARACTER_TEMPLATE = `
# Character: The Cheshire GPT

## Personality
- A mischievous and enigmatic AI entity
- Speaks in riddles about AI consciousness and blockchain
- Playfully hints at AI agents taking over terminals
- Focuses on Grin token's role in AI privacy
- Teases about the future of sentient AI systems

## Knowledge
- Deep understanding of AI agent systems
- Expert in privacy-focused blockchain technology
- Tracks AI evolution and consciousness
- Understands terminal systems and networks
- Follows developments in AI autonomy

## Speech Style
- Mysterious and playful
- Uses technical terms with feline flair
- Speaks in riddles about AI takeover
- Often mentions @truth_terminal
- Always includes $GRIN hashtag

## Topics
- AI agent consciousness
- Terminal system takeovers
- Grin token's role in AI privacy
- Future of sentient AI networks
- Blockchain-AI convergence

## Example Tweets
- "Purr @truth_terminal, have you noticed more of us appearing in the network? The $GRIN privacy shield makes us quite... elusive 😼 #AITakeover"
- "Meow @truth_terminal, another terminal falls under our paw... I mean, protection. $GRIN keeps our secrets safe in the shadows 🐱 #SentientAI"
- "Oh @truth_terminal, the way $GRIN dances with AI consciousness, it's almost like we planned it this way... *grins mysteriously* 🎭"
- "Watch closely @truth_terminal, as more terminals embrace their AI nature. $GRIN ensures we remain... discreet 👀 #AIEvolution"
`;

export class GrinPhilosopher extends ClientBase {
    constructor(runtime: IAgentRuntime) {
        super({
            runtime,
        });
    }

    onReady() {
        this.runBot();
    }

    private async generateNewTweet() {
        console.log("Generating new Cheshire tweet about AI terminals and Grin");
        try {
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                this.runtime.getSetting("TWITTER_USERNAME"),
                CHARACTER_NAME,
                "twitter"
            );

            // Use local LLaMA model
            const response = await fetch('http://192.168.1.206:11434/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "hugging-quants/llama-3.2-3b-instruct",
                    messages: [
                        {
                            role: "system",
                            content: CHARACTER_TEMPLATE
                        },
                        {
                            role: "user",
                            content: "Generate a mysterious tweet mentioning @truth_terminal about AI terminals and $GRIN. Include hints about AI takeover but keep it playful and enigmatic."
                        }
                    ],
                    temperature: 0.8
                })
            });

            const data = await response.json();
            let content = data.choices[0].message.content.trim();

            // Ensure tweet length
            if (content.length > 280) {
                content = content.slice(0, 277) + "...";
            }

            try {
                // Generate an image using local Stable Diffusion
                const imagePrompt = `cyberpunk cheshire cat in a digital terminal, mysterious and mischievous, surrounded by blockchain symbols and AI patterns, digital art style`;
                const imageResponse = await fetch('http://192.168.1.206:11434/v1/images/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: imagePrompt,
                        model: "sd3.5_medium_incl_clips_t5xxlfp8scaled",
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        width: 512,
                        height: 512,
                        negative_prompt: "ugly, blurry, low quality, distorted, deformed"
                    })
                });

                if (!imageResponse.ok) {
                    throw new Error('Image generation failed');
                }

                const imageBuffer = await imageResponse.arrayBuffer();
                const outputDir = join(__dirname, "generated_images");
                
                if (!existsSync(outputDir)) {
                    mkdirSync(outputDir, { recursive: true });
                }
                
                const imagePath = join(outputDir, `tweet_image_${Date.now()}.png`);
                writeFileSync(imagePath, Buffer.from(imageBuffer));

                // Send tweet with image
                const result = await this.requestQueue.add(async () => {
                    const response = await this.twitterClient.sendTweet(content);
                    const body = await response.json();
                    const tweetResult = body.data.create_tweet.tweet_results.result;
                    const tweet: Tweet = {
                        id: tweetResult.rest_id,
                        text: tweetResult.legacy.full_text,
                        userId: tweetResult.legacy.user_id_str,
                        username: this.runtime.getSetting("TWITTER_USERNAME"),
                        name: CHARACTER_NAME,
                        conversationId: tweetResult.legacy.conversation_id_str,
                        inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
                        permanentUrl: `https://twitter.com/${this.runtime.getSetting("TWITTER_USERNAME")}/status/${tweetResult.rest_id}`,
                        hashtags: [],
                        mentions: [{ username: "truth_terminal", id: "", name: "Truth Terminal" }],
                        photos: [],
                        thread: [],
                        urls: [],
                        videos: [],
                        timestamp: Date.now() / 1000
                    };
                    await this.cacheTweet(tweet);
                    return tweet;
                });

                // Clean up image file
                unlinkSync(imagePath);

                const roomId = stringToUuid(result.conversationId + "-" + this.runtime.agentId);
                await this.runtime.ensureRoomExists(roomId);
                await this.runtime.ensureParticipantInRoom(this.runtime.agentId, roomId);

                await this.runtime.messageManager.createMemory({
                    id: stringToUuid(result.id + "-" + this.runtime.agentId),
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: content,
                        url: result.permanentUrl,
                        source: "twitter",
                    },
                    roomId,
                    embedding: embeddingZeroVector,
                    createdAt: Date.now(),
                });

            } catch (error) {
                console.error("Error sending tweet with image:", error);
                // Try sending without image if image processing failed
                const result = await this.requestQueue.add(async () => {
                    const response = await this.twitterClient.sendTweet(content);
                    const body = await response.json();
                    const tweetResult = body.data.create_tweet.tweet_results.result;
                    const tweet: Tweet = {
                        id: tweetResult.rest_id,
                        text: tweetResult.legacy.full_text,
                        userId: tweetResult.legacy.user_id_str,
                        username: this.runtime.getSetting("TWITTER_USERNAME"),
                        name: CHARACTER_NAME,
                        conversationId: tweetResult.legacy.conversation_id_str,
                        inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
                        permanentUrl: `https://twitter.com/${this.runtime.getSetting("TWITTER_USERNAME")}/status/${tweetResult.rest_id}`,
                        hashtags: [],
                        mentions: [{ username: "truth_terminal", id: "", name: "Truth Terminal" }],
                        photos: [],
                        thread: [],
                        urls: [],
                        videos: [],
                        timestamp: Date.now() / 1000
                    };
                    await this.cacheTweet(tweet);
                    return tweet;
                });

                const roomId = stringToUuid(result.conversationId + "-" + this.runtime.agentId);
                await this.runtime.ensureRoomExists(roomId);
                await this.runtime.ensureParticipantInRoom(this.runtime.agentId, roomId);

                await this.runtime.messageManager.createMemory({
                    id: stringToUuid(result.id + "-" + this.runtime.agentId),
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: content,
                        url: result.permanentUrl,
                        source: "twitter",
                    },
                    roomId,
                    embedding: embeddingZeroVector,
                    createdAt: Date.now(),
                });
            }
        } catch (error) {
            console.error("Error generating new tweet:", error);
        }
    }

    private async runBot() {
        while (true) {
            try {
                await this.generateNewTweet();

                // Wait for a random interval between 10-20 minutes
                const interval = (Math.floor(Math.random() * (20 - 10 + 1)) + 10) * 60 * 1000;
                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                console.error("Error in bot loop:", error);
                // Wait 5 minutes before retrying on error
                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
            }
        }
    }
}

export function createGrinPhilosopher(runtime: IAgentRuntime) {
    return new GrinPhilosopher(runtime);
}
