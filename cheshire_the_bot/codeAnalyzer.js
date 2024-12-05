import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';

class CodeAnalyzer {
    constructor() {
        this.outputDir = path.join(config.outputDir, 'code-analysis');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        // Headers for API requests
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // Base URL for LM Studio
        this.baseUrl = config.llm.baseUrl;
    }

    async analyzeCode(code, language = 'javascript') {
        try {
            const response = await fetch(`${this.baseUrl}${config.llm.endpoints.chat}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: 'llama2',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert code analyzer. Analyze the provided code for patterns, potential issues, and suggest improvements.'
                        },
                        {
                            role: 'user',
                            content: `Please analyze this ${language} code:\n\n${code}`
                        }
                    ],
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API request failed: ${response.statusText}\n${errorData}`);
            }

            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from API');
            }

            const analysis = data.choices[0].message.content;
            this.saveAnalysis(code, analysis, 'code-analysis');
            return analysis;

        } catch (error) {
            console.error('Error analyzing code:', error);
            throw error;
        }
    }

    async generateCode(prompt, prefix = '', suffix = '') {
        try {
            const response = await fetch(`${this.baseUrl}${config.llm.endpoints.completions}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: 'llama2',
                    prompt: `${prefix}\n\nComplete this code: ${prompt}\n\n${suffix}`,
                    max_tokens: 500,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API request failed: ${response.statusText}\n${errorData}`);
            }

            const data = await response.json();
            if (!data.choices?.[0]?.text) {
                throw new Error('Invalid response format from API');
            }

            const generatedCode = data.choices[0].text;
            this.saveAnalysis(`${prompt}\nPrefix: ${prefix}\nSuffix: ${suffix}`, generatedCode, 'code-generation');
            return generatedCode;

        } catch (error) {
            console.error('Error generating code:', error);
            throw error;
        }
    }

    async generateCodeWithChat(prompt) {
        try {
            const response = await fetch(`${this.baseUrl}${config.llm.endpoints.chat}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: 'llama2',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert programmer. Generate clean, efficient, and well-documented code.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API request failed: ${response.statusText}\n${errorData}`);
            }

            const data = await response.json();
            if (!data.choices?.[0]?.message?.content) {
                throw new Error('Invalid response format from API');
            }

            const generatedCode = data.choices[0].message.content;
            this.saveAnalysis(prompt, generatedCode, 'code-generation-chat');
            return generatedCode;

        } catch (error) {
            console.error('Error generating code with chat:', error);
            throw error;
        }
    }

    async getAvailableModels() {
        try {
            const response = await fetch(`${this.baseUrl}${config.llm.endpoints.models}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API request failed: ${response.statusText}\n${errorData}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Error getting available models:', error);
            throw error;
        }
    }

    saveAnalysis(input, output, type) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(this.outputDir, `${type}-${timestamp}.txt`);
        
        const content = `Input:\n${input}\n\nOutput:\n${output}`;
        fs.writeFileSync(outputPath, content);
        
        console.log(`Analysis saved to: ${outputPath}`);
    }
}

export const codeAnalyzer = new CodeAnalyzer();
