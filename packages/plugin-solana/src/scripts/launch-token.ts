import { AnchorProvider } from "@coral-xyz/anchor";
import { Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { PumpFunSDK, CreateTokenMetadata } from "pumpdotfun-sdk";
import * as dotenv from "dotenv";
import { createAndBuyToken } from "../actions/pumpfun";
import bs58 from "bs58";

// Load environment variables
dotenv.config();

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function launchToken() {
    try {
        console.log("Starting token launch process...");

        // Validate environment variables
        if (!process.env.WALLET_PRIVATE_KEY) {
            throw new Error("WALLET_PRIVATE_KEY is required in .env file");
        }
        if (!process.env.RPC_URL) {
            throw new Error("RPC_URL is required in .env file");
        }

        console.log("Setting up connection to:", process.env.RPC_URL);

        // Setup connection with higher commitment and longer timeout
        const connection = new Connection(process.env.RPC_URL, {
            commitment: 'processed',
            confirmTransactionInitialTimeout: 180000, // 3 minutes
        });
        console.log("Connection established");

        // Wait a bit after establishing connection
        await sleep(2000);

        console.log("Decoding wallet private key...");
        const privateKeyBytes = bs58.decode(process.env.WALLET_PRIVATE_KEY);
        const wallet = new Wallet(Keypair.fromSecretKey(privateKeyBytes));
        console.log("Wallet public key:", wallet.publicKey.toBase58());

        // Create Anchor provider with lower commitment for faster processing
        console.log("Creating Anchor provider...");
        const provider = new AnchorProvider(connection, wallet, {
            commitment: "processed",
            preflightCommitment: "processed",
        });

        // Initialize SDK
        console.log("Initializing PumpFunSDK...");
        const sdk = new PumpFunSDK(provider);

        // Generate new mint keypair
        console.log("Generating mint keypair...");
        const mintKeypair = Keypair.generate();
        console.log("Mint public key:", mintKeypair.publicKey.toBase58());

        // Create empty blob for token image
        console.log("Creating token metadata...");
        const imageBlob = new Blob([], { type: 'image/png' });

        // Token metadata with Cheshire Cat theme
        const tokenMetadata: CreateTokenMetadata = {
            name: "Cheshire Grin", 
            symbol: "GRIN",    // Cheshire cat's iconic grin
            description: "We're all mad here! 😺 The mysterious Cheshire Cat token that may appear and disappear at will.", 
            file: imageBlob,
        };

        // Extremely high priority fee settings for better transaction success
        const priorityFee = {
            unitLimit: 50000000,  // 50M - Extremely high limit
            unitPrice: 50000,     // 50K - Extremely high price
        };

        console.log("Token Configuration:");
        console.log("- Name:", tokenMetadata.name);
        console.log("- Symbol:", tokenMetadata.symbol);
        console.log("- Description:", tokenMetadata.description);
        console.log("- Buy Amount: 1.0 SOL");
        console.log("- Priority Fee:", JSON.stringify(priorityFee));

        // Execute token creation and initial buy with retries
        console.log("\nExecuting token creation and initial buy...");
        const buyAmount = BigInt(1000000000); // 1.0 SOL in lamports

        let retries = 5;
        let lastError;
        let backoffTime = 15000; // Start with 15 second delay

        while (retries > 0) {
            try {
                console.log(`\nAttempt ${6 - retries} of 5...`);
                
                // Add a delay before each attempt
                if (6 - retries > 1) {
                    console.log(`Waiting ${backoffTime/1000} seconds before next attempt...`);
                    await sleep(backoffTime);
                }

                await createAndBuyToken({
                    deployer: wallet.payer,
                    mint: mintKeypair,
                    tokenMetadata,
                    buyAmountSol: buyAmount,
                    priorityFee,
                    allowOffCurve: false,
                    sdk,
                    connection,
                    slippage: "1500", // 15% slippage for better success rate
                });

                console.log("\n✨ Token launched successfully! ✨");
                console.log(`View your token at: https://pump.fun/${mintKeypair.publicKey.toBase58()}`);
                console.log(`Solscan: https://solscan.io/token/${mintKeypair.publicKey.toBase58()}`);
                return; // Success, exit the function
            } catch (error) {
                lastError = error;
                retries--;
                console.error("\nAttempt failed with error:", error.message);
                
                if (retries > 0) {
                    backoffTime *= 2; // Double the backoff time for next attempt
                }
            }
        }

        // If we get here, all retries failed
        throw lastError;

    } catch (error) {
        console.error("\n❌ Error during token launch:");
        if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Stack trace:", error.stack);
        } else {
            console.error("Unknown error:", error);
        }
        throw error;
    }
}

// Run the launch function
console.log("🚀 Starting token launch script...\n");
launchToken().catch((error) => {
    console.error("\n💥 Fatal error in launch script:");
    console.error(error);
    process.exit(1);
});
