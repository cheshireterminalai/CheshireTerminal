import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import neuralAnalysisService from "./neural-analysis-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

class AIService {
    constructor() {
        this.localApiUrl = process.env.AI_LOCAL_MODEL_URL || "http://192.168.1.206:11439/v1/chat/completions";
        this.localModel = process.env.AI_LOCAL_MODEL || "local-model";
        this.characters = {};
        this.initialized = false;
        this.fallbackToOpenRouter = true;
    }

    async loadCharacterFile(name) {
        try {
            const characterPath = path.join(__dirname, '..', 'characters', name);
            const characterData = await fs.readFile(characterPath, 'utf8');
            return JSON.parse(characterData);
        } catch (error) {
            console.error(`Failed to load character file ${name}:`, error);
            throw error;
        }
    }

    async checkLMStudioConnection() {
        try {
            const modelsUrl = this.localApiUrl.replace('/chat/completions', '/models');
            const response = await fetch(modelsUrl);
            if (!response.ok) throw new Error(`LM Studio server responded with status: ${response.status}`);
            const data = await response.json();
            console.log('Available models:', data);
            return true;
        } catch (error) {
            console.warn('LM Studio server not available:', error.message);
            return false;
        }
    }

    async initialize() {
        try {
            this.characters.coder = await this.loadCharacterFile('cheshcoder.json');
            this.characters.wallStreet = await this.loadCharacterFile('Cheshireofwallstreet');
            
            const lmStudioAvailable = await this.checkLMStudioConnection();
            if (!lmStudioAvailable && !this.fallbackToOpenRouter) {
                throw new Error('LM Studio server is not available and fallback is disabled');
            }

            if (lmStudioAvailable) {
                const response = await fetch(this.localApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: this.localModel,
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: "Test connection" }
                        ],
                        temperature: 0.7,
                        max_tokens: 1000,
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Local API responded with status: ${response.status}, message: ${errorText}`);
                }

                console.log("Local LM Studio connection initialized successfully");
            } else {
                console.log("Falling back to OpenRouter API");
            }

            this.initialized = true;
        } catch (error) {
            console.error("Failed to initialize AI service:", error);
            throw error;
        }
    }

    _getSystemPrompt(type, character) {
        const basePrompt = {
            code: "You are a coding assistant. Focus on writing clean, efficient code with proper error handling.",
            analysis: "You are a code analysis expert. Focus on security, performance, and best practices.",
            contract: "You are a smart contract expert. Focus on security and gas optimization.",
            token_analysis: "You are a market analyst. Focus on token metrics and market trends.",
            chat: "You are a helpful assistant with expertise in blockchain and finance."
        }[type] || "You are a helpful assistant.";

        // Add character-specific traits if available, but keep it concise
        if (character?.style?.all?.length > 0) {
            return `${basePrompt} Style: ${character.style.all[0]}`;
        }

        return basePrompt;
    }

    async generateResponse(message, type = 'chat') {
        if (!this.initialized) {
            return "Service not initialized. Please try again later.";
        }

        try {
            const character = this.characters.wallStreet;
            const systemPrompt = this._getSystemPrompt(type, character);

            let apiUrl = this.localApiUrl;
            let headers = { 'Content-Type': 'application/json' };
            let model = this.localModel;

            if (!await this.checkLMStudioConnection() && this.fallbackToOpenRouter) {
                apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
                headers['Authorization'] = `Bearer ${process.env.OPEN_ROUTER_API_KEY}`;
                model = process.env.OPEN_ROUTER_MODEL;
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API responded with status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            
            const analysis = await neuralAnalysisService.analyzeResponse(content, { type, message });
            console.log('Neural Analysis Results:', {
                patterns: analysis.patterns,
                coherenceScore: analysis.coherenceScore,
                metrics: analysis.metrics
            });

            return content;
        } catch (error) {
            console.error("Error generating AI response:", error);
            return "An error occurred. Please try again later.";
        }
    }

    async getResponseWithAnalysis(message, type = 'chat') {
        const response = await this.generateResponse(message, type);
        const analysis = await neuralAnalysisService.analyzeResponse(response, { type, message });
        
        return {
            content: response,
            analysis: {
                patterns: analysis.patterns,
                metrics: analysis.metrics,
                coherenceScore: analysis.coherenceScore,
                temporalDynamics: analysis.temporalDynamics
            }
        };
    }

    async answerCodingQuestion(question) {
        return this.getResponseWithAnalysis(question, 'code');
    }

    async analyzeSolanaCode(code) {
        return this.getResponseWithAnalysis(code, 'analysis');
    }

    async generateSolanaContract(requirements) {
        return this.getResponseWithAnalysis(requirements, 'contract');
    }

    async analyzeToken(tokenData) {
        return this.getResponseWithAnalysis(JSON.stringify(tokenData, null, 2), 'token_analysis');
    }
}

export default new AIService();
