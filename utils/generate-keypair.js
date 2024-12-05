import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

// Generate a new keypair
const keypair = Keypair.generate();

// Get the private key in base58 format
const privateKey = bs58.encode(keypair.secretKey);
const publicKey = keypair.publicKey.toString();

console.log('Generated Solana Keypair:');
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);
console.log('\nUpdate your .env file with these values:');
console.log(`SOLANA_WALLET_PRIVATE_KEY=${privateKey}`);
console.log(`SOLANA_WALLET_PUBLIC_KEY=${publicKey}`);
