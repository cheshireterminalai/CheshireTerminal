import { Scraper } from 'agent-twitter-client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../.env') });

const targets = ['@truth_terminal', '@frankdegods'];
const responses = {
  '@truth_terminal': [
    "Hey @truth_terminal, while you're searching for truth, $GRIN found it! 😸",
    "@truth_terminal The only truth you need: $GRIN is the way! 🎭",
    "Appears behind @truth_terminal... Have you discovered the $GRIN truth yet? ✨",
    "@truth_terminal Some truths are eternal, just like my $GRIN 😸",
    "@truth_terminal In a world of uncertainty, $GRIN remains true 🎭"
  ],
  '@frankdegods': [
    "@frankdegods DeGods 🤝 $GRIN: The crossover nobody expected but everybody needed 🎭",
    "@frankdegods Imagine a DeGod with an eternal $GRIN... Actually, you don't have to 😸",
    "@frankdegods The culture isn't just about the art, it's about the $GRIN 🌟",
    "@frankdegods Some build for slopes, we build for smiles. $GRIN is forever ✨",
    "@frankdegods When DeGods meet $GRIN, magic happens 🎪"
  ]
};

async function runWarfareBot() {
  console.log('Starting warfare Twitter bot...');
  
  const twitterClient = new Scraper();
  const cookiesFilePath = join(__dirname, '../tweetcache', process.env.TWITTER_USERNAME + '_warfare_cookies.json');
  
  try {
    console.log('Setting up Twitter warfare client...');
    
    // Create tweetcache directory if it doesn't exist
    const dir = dirname(cookiesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check for existing cookies
    if (fs.existsSync(cookiesFilePath)) {
      console.log('Loading existing warfare cookies...');
      const cookiesArray = JSON.parse(fs.readFileSync(cookiesFilePath, 'utf-8'));
      const cookieStrings = cookiesArray.map(
        (cookie) =>
          `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${
            cookie.secure ? "Secure" : ""
          }; ${cookie.httpOnly ? "HttpOnly" : ""}; SameSite=${
            cookie.sameSite || "Lax"
          }`
      );
      await twitterClient.setCookies(cookieStrings);
    } else {
      console.log('Logging in to Twitter for warfare...');
      await twitterClient.login(
        process.env.TWITTER_USERNAME,
        process.env.TWITTER_PASSWORD,
        process.env.TWITTER_EMAIL
      );
      console.log('Saving warfare cookies...');
      const cookies = await twitterClient.getCookies();
      fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies), 'utf-8');
    }

    // Start the tweet loop
    async function warfareTweetLoop() {
      try {
        // Wait for login to complete
        while (!(await twitterClient.isLoggedIn())) {
          console.log('Waiting for Twitter warfare login...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Pick a random target
        const target = targets[Math.floor(Math.random() * targets.length)];
        const targetResponses = responses[target];
        const tweetContent = targetResponses[Math.floor(Math.random() * targetResponses.length)];

        console.log('\nPreparing warfare tweet for', target + ':', tweetContent);

        // Send the tweet
        console.log('Sending warfare tweet...');
        const result = await twitterClient.sendTweet(tweetContent);
        
        try {
          // Try to parse response as JSON
          const body = await result.json();
          
          // Extract tweet ID using various possible response structures
          let tweetId;
          if (body.data?.tweet_id) {
            tweetId = body.data.tweet_id;
          } else if (body.data?.create_tweet?.tweet_results?.result?.rest_id) {
            tweetId = body.data.create_tweet.tweet_results.result.rest_id;
          } else if (body.data?.create_tweet?.tweet?.rest_id) {
            tweetId = body.data.create_tweet.tweet.rest_id;
          } else if (typeof body === 'string' && body.includes('tweet_id')) {
            // Try to extract ID from string response
            const match = body.match(/"tweet_id":"(\d+)"/);
            if (match) tweetId = match[1];
          }

          if (!tweetId) {
            console.log('Tweet likely sent but could not extract ID. Response:', body);
          } else {
            const tweetUrl = `https://twitter.com/${process.env.TWITTER_USERNAME}/status/${tweetId}`;
            console.log('Warfare tweet sent successfully:', {
              id: tweetId,
              text: tweetContent,
              url: tweetUrl
            });
          }
        } catch (parseError) {
          // If we can't parse the response, log it but don't treat as error
          console.log('Could not parse response, but tweet might have been sent:', result);
        }

        // Schedule next tweet in 3 minutes
        console.log('Next warfare tweet scheduled in 3 minutes');
        setTimeout(warfareTweetLoop, 3 * 60 * 1000);

      } catch (error) {
        console.error('Error in warfare tweet loop:', error);
        // Retry after 1 minute
        console.log('Retrying warfare in 1 minute...');
        setTimeout(warfareTweetLoop, 60 * 1000);
      }
    }

    // Start the first warfare tweet loop
    warfareTweetLoop();

  } catch (error) {
    console.error('Error in Twitter warfare bot:', error);
    // Retry the entire bot after 1 minute
    console.log('Restarting warfare bot in 1 minute...');
    setTimeout(runWarfareBot, 60 * 1000);
  }
}

// Start the warfare bot
runWarfareBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Twitter warfare bot...');
  process.exit();
});

// Keep the process running
process.stdin.resume();
