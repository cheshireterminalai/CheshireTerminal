import fs from "fs";
import path from "path";

import * as anchor from "@project-serum/anchor";
import {
    AnchorProvider,
    Program,
} from "@project-serum/anchor";
import {
    Connection,
    PublicKey,
} from "@solana/web3.js";
import { config } from "./config.js";

class CheshireAgent {
    constructor() {
        this.localStorageDir = path.join(process.cwd(), 'data');
        this.config = config;
        this.connection = new Connection(process.env.SOLANA_RPC_URL);
        this.grinTokenMint = new PublicKey(process.env.GRIN_TOKEN_MINT);
        this.provider = null;
        this.initializeAgent();
    }

    async initializeAgent() {
        await this.initializeStorage();
        await this.initializeSolanaProvider();
        await this.testLLMConnections();
        console.log('Cheshire Agent initialized with LLM connections and Solana integration');
    }

    async testLLMConnections() {
        try {
            // Test LM Studio connection
            const lmStudioUrl = this.config.llm.providers.lmStudio.baseUrl;
            const lmStudioResponse = await fetch(`${lmStudioUrl}${this.config.llm.providers.lmStudio.endpoints.models}`);
            if (!lmStudioResponse.ok) {
                console.warn('Warning: Failed to connect to LM Studio');
            } else {
                console.log('Successfully connected to LM Studio server');
            }

            // Test Exo Labs connection
            const exoLabsUrl = this.config.llm.providers.exoLabs.baseUrl;
            const exoLabsResponse = await fetch(`${exoLabsUrl}${this.config.llm.providers.exoLabs.endpoints.chat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "test",
                    messages: [{ role: "user", content: "test" }]
                })
            });
            if (!exoLabsResponse.ok) {
                console.warn('Warning: Failed to connect to Exo Labs');
            } else {
                console.log('Successfully connected to Exo Labs server');
            }

        } catch (error) {
            console.error('Error testing LLM connections:', error);
            throw error;
        }
    }

    async initializeStorage() {
        const dirs = [
            'smart_contracts',
            'analysis_results',
            'deployments',
            'test_results'
        ];
        
        dirs.forEach(dir => {
            const dirPath = path.join(this.localStorageDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
    }

    async initializeSolanaProvider() {
        const wallet = anchor.Wallet.local();
        this.provider = new AnchorProvider(
            this.connection,
            wallet,
            AnchorProvider.defaultOptions()
        );
        anchor.setProvider(this.provider);
    }

    async queryLLM(prompt, systemPrompt = '', preferredProvider = 'exoLabs') {
        try {
            const provider = this.config.llm.providers[preferredProvider];
            if (!provider) {
                throw new Error(`Unknown provider: ${preferredProvider}`);
            }

            const response = await fetch(`${provider.baseUrl}${provider.endpoints.chat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: preferredProvider === 'lmStudio' ? this.config.llm.models.code : undefined,
                    messages: [
                        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: -1
                })
            });

            if (!response.ok) {
                // If primary provider fails, try fallback
                if (preferredProvider === 'exoLabs') {
                    console.log('Falling back to LM Studio...');
                    return this.queryLLM(prompt, systemPrompt, 'lmStudio');
                } else {
                    throw new Error(`LLM API error: ${response.statusText}`);
                }
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error(`Error querying LLM (${preferredProvider}):`, error);
            throw error;
        }
    }

    async generateSmartContract(specification) {
        try {
            const systemPrompt = `Generate a secure Solana smart contract in Rust that:
                1. Follows Solana program best practices
                2. Implements proper error handling
                3. Uses efficient data structures
                4. Includes comprehensive testing
                5. Has detailed documentation
                Specification: ${specification}`;

            const contractCode = await this.queryLLM(specification, systemPrompt);

            // Store generated contract
            const timestamp = new Date().toISOString();
            const contractPath = path.join(
                this.localStorageDir,
                'smart_contracts',
                `contract_${timestamp}.rs`
            );

            fs.writeFileSync(contractPath, contractCode);

            // Immediately analyze the generated contract
            const analysis = await this.analyzeSmartContract(contractCode);
            
            return {
                code: contractCode,
                analysis,
                path: contractPath,
                timestamp
            };
        } catch (error) {
            console.error('Error generating smart contract:', error);
            throw error;
        }
    }

