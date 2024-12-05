import { artGenerator } from '../ai-art-generator.js';
import { imageProcessor } from './image-processor.js';
import { solanaClient } from '../solana-client.js';
import { logger } from './logger.js';

// Default art styles and themes
const DEFAULT_STYLES = {
    cyberpunk: { used: 0, successful: 0, rating: 0.5 },
    vaporwave: { used: 0, successful: 0, rating: 0.5 },
    abstract: { used: 0, successful: 0, rating: 0.5 },
    surrealism: { used: 0, successful: 0, rating: 0.5 },
    pixelart: { used: 0, successful: 0, rating: 0.5 }
};

const DEFAULT_THEMES = {
    'cosmic exploration': { used: 0, successful: 0, rating: 0.5 },
    'digital consciousness': { used: 0, successful: 0, rating: 0.5 },
    'nature meets technology': { used: 0, successful: 0, rating: 0.5 },
    'ancient futures': { used: 0, successful: 0, rating: 0.5 },
    'quantum realms': { used: 0, successful: 0, rating: 0.5 },
    'bio-mechanical fusion': { used: 0, successful: 0, rating: 0.5 },
    'ethereal dimensions': { used: 0, successful: 0, rating: 0.5 },
    'cyber mythology': { used: 0, successful: 0, rating: 0.5 },
    'digital evolution': { used: 0, successful: 0, rating: 0.5 },
    'abstract emotions': { used: 0, successful: 0, rating: 0.5 }
};

class AutonomousAgent {
    constructor() {
        this.currentTask = null;
        this.generationHistory = [];
        this.preferences = {
            styles: new Map(Object.entries(DEFAULT_STYLES)),
            themes: new Map(Object.entries(DEFAULT_THEMES))
        };
    }

    // Initialize the agent
    async initialize() {
        try {
            logger.info('Initializing autonomous agent');
            await this.loadPreferences();
            return true;
        } catch (error) {
            logger.error('Failed to initialize agent', error);
            throw error;
        }
    }

    // Load preferences from previous runs
    async loadPreferences() {
        try {
            // Initialize with default preferences if none exist
            if (this.preferences.styles.size === 0) {
                this.preferences.styles = new Map(Object.entries(DEFAULT_STYLES));
            }

            if (this.preferences.themes.size === 0) {
                this.preferences.themes = new Map(Object.entries(DEFAULT_THEMES));
            }

            logger.debug('Preferences loaded', {
                styles: Object.fromEntries(this.preferences.styles),
                themes: Object.fromEntries(this.preferences.themes)
            });
        } catch (error) {
            logger.error('Failed to load preferences', error);
            throw error;
        }
    }

    // Select style based on success history and exploration
    selectStyle() {
        try {
            const styles = Array.from(this.preferences.styles.entries());
            
            // Exploration vs exploitation
            const exploreRandom = Math.random() < 0.2; // 20% chance to explore
            
            if (exploreRandom) {
                // Random exploration
                const randomStyle = styles[Math.floor(Math.random() * styles.length)];
                logger.info('Exploring new style', { style: randomStyle[0] });
                return randomStyle[0];
            }
            
            // Sort by rating and pick top style
            styles.sort((a, b) => b[1].rating - a[1].rating);
            logger.info('Selected style based on rating', { style: styles[0][0] });
            return styles[0][0];
        } catch (error) {
            logger.error('Failed to select style', error);
            throw error;
        }
    }

    // Select theme based on success history and exploration
    selectTheme() {
        try {
            const themes = Array.from(this.preferences.themes.entries());
            
            // Exploration vs exploitation
            const exploreRandom = Math.random() < 0.2;
            
            if (exploreRandom) {
                // Random exploration
                const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                logger.info('Exploring new theme', { theme: randomTheme[0] });
                return randomTheme[0];
            }
            
            // Sort by rating and pick top theme
            themes.sort((a, b) => b[1].rating - a[1].rating);
            logger.info('Selected theme based on rating', { theme: themes[0][0] });
            return themes[0][0];
        } catch (error) {
            logger.error('Failed to select theme', error);
            throw error;
        }
    }

