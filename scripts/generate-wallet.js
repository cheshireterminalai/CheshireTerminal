import bs58 from "bs58";

import { Keypair } from "@solana/web3.js";

// Generate new keypair
const keypair = Keypair.generate();

// Get public and private keys
const publicKey = keypair.publicKey.toString();
const privateKey = bs58.encode(keypair.secretKey);

console.log('\n=== New Solana Wallet Generated ===\n');
console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);
console.log('\n=== Instructions ===\n');
console.log('1. Save these keys in a secure location');
console.log('2. Fund your wallet using Solana CLI:');
console.log(`   solana airdrop 2 ${publicKey} --url https://api.devnet.solana.com`);
console.log('\n3. Update your .env file with these values:');
console.log('SOLANA_WALLET_PRIVATE_KEY=' + privateKey);
console.log('SOLANA_IDENTITY=' + publicKey);
console.log('\nMake sure to wait for the airdrop to complete before minting NFTs!\n');
