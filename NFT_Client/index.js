const express = require('express');
const path = require('path');
const databaseService = require('./services/database-service');
const solanaService = require('./services/solana-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Initialize services and start server
async function startServer() {
    try {
        // Initialize database connection
        await databaseService.initialize();
        console.log('Database connection established');

        // Start the server
        app.listen(PORT, () => {
            console.log(`NFT client server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
