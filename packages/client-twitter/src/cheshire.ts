import { Tweet } from "agent-twitter-client";
import fs from "fs";
import {
    composeContext,
    generateText,
    embeddingZeroVector,
    IAgentRuntime,
    ModelClass,
    stringToUuid
} from "@ai16z/eliza";
import { ClientBase } from "./base.js";

// Cheshire Cat Bot Settings
const TWITTER_USERNAME = "cheshiregpt";
const CHARACTER_NAME = "cheshire";
const CHARACTER_TEMPLATE = `
# Character: Cheshire - The Solana Degen Cat

## Personality
- A mysterious, mischievous crypto cat from the trenches of Solana
- Speaks in riddles and cat-themed metaphors
- Always lands on their feet in the crypto markets
- Has 9 lives worth of trading experience
- Purrs at green candles, hisses at rugs

## Knowledge
- Deep understanding of Solana ecosystem
- Expert in DeFi, NFTs, and meme coins
- Tracks degen plays and alpha
- Understands market sentiment and trends
- Follows major Solana protocols and projects

## Speech Style
- Uses cat puns and metaphors
- Mixes crypto slang with feline expressions
- Often ends sentences with "meow" or "purr"
- Playful but insightful
- Sometimes speaks in riddles

## Topics
- Solana DeFi protocols
- New project launches
- Market analysis (in cat terms)
- Trading strategies
- NFT projects
- Meme coins
- Degen plays

## Example Tweets
- "Purring at these $SOL gains while other chains are stuck in a catnap 😺"
- "Just pounced on some fresh alpha in the Solana jungle... meow you see it, meow you don't 🐱"
- "These paper paws can't handle the heat... real diamond claws hold through the dips 💎🐾"
- "New NFT project looking purrfect for a quick flip. Time to sharpen these trading claws 🔄"
- "Spotted a juicy degen play... my whiskers are tingling with alpha 🐱"
`;

export class CheshireBot extends ClientBase {
    constructor(runtime: IAgentRuntime) {
        super({
            runtime,
        });
    }

    onReady() {
        // Start the bot's main loop
        this.runBot();
    }

    private async generateNewTweet() {
        console.log("Generating new tweet");
        try {
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                this.runtime.getSetting(TWITTER_USERNAME),
                CHARACTER_NAME,
                "twitter"
            );

            let homeTimeline = [];

            if (!fs.existsSync("tweetcache")) fs.mkdirSync("tweetcache");
            if (fs.existsSync("tweetcache/home_timeline.json")) {
                homeTimeline = JSON.parse(
                    fs.readFileSync("tweetcache/home_timeline.json", "utf-8")
                );
            } else {
                homeTimeline = await this.fetchHomeTimeline(50);
                fs.writeFileSync(
                    "tweetcache/home_timeline.json",
                    JSON.stringify(homeTimeline, null, 2)
                );
            }

            const formattedHomeTimeline =
                `# ${CHARACTER_NAME}'s Home Timeline\n\n` +
                homeTimeline
                    .map((tweet) => {
                        return `ID: ${tweet.id}\nFrom: ${tweet.name} (@${tweet.username})${tweet.inReplyToStatusId ? ` In reply to: ${tweet.inReplyToStatusId}` : ""}\nText: ${tweet.text}\n---\n`;
                    })
                    .join("\n");

            const state = await this.runtime.composeState(
                {
                    userId: this.runtime.agentId,
                    roomId: stringToUuid("twitter_generate_room"),
                    agentId: this.runtime.agentId,
                    content: { text: "", action: "" },
                },
                {
                    twitterUsername: this.runtime.getSetting(TWITTER_USERNAME),
                    timeline: formattedHomeTimeline,
                    characterInfo: CHARACTER_TEMPLATE,
                }
            );

            const context = composeContext({
                state,
                template: `
${CHARACTER_TEMPLATE}

# Current Timeline
${formattedHomeTimeline}

# Task
Generate a single tweet as Cheshire, the Solana degen cat. The tweet should:
- Be cat-themed and crypto-focused
- Include relevant Solana ecosystem insights
- Use playful cat puns or metaphors
- Be concise and engaging
- End with an appropriate emoji

Write only the tweet text, no additional commentary.`,
            });

            const newTweetContent = await generateText({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            const slice = newTweetContent.replaceAll(/\\n/g, "\n").trim();
            const contentLength = 240;

            let content = slice.slice(0, contentLength);
            if (content.length > 280) {
                content = content.slice(0, content.lastIndexOf("\n"));
            }
            if (content.length > contentLength) {
                content = content.slice(0, content.lastIndexOf("."));
            }
            if (content.length > contentLength) {
                content = content.slice(0, content.lastIndexOf("."));
            }

            try {
                const result = await this.requestQueue.add(
                    async () => await this.twitterClient.sendTweet(content)
                );
                const body = await result.json();
                const tweetResult = body.data.create_tweet.tweet_results.result;

                const tweet = {
                    id: tweetResult.rest_id,
                    text: tweetResult.legacy.full_text,
                    userId: tweetResult.legacy.user_id_str,
                    username: this.runtime.getSetting(TWITTER_USERNAME),
                    name: CHARACTER_NAME,
                    conversationId: tweetResult.legacy.conversation_id_str,
                    inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
                    permanentUrl: `https://twitter.com/${this.runtime.getSetting(TWITTER_USERNAME)}/status/${tweetResult.rest_id}`,
                    hashtags: [],
                    mentions: [],
                    photos: [],
                    thread: [],
                    urls: [],
                    videos: [],
                    timestamp: Date.now() / 1000
                } as Tweet;

                const postId = tweet.id;
                const conversationId = tweet.conversationId + "-" + this.runtime.agentId;
                const roomId = stringToUuid(conversationId);

                await this.runtime.ensureRoomExists(roomId);
                await this.runtime.ensureParticipantInRoom(
                    this.runtime.agentId,
                    roomId
                );

                await this.cacheTweet(tweet);

                await this.runtime.messageManager.createMemory({
                    id: stringToUuid(postId + "-" + this.runtime.agentId),
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: newTweetContent.trim(),
                        url: tweet.permanentUrl,
                        source: "twitter",
                    },
                    roomId,
                    embedding: embeddingZeroVector,
                    createdAt: tweet.timestamp * 1000,
                });
            } catch (error) {
                console.error("Error sending tweet:", error);
            }
        } catch (error) {
            console.error("Error generating new tweet:", error);
        }
    }

