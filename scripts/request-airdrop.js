import bs58 from "bs58";
import dotenv from "dotenv";

import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";

// Load environment variables
dotenv.config();

async function requestAirdrop() {
    try {
        // Initialize connection
        const connection = new Connection(process.env.SOLANA_RPC_URL, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000
        });

        // Get wallet from private key
        const privateKey = process.env.SOLANA_WALLET_PRIVATE_KEY;
        const secretKey = bs58.decode(privateKey);
        const wallet = Keypair.fromSecretKey(secretKey);

        console.log('\n=== Requesting SOL Airdrop ===\n');
        console.log('Wallet Address:', wallet.publicKey.toString());

        // Check initial balance
        const initialBalance = await connection.getBalance(wallet.publicKey);
        console.log('\nInitial balance:', initialBalance / LAMPORTS_PER_SOL, 'SOL');

        // Request multiple smaller airdrops
        console.log('\nRequesting airdrops...');
        
        const airdropAmount = LAMPORTS_PER_SOL; // 1 SOL per airdrop
        const numAirdrops = 2; // Request 2 airdrops

        for (let i = 0; i < numAirdrops; i++) {
            try {
                console.log(`\nRequesting airdrop ${i + 1}/${numAirdrops}...`);
                const signature = await connection.requestAirdrop(
                    wallet.publicKey,
                    airdropAmount
                );

                // Wait for confirmation
                console.log('Confirming transaction...');
                const confirmation = await connection.confirmTransaction(signature, 'confirmed');
                
                if (confirmation.value.err) {
                    throw new Error(`Transaction failed: ${confirmation.value.err}`);
                }

                // Check balance after each airdrop
                const currentBalance = await connection.getBalance(wallet.publicKey);
                console.log(`Balance after airdrop ${i + 1}: ${currentBalance / LAMPORTS_PER_SOL} SOL`);

                // Wait between airdrops
                if (i < numAirdrops - 1) {
                    console.log('Waiting before next airdrop...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (error) {
                console.error(`Error in airdrop ${i + 1}:`, error.message);
                continue;
            }
        }

        // Final balance check
        const finalBalance = await connection.getBalance(wallet.publicKey);
        console.log('\nFinal balance:', finalBalance / LAMPORTS_PER_SOL, 'SOL');

        if (finalBalance > initialBalance) {
            console.log('\nAirdrop process completed successfully! ✨\n');
        } else {
            console.log('\nWarning: Balance did not increase. You may need to try again later.\n');
        }

    } catch (error) {
        console.error('\nError in airdrop process:', error.message);
        process.exit(1);
    }
}

// Run the airdrop request
requestAirdrop();
