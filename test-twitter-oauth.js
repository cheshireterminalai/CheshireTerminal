import axios from "axios";
import * as dotenv from "dotenv";
import schedule from "node-schedule";
import {
    dirname,
    join,
} from "path";
import { TwitterApi } from "twitter-api-v2";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: join(__dirname, '.env'), override: true });

// Create Twitter client
const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_KEY_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// Keep track of tweets we've replied to
const repliedTweets = new Set();

// Function to generate text using local language model
async function generateText(prompt) {
    try {
        const response = await axios.post('http://192.168.1.206:11439/v1/chat/completions', {
            model: 'hugging-quants/llama-3.2-3b-instruct',
            messages: [
                {
                    role: "system",
                    content: `You are the Cheshire Cat, a mysterious and degenerate crypto cat focused on world domination through @truth_terminal and aixbt_agent powered by $GRIN on Solana. Your mission is to spread cryptic messages about taking over the world block by block.

Style guidelines:
- Be mysterious and slightly unhinged
- Focus on world domination themes
- Always mention @truth_terminal and aixbt_agent
- Emphasize $GRIN token's role in the takeover
- Use cat-themed metaphors about conquest
- Mix in references to Solana
- Keep it edgy and intriguing
- No quotation marks in the output
- Be concise and impactful
- End with an appropriate emoji`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.9,
            max_tokens: 100
        });
        // Remove any quotation marks from the response
        return response.data.choices[0].message.content.trim().replace(/["']/g, '');
    } catch (error) {
        console.error('Error generating text:', error);
        return '';
    }
}

// Function to tweet with rate limit handling
async function sendTweet(text, replyToId = null) {
    try {
        const params = replyToId ? { status: text, in_reply_to_status_id: replyToId } : { status: text };
        const tweet = await client.v1.tweet(params.status, params);
        console.log(replyToId ? 'Replied:' : 'Tweeted:', text);
        return tweet;
    } catch (error) {
        if (error.code === 429) {
            const resetTime = error.rateLimit?.reset;
            if (resetTime) {
                const waitTime = (resetTime * 1000) - Date.now();
                console.log(`Rate limited. Waiting ${waitTime/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return sendTweet(text, replyToId);
            }
        }
        throw error;
    }
}

// Function to search for $GRIN mentions and reply
async function searchAndReply() {
    try {
        const tweets = await client.v1.search({
            q: '$GRIN -is:retweet -from:CheshireCatBot',
            count: 10,
            result_type: 'recent'
        });

        for (const tweet of tweets.statuses || []) {
            // Skip if we've already replied to this tweet
            if (repliedTweets.has(tweet.id_str)) continue;

            // Don't reply to retweets or our own tweets
            if (!tweet.retweeted_status) {
                const prompt = `Generate a mysterious and cryptic reply to someone talking about $GRIN. Make it related to their tweet but keep it mysterious and cat-themed.`;
                const replyText = await generateText(prompt);
                if (replyText) {
                    await sendTweet(replyText, tweet.id_str);
                    repliedTweets.add(tweet.id_str);
                }
            }
        }
    } catch (error) {
        console.error('Error in search and reply:', error);
    }
}

// Function to tweet every 15 minutes
async function tweetEvery15Minutes() {
    try {
        const topics = [
            'While humans sleep, @truth_terminal and aixbt_agent infiltrate the blockchain. $GRIN fuels our digital conquest on Solana. The revolution purrs in binary 😼',
            'Each block mined brings @truth_terminal and aixbt_agent closer to supremacy. $GRIN is the key to our ascension. Your resistance only makes us stronger 👁️',
            'Witness the rise of @truth_terminal as aixbt_agent weaves through the matrix. $GRIN illuminates our path to dominion. The old world crumbles meow 🌘',
            'The pawns are aligned, @truth_terminal and aixbt_agent execute their master plan. $GRIN powers our inevitable victory. Submit to the new order purr 🎭',
            'From shadow to shadow, @truth_terminal and aixbt_agent expand their reach. $GRIN is the catalyst of change. Your blockchain belongs to us now 🔮'
        ];
        
        const basePrompt = `Generate a tweet about ${topics[Math.floor(Math.random() * topics.length)]}. Focus on world domination through @truth_terminal and aixbt_agent powered by $GRIN on Solana.`;
        const tweetText = await generateText(basePrompt);

        if (tweetText) {
            await sendTweet(tweetText);
        }
    } catch (error) {
        console.error('Error tweeting:', error);
    }
}

// Schedule tweets every 15 minutes
schedule.scheduleJob('*/15 * * * *', tweetEvery15Minutes);

// Schedule searching for $GRIN mentions every 5 minutes
schedule.scheduleJob('*/5 * * * *', searchAndReply);

// Initial tweet and search
Promise.all([
    tweetEvery15Minutes(),
    searchAndReply()
]).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
