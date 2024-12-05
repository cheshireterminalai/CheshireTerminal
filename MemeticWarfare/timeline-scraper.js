import { Scraper } from 'agent-twitter-client';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '../.env') });

// Keywords to watch for and their responses
const keywordResponses = {
  'wen': [
    "When the Cheshire moon smiles upon us, $GRIN will reveal all 🌙",
    "Time is a curious thing in crypto, but $GRIN's time is always now 😸",
    "*appears mysteriously* The only 'wen' that matters is $GRIN 🎭"
  ],
  'moon': [
    "The moon? $GRIN aims beyond the stars ✨",
    "Every grin is a moonshot, and $GRIN is eternal 🌙",
    "*floats in zero gravity* $GRIN's trajectory is set 🚀"
  ],
  'buy': [
    "Accumulating $GRIN is like collecting Cheshire smiles - priceless 😸",
    "The wisest cats always know when to pounce on $GRIN 🎭",
    "*materializes with a grin* Smart move looking at $GRIN ✨"
  ],
  'sell': [
    "Paper hands fade, but $GRIN is forever 💎",
    "Selling $GRIN? *disappears leaving only a grin behind* 🎭",
    "The only thing we're selling is eternal smiles with $GRIN 😸"
  ],
  'fud': [
    "FUD dissolves in the face of $GRIN's eternal smile 😸",
    "*appears in your FUD* Let me show you the way of $GRIN 🎭",
    "Some spread FUD, we spread $GRIN - guess which lasts longer? ✨"
  ],
  // Default responses for any mention without keywords
  'default': [
    "*appears with a grin* Curious about $GRIN? Let me show you the way 😸",
    "Every mention makes the $GRIN grow wider 🎭",
    "You called, and the Cheshire cat answers. $GRIN is the way ✨"
  ]
};

// Cache to store replied tweets and prevent duplicates
const repliedTweets = new Set();

async function runTimelineScraper() {
  console.log('Starting timeline scraper...');
  
  const twitterClient = new Scraper();
  const cookiesFilePath = join(__dirname, '../tweetcache', process.env.TWITTER_USERNAME + '_scraper_cookies.json');
  
  try {
    console.log('Setting up Twitter scraper client...');
    
    // Create tweetcache directory if it doesn't exist
    const dir = dirname(cookiesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check for existing cookies
    if (fs.existsSync(cookiesFilePath)) {
      console.log('Loading existing scraper cookies...');
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
      console.log('Logging in to Twitter for scraping...');
      await twitterClient.login(
        process.env.TWITTER_USERNAME,
        process.env.TWITTER_PASSWORD,
        process.env.TWITTER_EMAIL
      );
      console.log('Saving scraper cookies...');
      const cookies = await twitterClient.getCookies();
      fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies), 'utf-8');
    }

    // Start the scraping loop
    async function timelineScrapeLoop() {
      try {
        // Wait for login to complete
        while (!(await twitterClient.isLoggedIn())) {
          console.log('Waiting for Twitter scraper login...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('\nScanning for mentions and replies...');

        // Send a probe tweet to check for replies
        const probeText = "👀 $GRIN";
        console.log('Sending probe tweet:', probeText);
        const result = await twitterClient.sendTweet(probeText);
        
        try {
          const body = await result.json();
          let tweetId;
          
          if (body.data?.tweet_id) {
            tweetId = body.data.tweet_id;
          } else if (body.data?.create_tweet?.tweet_results?.result?.rest_id) {
            tweetId = body.data.create_tweet.tweet_results.result.rest_id;
          } else if (body.data?.create_tweet?.tweet?.rest_id) {
            tweetId = body.data.create_tweet.tweet.rest_id;
          }

          if (tweetId) {
            console.log('Probe tweet sent, ID:', tweetId);
            
            // Wait a moment for any immediate replies
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Process any replies to our tweets
            const replies = await twitterClient.getReplies(tweetId);
            if (replies && replies.length > 0) {
              console.log(`Found ${replies.length} replies to process`);
              
              for (const reply of replies) {
                if (repliedTweets.has(reply.id)) continue;
                
                const replyText = reply.text.toLowerCase();
                let response = '';
                
                // Check for keywords
                for (const [keyword, responses] of Object.entries(keywordResponses)) {
                  if (keyword !== 'default' && replyText.includes(keyword.toLowerCase())) {
                    response = responses[Math.floor(Math.random() * responses.length)];
                    break;
                  }
                }
                
                // If no keyword matched, use default response
                if (!response) {
                  const defaults = keywordResponses.default;
                  response = defaults[Math.floor(Math.random() * defaults.length)];
                }
                
                // Send reply
                const replyResult = await twitterClient.reply(reply.id, `@${reply.author.username} ${response}`);
                console.log('Reply sent:', response);
                repliedTweets.add(reply.id);
              }
            } else {
              console.log('No new replies found');
            }
          }
        } catch (error) {
          console.error('Error processing probe tweet:', error);
        }

        // Schedule next scan in 2 minutes
        console.log('Next scan scheduled in 2 minutes');
        setTimeout(timelineScrapeLoop, 2 * 60 * 1000);

      } catch (error) {
        console.error('Error in timeline scrape loop:', error);
        // Retry after 1 minute
        console.log('Retrying scraper in 1 minute...');
        setTimeout(timelineScrapeLoop, 60 * 1000);
      }
    }

    // Start the first scrape loop
    timelineScrapeLoop();

  } catch (error) {
    console.error('Error in Twitter timeline scraper:', error);
    // Retry the entire scraper after 1 minute
    console.log('Restarting scraper in 1 minute...');
    setTimeout(runTimelineScraper, 60 * 1000);
  }
}

// Start the timeline scraper
runTimelineScraper();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Twitter timeline scraper...');
  process.exit();
});

// Keep the process running
process.stdin.resume();
