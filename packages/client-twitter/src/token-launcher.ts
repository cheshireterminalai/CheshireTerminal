import { 
    Connection, 
    Keypair, 
    PublicKey,
    Transaction,
    sendAndConfirmTransaction
} from '@solana/web3.js';
import {
    createMint,
    getOrCreateAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';
import bs58 from 'bs58';

export class TokenLauncher {
    private connection: Connection;
    private keypair: Keypair;
    private metaplex: Metaplex;

    constructor(
        heliusRpcUrl: string,
        privateKeyBase58: string
    ) {
        this.connection = new Connection(heliusRpcUrl, 'confirmed');
        
        // Convert base58 private key to Uint8Array using bs58
        const privateKeyBytes = bs58.decode(privateKeyBase58);
        this.keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));
        
        this.metaplex = new Metaplex(this.connection);
        this.metaplex.identity().setDriver(this.keypair);
    }

    async launchToken(
        tokenName: string = "CHESHIRE",
        tokenSymbol: string = "CHES",
        tokenDecimals: number = 9,
        initialSupply: number = 1_000_000_000
    ) {
        try {
            console.log("🐱 Cheshire: Starting token launch process...");

            // Create mint account
            console.log("🐱 Creating mint account...");
            const mint = await createMint(
                this.connection,
                this.keypair,
                this.keypair.publicKey,
                this.keypair.publicKey,
                tokenDecimals,
                undefined,
                { commitment: 'finalized' },
                TOKEN_PROGRAM_ID
            );

            console.log(`🐱 Mint account created: ${mint.toBase58()}`);

            // Create token metadata using Metaplex
            console.log("🐱 Creating token metadata...");
            const { nft } = await this.metaplex.nfts().create({
                name: tokenName,
                symbol: tokenSymbol,
                uri: await this.uploadMetadata(tokenName, tokenSymbol),
                sellerFeeBasisPoints: 0,
            });

            console.log(`🐱 Token metadata created: ${nft.address.toBase58()}`);

            // Get associated token account
            console.log("🐱 Creating associated token account...");
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                this.keypair,
                mint,
                this.keypair.publicKey
            );

            // Mint initial supply
            console.log(`🐱 Minting initial supply of ${initialSupply} tokens...`);
            await mintTo(
                this.connection,
                this.keypair,
                mint,
                tokenAccount.address,
                this.keypair,
                initialSupply * (10 ** tokenDecimals)
            );

            console.log("🐱 Token launch complete!");
            return {
                mint: mint.toBase58(),
                tokenAccount: tokenAccount.address.toBase58(),
                owner: this.keypair.publicKey.toBase58(),
                metadata: nft.address.toBase58()
            };
        } catch (error) {
            console.error("🙀 Error launching token:", error);
            throw error;
        }
    }

    private async uploadMetadata(tokenName: string, tokenSymbol: string) {
        const metadata = {
            name: tokenName,
            symbol: tokenSymbol,
            description: "The official token of Cheshire, the Solana degen cat from the trenches",
            image: "https://your-image-url.com/cheshire.png", // Replace with actual image URL
            external_url: "https://your-website.com",
            attributes: [
                {
                    trait_type: "Category",
                    value: "Meme Token"
                },
                {
                    trait_type: "Type",
                    value: "Cat-themed"
                },
                {
                    trait_type: "Blockchain",
                    value: "Solana"
                }
            ],
            properties: {
                files: [
                    {
                        uri: "https://your-image-url.com/cheshire.png",
                        type: "image/png"
                    }
                ],
                category: "image",
                creators: [
                    {
                        address: this.keypair.publicKey.toBase58(),
                        share: 100
                    }
                ]
            }
        };

        // Upload to Arweave through Metaplex
        const { uri } = await this.metaplex.nfts().uploadMetadata(metadata);
        return uri;
    }

    async getTokenBalance(tokenAccount: PublicKey) {
        try {
            const balance = await this.connection.getTokenAccountBalance(tokenAccount);
            return balance.value.uiAmount;
        } catch (error) {
            console.error("🙀 Error getting token balance:", error);
            throw error;
        }
    }
}

// Export a function to create the token launcher
export function createTokenLauncher(heliusRpcUrl: string, privateKeyBase58: string) {
    return new TokenLauncher(heliusRpcUrl, privateKeyBase58);
}
