import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

async function checkBalance() {
    try {
        const connection = new Connection(process.env.HELIUS_RPC_URL || clusterApiUrl('devnet'));
        const publicKey = new PublicKey(process.env.SOLANA_WALLET_PUBLIC_KEY);
        
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;
        
        logger.info('Wallet Balance', {
            address: publicKey.toString(),
            balanceSOL: solBalance,
            balanceLamports: balance
        });

        return solBalance;
    } catch (error) {
        logger.error('Failed to check balance', error);
        throw error;
    }
}

// Run balance check
checkBalance()
    .then(balance => {
        if (balance < 0.1) {
            logger.warn('Low balance! Consider adding more SOL for minting NFTs');
            logger.info('Get devnet SOL at https://solfaucet.com');
        }
        process.exit(0);
    })
    .catch(error => {
        logger.error('Balance check failed', error);
        process.exit(1);
    });
