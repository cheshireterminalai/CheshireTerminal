import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { autonomousAgent } from './utils/autonomous-agent.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Express app setup
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
});

// Serve static files from root directory
app.use(express.static(__dirname));

// Serve static files from public directory
app.use('/public', express.static(join(__dirname, 'public')));

// Serve generated files
app.use('/generated', express.static(join(__dirname, 'generated')));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// WebSocket connections
const clients = new Set();

// Broadcast to all connected clients
function broadcast(message) {
    clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify(message));
        }
    });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
    clients.add(ws);
    logger.info('New WebSocket connection');

    // Send initial state
    ws.send(JSON.stringify({
        type: 'status',
        data: autonomousAgent.getStatus()
    }));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            logger.debug('Received WebSocket message', data);

            switch (data.type) {
                case 'generate':
                    handleGeneration(ws);
                    break;
                case 'status':
                    ws.send(JSON.stringify({
                        type: 'status',
                        data: autonomousAgent.getStatus()
                    }));
                    break;
                default:
                    logger.warn('Unknown message type', data);
            }
        } catch (error) {
            logger.error('WebSocket message error', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        logger.info('Client disconnected');
    });
});

// Handle NFT generation
async function handleGeneration(ws) {
    try {
        // Start generation process
        broadcast({
            type: 'generation_start',
            timestamp: Date.now()
        });

        const result = await autonomousAgent.generateNFT();

        // Send success response
        broadcast({
            type: 'generation_complete',
            data: result,
            timestamp: Date.now()
        });
    } catch (error) {
        logger.error('Generation error', error);
        broadcast({
            type: 'generation_error',
            error: error.message,
            timestamp: Date.now()
        });
    }
}

// API Routes

// Get agent status
app.get('/api/status', (req, res) => {
    try {
        const status = autonomousAgent.getStatus();
        res.json(status);
    } catch (error) {
        logger.error('Status request error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get generation history
app.get('/api/history', (req, res) => {
    try {
        const history = autonomousAgent.getHistory();
        res.json(history);
    } catch (error) {
        logger.error('History request error', error);
        res.status(500).json({ error: error.message });
    }
});

// Start NFT generation
app.post('/api/generate', async (req, res) => {
    try {
        const result = await autonomousAgent.generateNFT();
        res.json(result);
    } catch (error) {
        logger.error('Generation request error', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear generation history
app.post('/api/clear-history', (req, res) => {
    try {
        autonomousAgent.clearHistory();
        res.json({ success: true });
    } catch (error) {
        logger.error('Clear history request error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get logs
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await logger.getLogs();
        res.json({ logs });
    } catch (error) {
        logger.error('Logs request error', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear logs
app.post('/api/clear-logs', async (req, res) => {
    try {
        await logger.clearLogs();
        res.json({ success: true });
    } catch (error) {
        logger.error('Clear logs request error', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error', err);
    res.status(500).json({ error: err.message });
});

// Find available port
async function findAvailablePort(startPort) {
    return new Promise((resolve, reject) => {
        const testServer = createServer();
        testServer.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                testServer.listen(startPort + 1);
            } else {
                reject(err);
            }
        });
        testServer.on('listening', () => {
            const port = testServer.address().port;
            testServer.close(() => resolve(port));
        });
        testServer.listen(startPort);
    });
}

// Initialize and start server
async function startServer() {
    try {
        // Create required directories
        const dirs = ['generated', 'generated/images', 'generated/metadata', 'generated/logs', 'public/js'];
        for (const dir of dirs) {
            const dirPath = join(__dirname, dir);
            try {
                await fs.mkdir(dirPath, { recursive: true });
                logger.info(`Created directory: ${dir}`);
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }

        // Initialize autonomous agent
        await autonomousAgent.initialize();
        logger.info('Autonomous agent initialized');

        // Find available port
        const port = await findAvailablePort(3000);
        
        // Start server
        server.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            logger.info(`Access the application at http://localhost:${port}`);
            logger.info(`Serving files from: ${__dirname}`);
        });

        // Handle server errors
        server.on('error', (error) => {
            logger.error('Server error:', error);
            if (error.code === 'EADDRINUSE') {
                logger.info('Port in use, trying another port...');
                setTimeout(() => {
                    server.close();
                    server.listen(port + 1);
                }, 1000);
            }
        });
    } catch (error) {
        logger.error('Server startup error', error);
        process.exit(1);
    }
}

// Start the server
startServer();

// Handle process termination
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    if (error.code !== 'EADDRINUSE') {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
});
