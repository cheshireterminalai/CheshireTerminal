import * as dotenv from "dotenv";
import { dirname } from "path";
import { TwitterApi } from "twitter-api-v2";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

async function testAuth() {
    console.log('Testing Twitter API credentials...');
    console.log('API Key:', process.env.TWITTER_API_KEY);
    console.log('API Key Secret:', process.env.TWITTER_API_KEY_SECRET ? '✓ Present' : '✗ Missing');
    console.log('Access Token:', process.env.TWITTER_ACCESS_TOKEN);
    console.log('Access Token Secret:', process.env.TWITTER_ACCESS_TOKEN_SECRET ? '✓ Present' : '✗ Missing');

    const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_KEY_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    try {
        const me = await client.v2.me();
        console.log('\nAuthentication successful!');
        console.log('Authenticated as:', {
            username: me.data.username,
            name: me.data.name,
            id: me.data.id
        });
    } catch (error) {
        console.error('\nAuthentication failed:', {
            message: error.message,
            code: error.code,
            data: error.data
        });
    }
}

testAuth();
