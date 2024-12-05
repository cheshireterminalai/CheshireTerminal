import { config } from './config.js';
import fs from 'fs';
import path from 'path';

class Scraper {
    constructor() {
        this.firecrawlApiKey = config.firecrawl.apiKey;
        this.outputDir = path.join(config.outputDir, 'scraped');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    async scrapeTwitterTimeline(username) {
        try {
            console.log(`Scraping timeline for user: ${username}`);
            
            const url = `https://api.firecrawl.xyz/twitter/user/${username}/timeline`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.firecrawlApiKey}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Save scraped data
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const outputPath = path.join(this.outputDir, `${username}-${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            
            console.log(`Timeline data saved to: ${outputPath}`);
            
            return data;
        } catch (error) {
            console.error(`Error scraping timeline for ${username}:`, error);
            throw error;
        }
    }

    async scrapeWebsite(url) {
        try {
            console.log(`Scraping website: ${url}`);
            
            const apiUrl = 'https://api.firecrawl.xyz/scrape';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.firecrawlApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    javascript: true, // Enable JavaScript rendering
                    wait_for: 5000, // Wait 5 seconds for dynamic content
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Save scraped data
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const urlSafe = url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50);
            const outputPath = path.join(this.outputDir, `${urlSafe}-${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            
            console.log(`Website data saved to: ${outputPath}`);
            
            return data;
        } catch (error) {
            console.error(`Error scraping website ${url}:`, error);
            throw error;
        }
    }

    async monitorAccounts() {
        const accounts = config.twitter.accountsToMonitor;
        console.log(`Monitoring ${accounts.length} Twitter accounts...`);
        
        for (const account of accounts) {
            try {
                const data = await this.scrapeTwitterTimeline(account);
                this.analyzeTimelineData(account, data);
            } catch (error) {
                console.error(`Error monitoring account ${account}:`, error);
            }
        }
    }

    analyzeTimelineData(account, data) {
        // Extract relevant information from timeline data
        const tweets = data.tweets || [];
        const relevantTweets = tweets.filter(tweet => 
            this.isRelevantTweet(tweet)
        );

        if (relevantTweets.length > 0) {
            console.log(`Found ${relevantTweets.length} relevant tweets from ${account}`);
            
            // Save relevant tweets
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const outputPath = path.join(this.outputDir, `relevant-${account}-${timestamp}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(relevantTweets, null, 2));
            
            console.log(`Relevant tweets saved to: ${outputPath}`);
        }
    }

    isRelevantTweet(tweet) {
        // Define criteria for relevant tweets
        const keywords = ['ai', 'blockchain', 'crypto', 'defi', 'grin', 'trading'];
        const tweetText = tweet.text.toLowerCase();
        
        return keywords.some(keyword => tweetText.includes(keyword)) &&
               tweet.retweet_count > 0; // Has some engagement
    }
}

export const scraper = new Scraper();
