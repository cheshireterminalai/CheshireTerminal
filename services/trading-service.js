import {
    dirname,
    join,
} from "path";
import { fileURLToPath } from "url";
import {
    WebSocket,
    WebSocketServer,
} from "ws";

import aiService from "./ai-service.js";
import tokenAnalysisService from "./token-analysis-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import trading bot from compiled JavaScript
const tradingBotPath = join(__dirname, '../../trading/dist/services/trading-bot.js');
let tradingBot;

try {
    const module = await import(tradingBotPath);
    tradingBot = module.default; // Use the default export
} catch (error) {
    console.error('Error importing trading bot:', error);
    process.exit(1);
}

class TradingService {
    constructor() {
        this.tradingBot = tradingBot;
        this.wss = null;
        this.monitoredTokens = new Set();
        this.initialize();
    }

    async initialize() {
        // Initialize WebSocket server
        this.wss = new WebSocketServer({ port: process.env.WS_PORT || 8080 });
        
        // Set up WebSocket connection handling
        this.wss.on('connection', (ws) => {
            console.log('Client connected to trading service');

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleClientMessage(ws, data);
                } catch (error) {
                    console.error('Error handling client message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
        });

        // Set up trading bot signal handlers
        this.tradingBot.on('buySignal', async (signal) => {
            await this.handleTradingSignal('BUY', signal);
        });

        this.tradingBot.on('sellSignal', async (signal) => {
            await this.handleTradingSignal('SELL', signal);
        });

        await this.tradingBot.start();
    }

    async handleClientMessage(ws, message) {
        switch (message.type) {
            case 'analyze_token':
                await this.analyzeToken(ws, message.tokenAddress);
                break;

            case 'monitor_token':
                await this.startMonitoringToken(ws, message.tokenAddress);
                break;

            case 'stop_monitoring':
                this.stopMonitoringToken(message.tokenAddress);
                break;

            case 'chat_query':
                await this.handleChatQuery(ws, message.query, message.tokenAddress);
                break;

            default:
                throw new Error('Unknown message type');
        }
    }

    async analyzeToken(ws, tokenAddress) {
        try {
            // Get token analysis from both services
            const [tradingAnalysis, tokenAnalysis] = await Promise.all([
                this.tradingBot.analyzeToken(tokenAddress),
                tokenAnalysisService.getCompleteTokenAnalysis(tokenAddress)
            ]);

            // Combine analyses for AI processing
            const combinedData = {
                tradingAnalysis,
                tokenAnalysis: tokenAnalysis.rawData,
                signals: this.tradingBot.getSignalHistory(tokenAddress)
            };

            // Get AI insights
            const aiAnalysis = await aiService.analyzeToken(combinedData);

            // Send complete analysis to client
            ws.send(JSON.stringify({
                type: 'token_analysis',
                data: {
                    tokenAddress,
                    tradingAnalysis,
                    tokenAnalysis: tokenAnalysis.rawData,
                    aiAnalysis,
                    signals: this.tradingBot.getSignalHistory(tokenAddress)
                }
            }));

        } catch (error) {
            console.error('Error analyzing token:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    }

    async startMonitoringToken(ws, tokenAddress) {
        if (!this.monitoredTokens.has(tokenAddress)) {
            await this.tradingBot.monitorToken(tokenAddress);
            this.monitoredTokens.add(tokenAddress);
        }

        ws.send(JSON.stringify({
            type: 'monitoring_started',
            tokenAddress
        }));
    }

    stopMonitoringToken(tokenAddress) {
        if (this.monitoredTokens.has(tokenAddress)) {
            this.tradingBot.stopMonitoringToken(tokenAddress);
            this.monitoredTokens.delete(tokenAddress);
        }
    }

    async handleTradingSignal(type, signal) {
        try {
            // Get additional analysis for the signal
            const tokenAnalysis = await tokenAnalysisService.getCompleteTokenAnalysis(signal.tokenAddress);
            
            // Get AI insights specifically for this signal
            const aiAnalysis = await aiService.analyzeToken({
                signal,
                tokenAnalysis: tokenAnalysis.rawData
            });

            // Broadcast to all connected clients
            this.broadcast({
                type: 'trading_signal',
                data: {
                    signalType: type,
                    signal,
                    tokenAnalysis: tokenAnalysis.rawData,
                    aiAnalysis
                }
            });

        } catch (error) {
            console.error('Error handling trading signal:', error);
        }
    }

    async handleChatQuery(ws, query, tokenAddress) {
        try {
            // Get latest token data
            const [tradingAnalysis, tokenAnalysis] = await Promise.all([
                this.tradingBot.analyzeToken(tokenAddress),
                tokenAnalysisService.getCompleteTokenAnalysis(tokenAddress)
            ]);

            // Prepare context for AI
            const context = {
                query,
                tokenAddress,
                tradingAnalysis,
                tokenAnalysis: tokenAnalysis.rawData,
                signals: this.tradingBot.getSignalHistory(tokenAddress)
            };

            // Get AI response
            const response = await aiService.generateResponse(
                JSON.stringify(context),
                'token_analysis'
            );

            // Send response to client
            ws.send(JSON.stringify({
                type: 'chat_response',
                data: {
                    query,
                    response,
                    context: {
                        tradingAnalysis,
                        tokenAnalysis: tokenAnalysis.rawData
                    }
                }
            }));

        } catch (error) {
            console.error('Error handling chat query:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    }

    broadcast(message) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }

    stop() {
        if (this.wss) {
            this.wss.close();
        }
        this.tradingBot.stop();
    }
}

export default new TradingService();