    // Generate NFT autonomously
    async generateNFT() {
        try {
            logger.info('Starting autonomous NFT generation');
            this.currentTask = {
                startTime: Date.now(),
                status: 'started'
            };

            // Select style and theme
            const style = this.selectStyle();
            const theme = this.selectTheme();
            
            this.currentTask.style = style;
            this.currentTask.theme = theme;

            // Generate art prompt
            const artPrompt = await artGenerator.generateArtPrompt(style, theme);
            logger.info('Generated art prompt', artPrompt);

            // Generate metadata
            const metadata = artGenerator.generateMetadata(artPrompt);
            logger.info('Generated metadata', metadata);

            // Generate art
            const imageBuffer = await imageProcessor.generateArt(style, artPrompt.prompt);
            logger.info('Generated art');

            // Process image
            const processedImage = await imageProcessor.processImage(imageBuffer);
            logger.info('Processed image');

            // Save locally
            const timestamp = Date.now();
            const filename = `${timestamp}_${metadata.name.replace(/\s+/g, '_')}.png`;
            const savedPath = await imageProcessor.saveImage(processedImage, filename);
            logger.info('Saved image locally', { path: savedPath });

            // Upload and mint NFT
            const imageUrl = await solanaClient.uploadImage(processedImage);
            logger.info('Uploaded image', { url: imageUrl });

            const mintResult = await solanaClient.mintNFT(metadata, imageUrl);
            logger.info('Minted NFT', mintResult);

            // Update preferences based on success
            this.updatePreferences(style, theme, true);

            // Record in history
            this.generationHistory.push({
                timestamp,
                style,
                theme,
                metadata,
                imageUrl,
                mintResult,
                success: true
            });

            this.currentTask = {
                ...this.currentTask,
                endTime: Date.now(),
                status: 'completed',
                result: mintResult
            };

            return {
                success: true,
                style,
                theme,
                metadata,
                imageUrl,
                mintResult
            };
        } catch (error) {
            logger.error('Failed to generate NFT', error);
            
            // Update preferences based on failure
            if (this.currentTask) {
                this.updatePreferences(this.currentTask.style, this.currentTask.theme, false);
            }

            this.currentTask = {
                ...this.currentTask,
                endTime: Date.now(),
                status: 'failed',
                error: error.message
            };

            throw error;
        }
    }

    // Update preferences based on success/failure
    updatePreferences(style, theme, success) {
        try {
            // Update style preferences
            const styleStats = this.preferences.styles.get(style);
            if (styleStats) {
                styleStats.used++;
                if (success) styleStats.successful++;
                styleStats.rating = styleStats.successful / styleStats.used;
                this.preferences.styles.set(style, styleStats);
            }

            // Update theme preferences
            const themeStats = this.preferences.themes.get(theme);
            if (themeStats) {
                themeStats.used++;
                if (success) themeStats.successful++;
                themeStats.rating = themeStats.successful / themeStats.used;
                this.preferences.themes.set(theme, themeStats);
            }

            logger.debug('Updated preferences', {
                style: this.preferences.styles.get(style),
                theme: this.preferences.themes.get(theme)
            });
        } catch (error) {
            logger.error('Failed to update preferences', error);
            throw error;
        }
    }

    // Get agent status
    getStatus() {
        return {
            currentTask: this.currentTask,
            preferences: {
                styles: Object.fromEntries(this.preferences.styles),
                themes: Object.fromEntries(this.preferences.themes)
            },
            history: this.generationHistory
        };
    }

    // Get generation history
    getHistory() {
        return this.generationHistory;
    }

    // Clear history
    clearHistory() {
        this.generationHistory = [];
        logger.info('Cleared generation history');
    }
}

// Export singleton instance
export const autonomousAgent = new AutonomousAgent();
