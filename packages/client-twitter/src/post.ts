import { Tweet } from "agent-twitter-client";
import fs from "fs";
import fetch from "node-fetch";

import {
    composeContext,
    embeddingZeroVector,
    IAgentRuntime,
    ModelClass,
    stringToUuid,
} from "@ai16z/eliza";

import { ClientBase } from "./base.js";
import {
    generateImage,
    generateImagePrompt,
    generateWithLMStudio,
} from "./llm.js";

const twitterPostTemplate = `{{timeline}}

# Knowledge
{{knowledge}}

About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{postDirections}}

{{providers}}

{{recentPosts}}

{{characterPostExamples}}

# Task: Generate a post in the voice and style of {{agentName}}, aka @{{twitterUserName}}
Write a single sentence post that is {{adjective}} about {{topic}} (without mentioning {{topic}} directly), from the perspective of {{agentName}}. Try to write something totally different than previous posts. Do not add commentary or ackwowledge this request, just write the post.
Your response should not contain any questions. Brief, concise statements only. No emojis. Use \\n\\n (double spaces) between statements.`;

export class TwitterPostClient extends ClientBase {
    onReady() {
        const generateNewTweetLoop = () => {
            this.generateNewTweet();
            setTimeout(
                generateNewTweetLoop,
                (Math.floor(Math.random() * (180 - 90 + 1)) + 90) * 60 * 1000
            ); // Random interval: min 90min/max 180min (1.5-3h), Results in min 8/max 16 posts per day
        };
        generateNewTweetLoop();
    }

    constructor(runtime: IAgentRuntime) {
        super({ runtime });
    }

    private async downloadImage(url: string): Promise<Buffer> {
        const response = await fetch(url);
        return Buffer.from(await response.arrayBuffer());
    }

    private async generateNewTweet() {
        console.log("Generating new tweet");
        try {
            await this.runtime.ensureUserExists(
                this.runtime.agentId,
                this.runtime.getSetting("TWITTER_USERNAME"),
                this.runtime.character.name,
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
                `# ${this.runtime.character.name}'s Home Timeline\n\n` +
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
                    twitterUserName: this.runtime.getSetting("TWITTER_USERNAME"),
                    timeline: formattedHomeTimeline,
                }
            );

            // Generate new tweet using LM Studio
            const context = composeContext({
                state,
                template:
                    this.runtime.character.templates?.twitterPostTemplate ||
                    twitterPostTemplate,
            });

            const newTweetContent = await generateWithLMStudio(context, ModelClass.SMALL);

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

            // Generate image for the tweet
            const shouldGenerateImage = Math.random() < 0.3; // 30% chance to generate an image
            let imageUrl = null;

            if (shouldGenerateImage) {
                try {
                    const imagePrompt = await generateImagePrompt(content, this.runtime.getSetting("OPENAI_API_KEY"));
                    imageUrl = await generateImage(imagePrompt, this.runtime.getSetting("OPENAI_API_KEY"));
                } catch (error) {
                    console.error("Error generating image:", error);
                }
            }

            try {
                // Send tweet using the Twitter client
                const result = await this.requestQueue.add(
                    async () => await this.twitterClient.sendTweet(content)
                );
                
                const body = await result.json();
                const tweetResult = body.data.create_tweet.tweet_results.result;

                const tweet = {
                    id: tweetResult.rest_id,
                    text: tweetResult.legacy.full_text,
                    conversationId: tweetResult.legacy.conversation_id_str,
                    createdAt: tweetResult.legacy.created_at,
                    userId: tweetResult.legacy.user_id_str,
                    inReplyToStatusId: tweetResult.legacy.in_reply_to_status_id_str,
                    permanentUrl: `https://twitter.com/${this.runtime.getSetting("TWITTER_USERNAME")}/status/${tweetResult.rest_id}`,
                    hashtags: [],
                    mentions: [],
                    photos: imageUrl ? [imageUrl] : [],
                    thread: [],
                    urls: [],
                    videos: [],
                } as Tweet;

                const postId = tweet.id;
                const conversationId = tweet.conversationId + "-" + this.runtime.agentId;
                const roomId = stringToUuid(conversationId);

                await this.runtime.ensureRoomExists(roomId);
                await this.runtime.ensureParticipantInRoom(
                    this.runtime.agentId,
                    roomId
                );

                // If we have an image, send it as a reply
                if (imageUrl) {
                    await this.requestQueue.add(
                        async () => await this.twitterClient.sendTweet(
                            "🎨", // Just use an emoji for the image reply
                            tweet.id // Reply to the original tweet
                        )
                    );
                }

                await this.cacheTweet(tweet);

                await this.runtime.messageManager.createMemory({
                    id: stringToUuid(postId + "-" + this.runtime.agentId),
                    userId: this.runtime.agentId,
                    agentId: this.runtime.agentId,
                    content: {
                        text: newTweetContent.trim(),
                        url: tweet.permanentUrl,
                        source: "twitter",
                        imageUrl: imageUrl,
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
}
