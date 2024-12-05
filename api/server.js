import "dotenv/config";

import cors from "cors";
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { artGenerator } from "../ai-art-generator.js";
import { agentService } from "../services/agent-service.js";
import { commandsService } from "../services/commands-service.js";
import { dashboardService } from "../services/dashboard-service.js";
import { solanaService } from "../services/solana-service.js";
import { imageProcessor } from "../utils/image-processor.js";
import { logger } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verify required environment variables
const requiredEnvVars = [
    'SOLANA_RPC_URL',
    'SOLANA_WALLET_PRIVATE_KEY',
    'SOLANA_IDENTITY',
    'SOLANA_GENESIS_HASH',
    'DB_USER',
    'DB_PASSWORD',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        logger.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the dashboard directory
app.use(express.static(path.join(__dirname, '../dashboard')));

// Serve the dashboard at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Terminal Command Endpoint
app.post('/api/terminal/command', async (req, res) => {
    try {
        const { command } = req.body;
        if (!command) {
            return res.status(400).json({ error: 'No command provided' });
        }

        const result = await commandsService.processCommand(command);
        
        // Log command and result to database
        await agentService.processTask(`Command executed: ${command}`, {
            type: 'command',
            result
        });

        res.json(result);
    } catch (error) {
        logger.error('Command processing failed:', error);
        res.status(500).json({ 
            type: 'error',
            message: error.message 
        });
    }
});

// Dashboard & NFT Endpoints
app.post('/api/collection/initialize', async (req, res) => {
    try {
        const collection = await dashboardService.initializeCollection(req.body);
        res.json(collection);
    } catch (error) {
        logger.error('Failed to initialize collection:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/nft/generate', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Process and store the image
        const imageResult = await imageProcessor.processImage(req.file.buffer);
        
        // Generate NFT data
        const nftData = await dashboardService.generateNFT(imageResult.url, JSON.parse(req.body.metadata || '{}'));

        res.json({
            success: true,
            nft: nftData,
            imageUrl: imageResult.url
        });
    } catch (error) {
        logger.error('Failed to generate NFT:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/nft/mint/:index', async (req, res) => {
    try {
        const nftData = dashboardService.currentCollection.items[parseInt(req.params.index)];
        if (!nftData) {
            return res.status(404).json({ error: 'NFT not found' });
        }

        const mintedNFT = await dashboardService.mintNFT(nftData);
        res.json(mintedNFT);
    } catch (error) {
        logger.error('Failed to mint NFT:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/collection/mint', async (req, res) => {
    try {
        const mintedNFTs = await dashboardService.mintCollection();
        res.json(mintedNFTs);
    } catch (error) {
        logger.error('Failed to mint collection:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collection/stats', async (req, res) => {
    try {
        const stats = await dashboardService.getCollectionStats();
        res.json(stats);
    } catch (error) {
        logger.error('Failed to get collection stats:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/collection/preview', (req, res) => {
    try {
        const preview = dashboardService.getCollectionPreview();
        res.json(preview);
    } catch (error) {
        logger.error('Failed to get collection preview:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/nft/verify/:mintAddress', async (req, res) => {
    try {
        const verification = await dashboardService.verifyCollectionNFT(req.params.mintAddress);
        res.json(verification);
    } catch (error) {
        logger.error('Failed to verify NFT:', error);
        res.status(500).json({ error: error.message });
    }
});

// Solana Endpoints
app.get('/api/solana/analyze-wallet/:address', async (req, res) => {
    try {
        const analysis = await solanaService.analyzeWallet(req.params.address);
        res.json(analysis);
    } catch (error) {
        logger.error('Failed to analyze wallet:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/solana/analyze-collection/:collection', async (req, res) => {
    try {
        const analysis = await solanaService.analyzeNFTCollection(req.params.collection);
        res.json(analysis);
    } catch (error) {
        logger.error('Failed to analyze collection:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/solana/transaction-history/:address', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const history = await solanaService.getTransactionHistory(req.params.address, limit);
        res.json(history);
    } catch (error) {
        logger.error('Failed to get transaction history:', error);
        res.status(500).json({ error: error.message });
    }
});

// AI Agent Endpoints
app.post('/api/agent/analyze', async (req, res) => {
    try {
        const { query, address } = req.body;
        
        const result = await agentService.processTask(query, {
            solanaAddress: address,
            type: 'analysis'
        });

        res.json(result);
    } catch (error) {
        logger.error('Failed to process analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/agent/generate-art', async (req, res) => {
    try {
        const prompt = artGenerator.generateArtPrompt();
        
        // Use agent to enhance the prompt
        const enhancedPrompt = await agentService.processTask(
            `Enhance this NFT art prompt: ${prompt.prompt}`,
            { originalPrompt: prompt }
        );

        res.json({
            ...prompt,
            enhancedPrompt: enhancedPrompt.response
        });
    } catch (error) {
        logger.error('Failed to generate art prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

// Memory and Trace Endpoints
app.get('/api/agent/memory', async (req, res) => {
    try {
        const memory = await agentService.getMemory();
        res.json(memory);
    } catch (error) {
        logger.error('Failed to get agent memory:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/agent/traces/:traceId', async (req, res) => {
    try {
        const traces = await agentService.getTraces(req.params.traceId);
        res.json(traces);
    } catch (error) {
        logger.error('Failed to get agent traces:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('API Error:', err);
    res.status(500).json({ error: err.message });
});

// Start server
const PORT = process.env.API_PORT || 3001; // Changed default port to 3001
app.listen(PORT, () => {
    logger.info(`API server running on port ${PORT}`);
    console.log(`Dashboard available at http://localhost:${PORT}`);
});
