import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import aiService from "./services/ai-service.js";
import imageGenerationService from "./services/image-generation-service.js";
import tokenAnalysisService from "./services/token-analysis-service.js";
import tradingService from "./services/trading-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dashboard')));
app.use('/public', express.static(path.join(__dirname, 'dashboard/public')));
app.use('/generated', express.static(path.join(__dirname, 'generated')));

// Initialize services
async function initializeServices() {
    try {
        try {
            await aiService.initialize();
            console.log('AI service initialized');
        } catch (aiError) {
            console.warn('Warning: AI model initialization failed:', aiError.message);
            console.log('Continuing without AI capabilities');
        }
        
        // Trading service will initialize its own WebSocket server
        console.log('Trading service initialized');
    } catch (error) {
        console.error('Error initializing services:', error);
        // Don't exit on initialization error, continue with limited functionality
        console.log('Some services failed to initialize. Continuing with limited functionality.');
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard/index.html'));
});

// Command handling endpoint
app.post('/api/command', async (req, res) => {
    try {
        const { command } = req.body;
        let response;

        switch (command) {
            case '1':
                response = { type: 'nft', message: 'NFT generation form ready' };
                break;
            case '5':
                response = { type: 'chat', message: 'Chat initialized' };
                break;
            case '6':
                response = { type: 'coding', message: 'Coding assistant ready' };
                break;
            case '7':
                response = { type: 'analysis', message: 'Code analysis ready' };
                break;
            case '8':
                response = { type: 'contract', message: 'Contract generator ready' };
                break;
            case '9':
                response = { type: 'token', message: 'Token analysis ready' };
                break;
            case '10':
                response = { type: 'chart', message: 'Chart analysis ready' };
                break;
            default:
                response = { type: 'error', message: 'Invalid command' };
        }

        res.json(response);
    } catch (error) {
        console.error('Error handling command:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const response = await aiService.generateResponse(req.body.message, req.body.type);
        res.json({ response });
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(503).json({ 
            error: "AI service unavailable",
            message: "The AI service is currently unavailable. Please try again later."
        });
    }
});

// Token analysis endpoint
app.post('/api/analyze-token', async (req, res) => {
    try {
        const analysis = await tokenAnalysisService.getCompleteTokenAnalysis(req.body.tokenAddress);
        res.json(analysis);
    } catch (error) {
        console.error('Error in token analysis endpoint:', error);
        res.status(500).json({ error: error.message });
    }
});

// Code analysis endpoint
app.post('/api/analyze-code', async (req, res) => {
    try {
        const analysis = await aiService.analyzeSolanaCode(req.body.code);
        res.json({ analysis });
    } catch (error) {
        console.error('Error in code analysis endpoint:', error);
        res.status(503).json({ 
            error: "AI service unavailable",
            message: "The code analysis service is currently unavailable. Please try again later."
        });
    }
});

// Contract generation endpoint
app.post('/api/generate-contract', async (req, res) => {
    try {
        const contract = await aiService.generateSolanaContract(req.body.requirements);
        res.json({ contract });
    } catch (error) {
        console.error('Error in contract generation endpoint:', error);
        res.status(503).json({ 
            error: "AI service unavailable",
            message: "The contract generation service is currently unavailable. Please try again later."
        });
    }
});

// Image generation endpoint
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, aspectRatio, count } = req.body;

        if (count && count > 1) {
            // Generate multiple images
            const prompts = Array(count).fill(prompt);
            const results = await imageGenerationService.generateBatch(prompts, { aspectRatio });
            res.json({ results });
        } else {
            // Generate single image
            const result = await imageGenerationService.generateImage({ prompt, aspectRatio });
            res.json(result);
        }
    } catch (error) {
        console.error('Error in image generation endpoint:', error);
        res.status(500).json({ 
            error: "Image Generation Failed",
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred. Please try again later.'
    });
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
    console.log('\nReceived shutdown signal');
    
    // Stop the trading service
    tradingService.stop();
    
    // Close the Express server
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
}

// Start the server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    initializeServices();
});

export default app;
