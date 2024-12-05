import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import cors from 'cors';
import { artGenerator } from '../ai-art-generator.js';
import { imageProcessor } from '../utils/image-processor.js';
import { nftMinter } from '../utils/nft-minter.js';
import { logger } from '../utils/logger.js';
import { storageManager } from '../utils/storage-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    serveClient: true
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/socket.io', express.static(join(__dirname, '../node_modules/socket.io/client-dist')));

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Store active generation processes
const activeProcesses = new Map();

// API Endpoints
app.post('/api/store-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const metadata = JSON.parse(req.body.metadata);
        
        // Process and store the image
        const imageResult = await imageProcessor.processImage(req.file.buffer);
        
        // Store metadata
        const storedMetadata = await storageManager.storeMetadata({
            ...metadata,
            imageUrl: imageResult.url,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            imageUrl: imageResult.url,
            metadata: storedMetadata
        });

    } catch (error) {
        logger.error('Error storing image:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Handle start generation request
    socket.on('start', async () => {
        try {
            // Start the generation process
            const processId = socket.id;
            activeProcesses.set(processId, true);

            // Update progress
            socket.emit('stage', { stage: 'Generating Art Prompt' });
            socket.emit('progress', { progress: 10 });

            // Generate art prompt
            const artPrompt = artGenerator.generateArtPrompt();
            socket.emit('prompt', { prompt: artPrompt.prompt });
            socket.emit('progress', { progress: 20 });

            // Generate image
            socket.emit('stage', { stage: 'Generating Image' });
            socket.emit('progress', { progress: 30 });

            const imageResult = await imageProcessor.generateArt(artPrompt.style, artPrompt.prompt);
            socket.emit('image', { url: imageResult.cloudinary.url });
            socket.emit('progress', { progress: 60 });

            // Check if process was stopped
            if (!activeProcesses.get(processId)) return;

            // Prepare for minting
            socket.emit('stage', { stage: 'Preparing NFT Metadata' });
            socket.emit('progress', { progress: 70 });

            // Generate metadata
            const metadata = await artGenerator.generateMetadata(artPrompt, imageResult);
            socket.emit('progress', { progress: 80 });

            // Check if process was stopped
            if (!activeProcesses.get(processId)) return;

            // Mint NFT
            socket.emit('stage', { stage: 'Minting NFT' });
            socket.emit('progress', { progress: 90 });

            const mintResult = await nftMinter.mintNFT(
                imageResult.buffer,
                metadata.name,
                metadata.description,
                metadata.attributes
            );

            // Send final NFT details
            socket.emit('nft', {
                mintAddress: mintResult.mint,
                transactionUrl: `https://explorer.solana.com/address/${mintResult.mint}`,
                metadataUrl: mintResult.metadataUrl
            });

            socket.emit('stage', { stage: 'Complete' });
            socket.emit('progress', { progress: 100 });

            // Clean up
            activeProcesses.delete(processId);

        } catch (error) {
            logger.error('Generation process failed', error);
            socket.emit('console', { message: `Error: ${error.message}` });
            socket.emit('stage', { stage: 'Error' });
            activeProcesses.delete(socket.id);
        }
    });

    // Handle stop request
    socket.on('stop', () => {
        activeProcesses.delete(socket.id);
        socket.emit('stage', { stage: 'Stopped' });
        socket.emit('console', { message: 'Generation process stopped' });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        activeProcesses.delete(socket.id);
        logger.info('Client disconnected', { socketId: socket.id });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.DASHBOARD_PORT || 3003;
httpServer.listen(PORT, () => {
    logger.info(`Dashboard server running on port ${PORT}`);
    console.log(`Dashboard available at http://localhost:${PORT}`);
});
