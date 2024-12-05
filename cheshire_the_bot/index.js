import { twitterBot } from './twitterBot.js';
import { config } from './config.js';
import { textGenerator } from './textGenerator.js';
import { imageGenerator } from './imageGenerator.js';
import { scraper } from './scraper.js';

async function startBot() {
    console.log('Starting Cheshire Cat Twitter Bot...');
    console.log('Configuration:', {
        imageGeneration: config.bot.imageGenerationEnabled ? 'Enabled' : 'Disabled',
        timelineScraping: config.bot.timelineScrapingEnabled ? 'Enabled' : 'Disabled',
        mentionResponse: config.bot.mentionResponseEnabled ? 'Enabled' : 'Disabled',
        tweetInterval: `${config.bot.tweetInterval / 1000} seconds`
    });

    let services = {
        llama: false,
        openai: false,
        firecrawl: false,
        twitter: false
    };

    try {
        // Verify Llama model
        try {
            await textGenerator.generateOriginalTweet('test');
            console.log('✅ Llama model connection verified');
            services.llama = true;
        } catch (error) {
            console.error('❌ Error connecting to Llama model:', error);
        }

        // Verify OpenAI connection if image generation is enabled
        if (config.bot.imageGenerationEnabled) {
            try {
                await imageGenerator.generateImage('test', { 
                    model: "dall-e-3",
                    size: "1024x1024" 
                });
                console.log('✅ OpenAI connection verified');
                services.openai = true;
            } catch (error) {
                console.error('❌ Error connecting to OpenAI:', error);
                config.bot.imageGenerationEnabled = false;
                console.log('Image generation has been disabled');
            }
        }

        // Verify Firecrawl API if timeline scraping is enabled
        if (config.bot.timelineScrapingEnabled) {
            try {
                await scraper.scrapeWebsite('https://example.com');
                console.log('✅ Firecrawl API connection verified');
                services.firecrawl = true;
            } catch (error) {
                console.error('❌ Error connecting to Firecrawl API:', error);
                config.bot.timelineScrapingEnabled = false;
                console.log('Timeline scraping has been disabled');
            }
        }

        // Initialize Twitter bot if at least text generation is working
        if (services.llama) {
            try {
                await twitterBot.initialize();
                console.log('✅ Twitter bot initialized successfully');
                services.twitter = true;
            } catch (error) {
                console.error('❌ Error initializing Twitter bot:', error);
                throw error; // Twitter is essential, so we'll still throw this error
            }
        } else {
            throw new Error('Text generation (Llama) is required for the bot to function');
        }

        console.log('\nService Status:');
        console.log('- Text Generation (Llama):', services.llama ? '✅ Active' : '❌ Failed');
        console.log('- Image Generation (OpenAI):', config.bot.imageGenerationEnabled ? (services.openai ? '✅ Active' : '❌ Failed') : '⚪ Disabled');
        console.log('- Timeline Scraping:', config.bot.timelineScrapingEnabled ? (services.firecrawl ? '✅ Active' : '❌ Failed') : '⚪ Disabled');
        console.log('- Twitter Bot:', services.twitter ? '✅ Active' : '❌ Failed');

    } catch (error) {
        console.error('Fatal error starting bot:', error);
        process.exit(1);
    }
}

// Handle shutdown
process.on('SIGINT', async () => {
    console.log('\nGracefully shutting down...');
    // Add any cleanup logic here
    process.exit();
});

// Start the bot
startBot();