    async analyzeSmartContract(code) {
        try {
            const systemPrompt = `Analyze this Solana smart contract for:
                1. Security vulnerabilities (including reentrancy, overflow)
                2. Gas optimization opportunities
                3. Solana-specific best practices
                4. Potential logical errors
                5. Account validation
                6. Proper PDA usage
                Code: ${code}`;

            const analysis = await this.queryLLM(code, systemPrompt);

            // Store analysis
            await this.storeAnalysis('smart_contract', {
                code,
                analysis,
                timestamp: new Date().toISOString()
            });

            return analysis;
        } catch (error) {
            console.error('Error analyzing smart contract:', error);
            throw error;
        }
    }

    async fixContractIssues(code, analysis) {
        try {
            const systemPrompt = `Fix the following issues in the Solana smart contract:
                Analysis: ${analysis}
                Original Code: ${code}
                Provide the corrected code with explanations for each fix.`;

            const fixedCode = await this.queryLLM(systemPrompt);

            // Verify fixes with another analysis
            const verificationAnalysis = await this.analyzeSmartContract(fixedCode);

            return {
                fixedCode,
                verificationAnalysis
            };
        } catch (error) {
            console.error('Error fixing contract issues:', error);
            throw error;
        }
    }

    async deployContract(programId, code, payerKeypair) {
        try {
            // Compile the program
            const bpfProgram = await this.compileSolanaProgram(code);
            
            // Deploy program to Solana
            const deployConfig = {
                connection: this.connection,
                payer: payerKeypair,
                program: bpfProgram,
                programId: new PublicKey(programId)
            };

            const deployment = await Program.deploy(deployConfig);
            
            // Store deployment info
            const deploymentInfo = {
                programId: programId.toString(),
                timestamp: new Date().toISOString(),
                transactionSignature: deployment.txSignature,
                slot: deployment.slot
            };

            await this.storeDeployment(deploymentInfo);

            return deploymentInfo;
        } catch (error) {
            console.error('Error deploying contract:', error);
            throw error;
        }
    }

    async verifyDeployment(programId) {
        try {
            const accountInfo = await this.connection.getAccountInfo(
                new PublicKey(programId)
            );

            if (!accountInfo) {
                throw new Error('Program not found on chain');
            }

            // Verify program using on-chain bytecode
            const verificationResult = await this.verifyProgramBytecode(
                programId,
                accountInfo.data
            );

            return verificationResult;
        } catch (error) {
            console.error('Error verifying deployment:', error);
            throw error;
        }
    }

    async analyzeTransaction(txSignature) {
        try {
            const systemPrompt = `Analyze this Solana transaction for:
                1. Transaction structure and accounts
                2. Instruction analysis
                3. Token transfers and state changes
                4. Gas usage and optimization opportunities
                Transaction: ${txSignature}`;

            const analysis = await this.queryLLM(txSignature, systemPrompt);
            return analysis;
        } catch (error) {
            console.error('Error analyzing transaction:', error);
            throw error;
        }
    }

    async storeAnalysis(type, data) {
        const filepath = path.join(
            this.localStorageDir,
            'analysis_results',
            `${type}_${new Date().toISOString()}.json`
        );
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        return data;
    }

    async storeDeployment(data) {
        const filepath = path.join(
            this.localStorageDir,
            'deployments',
            `deployment_${data.programId}_${data.timestamp}.json`
        );
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        return data;
    }

    async simulateTransaction(transaction) {
        try {
            const simulation = await this.connection.simulateTransaction(transaction);
            
            // Analyze simulation results
            const analysisPrompt = `Analyze this Solana transaction simulation:
                ${JSON.stringify(simulation, null, 2)}
                Provide insights on:
                1. Expected outcomes
                2. Potential issues
                3. Gas usage optimization
                4. Account state changes`;
            
            const analysis = await this.queryLLM(analysisPrompt);
            
            return {
                simulation,
                analysis
            };
        } catch (error) {
            console.error('Error simulating transaction:', error);
            throw error;
        }
    }

    async validateGrinBalance(walletAddress) {
        try {
            const tokenAccount = await this.connection.getTokenAccountsByOwner(
                new PublicKey(walletAddress),
                { mint: this.grinTokenMint }
            );
            
            // Implement your $GRIN token validation logic here
            return tokenAccount;
        } catch (error) {
            console.error('Error validating GRIN balance:', error);
            throw error;
        }
    }
}

export const cheshireAgent = new CheshireAgent();
