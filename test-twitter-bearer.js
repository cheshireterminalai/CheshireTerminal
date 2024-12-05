import * as dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";

dotenv.config();

async function testBearerAuth() {
    console.log('Testing Twitter API with Bearer Token...');
    
    try {
        // Ensure bearer token is properly formatted
        const bearerToken = process.env.TWITTER_BEARER_TOKEN.startsWith('Bearer ') 
            ? process.env.TWITTER_BEARER_TOKEN 
            : `Bearer ${process.env.TWITTER_BEARER_TOKEN}`;
            
        console.log('\nBearer token format check:');
        console.log('- Starts with "Bearer":', bearerToken.startsWith('Bearer '));
        console.log('- Total length:', bearerToken.length);
        
        // Create client with bearer token
        const client = new TwitterApi(bearerToken);
        
        // Try to get user information
        const user = await client.v2.userByUsername('cheshiregpt');
        console.log('\nUser info:', user);
        
    } catch (error) {
        console.error('\nError:', {
            message: error.message,
            code: error.code,
            data: error.data
        });
    }
}

testBearerAuth();