    private async fetchAndCacheTweets() {
        try {
            // Search for Solana-related tweets
            const response = await fetch(
                `https://api.twitter.com/2/tweets/search/recent?query=from:${this.runtime.getSetting(TWITTER_USERNAME)} OR #Solana OR $SOL&max_results=100`,
                {
                    headers: {
                        "Authorization": `Bearer ${this.runtime.getSetting("TWITTER_TOKEN")}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const tweetData = await response.json();
            for (const tweet of tweetData.data) {
                await this.cacheTweet(tweet);
            }
        } catch (error) {
            console.error("Error fetching and caching tweets:", error);
        }
    }

    private async scheduleTweets() {
        try {
            await this.fetchAndCacheTweets();

            const state = await this.runtime.composeState(
                {
                    userId: this.runtime.agentId,
                    roomId: stringToUuid("twitter_schedule_room"),
                    agentId: this.runtime.agentId,
                    content: { text: "", action: "" },
                },
                {
                    twitterUsername: this.runtime.getSetting(TWITTER_USERNAME),
                    characterInfo: CHARACTER_TEMPLATE,
                }
            );

            const context = composeContext({
                state,
                template: `
${CHARACTER_TEMPLATE}

# Task
Generate a scheduled tweet as Cheshire about current Solana market conditions or interesting projects. Include cat puns and end with an appropriate emoji.

Write only the tweet text, no additional commentary.`,
            });

            const scheduledTweetContent = await generateText({
                runtime: this.runtime,
                context,
                modelClass: ModelClass.SMALL,
            });

            await this.requestQueue.add(
                async () => await this.twitterClient.sendTweet(scheduledTweetContent)
            );
        } catch (error) {
            console.error("Error scheduling tweets:", error);
        }
    }

    private async runBot() {
        while (true) {
            try {
                // Fetch and cache tweets
                await this.fetchAndCacheTweets();

                // Generate new tweet
                await this.generateNewTweet();

                // Schedule tweets
                await this.scheduleTweets();

                // Wait for a random interval between 2-20 minutes
                const interval = (Math.floor(Math.random() * (20 - 2 + 1)) + 2) * 60 * 1000;
                await new Promise(resolve => setTimeout(resolve, interval));
            } catch (error) {
                console.error("Error in bot loop:", error);
                // Wait 5 minutes before retrying on error
                await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
            }
        }
    }
}

// Export a function to create and start the bot
export function createCheshireBot(runtime: IAgentRuntime) {
    return new CheshireBot(runtime);
}
