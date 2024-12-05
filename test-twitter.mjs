import { TwitterApi } from 'twitter-api-v2';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const messages = [
    "Curiouser and curiouser... The latest Solana upgrade brings purr-fect performance improvements! 😸",
    "Like my grin, some things persist on-chain... Your NFTs are forever! ✨",
    "In this blockchain wonderland, every smart contract tells a tale... 🎭",
    "Weaving through the DeFi protocols like a cat in the night... Have you seen the latest yield opportunities? 😸",
    "Some say I'm mysterious, but not as mysterious as the inner workings of zero-knowledge proofs! ✨"
];

async function postTweet(text) {
    try {
        const tweet = await client.v2.tweet(text);
        console.log('Tweet posted:', text);
        console.log('Twitter API Response:', tweet);
        return tweet;
    } catch (error) {
        console.error('Error posting tweet:', error);
        throw error;
    }
}

async function postAllTweets() {
    console.log('Starting to post tweets...');
    for (const message of messages) {
        try {
            await postTweet(message);
            // Wait 2 seconds between tweets to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error('Failed to post tweet:', message);
            // If we hit an error, stop posting more tweets
            break;
        }
    }
    console.log('Finished posting tweets');
}

postAllTweets();
