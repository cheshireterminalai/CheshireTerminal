import bs58 from "bs58";

import {
    keypairIdentity,
    Metaplex,
    toBigNumber,
} from "@metaplex-foundation/js";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";

import { logger } from "../utils/logger.js";

class BlockchainService {
    constructor() {
        // Initialize connection to local validator
        const rpcUrl = process.env.SOLANA_RPC_URL.startsWith('http') 
            ? process.env.SOLANA_RPC_URL 
            : `http://${process.env.SOLANA_RPC_URL}`;
            
        this.connection = new Connection(rpcUrl, 'confirmed');
        
        // Initialize wallet from private key
        const privateKeyBytes = bs58.decode(process.env.SOLANA_WALLET_PRIVATE_KEY);
        this.wallet = Keypair.fromSecretKey(privateKeyBytes);
        
        // Initialize Metaplex
        this.metaplex = Metaplex.make(this.connection)
            .use(keypairIdentity(this.wallet));

        this.validatorIdentity = new PublicKey(process.env.SOLANA_IDENTITY);
        this.genesisHash = process.env.SOLANA_GENESIS_HASH;

        logger.info('Blockchain service initialized', {
            endpoint: rpcUrl,
            validatorIdentity: this.validatorIdentity.toString(),
            walletPublicKey: this.wallet.publicKey.toString()
        });
    }

    async getValidatorInfo() {
        try {
            const version = await this.connection.getVersion();
            const slotInfo = await this.connection.getSlot();
            const blockHeight = await this.connection.getBlockHeight();
            const supply = await this.connection.getSupply();

            return {
                version,
                slotInfo,
                blockHeight,
                supply: supply.value,
                identity: this.validatorIdentity.toString(),
                genesisHash: this.genesisHash
            };
        } catch (error) {
            logger.error('Failed to get validator info:', error);
            throw error;
        }
    }

    async mintNFT(metadata) {
        try {
            logger.info('Starting NFT mint process', { metadata });

            // Upload metadata
            const { uri } = await this.metaplex.nfts().uploadMetadata({
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                attributes: metadata.attributes,
                properties: {
                    files: [
                        {
                            uri: metadata.image,
                            type: 'image/png'
                        }
                    ]
                }
            });

            // Create NFT
            const { nft } = await this.metaplex.nfts().create({
                uri,
                name: metadata.name,
                sellerFeeBasisPoints: metadata.sellerFeeBasisPoints || 500,
                maxSupply: toBigNumber(metadata.maxSupply || 0)
            });

            logger.info('NFT minted successfully', {
                mint: nft.address.toString(),
                uri: nft.uri,
                name: nft.name
            });

            return {
                mint: nft.address.toString(),
                metadata: nft.metadataAddress.toString(),
                uri: nft.uri,
                name: nft.name
            };
        } catch (error) {
            logger.error('Failed to mint NFT:', error);
            throw error;
        }
    }

    async createCollection(params) {
        try {
            logger.info('Creating NFT collection', params);

            const { nft: collectionNft } = await this.metaplex.nfts().create({
                uri: params.uri,
                name: params.name,
                symbol: params.symbol,
                sellerFeeBasisPoints: params.sellerFeeBasisPoints || 500,
                isCollection: true,
                updateAuthority: this.wallet
            });

            return {
                address: collectionNft.address.toString(),
                metadata: collectionNft.metadataAddress.toString(),
                mint: collectionNft.mint.address.toString(),
                uri: collectionNft.uri
            };
        } catch (error) {
            logger.error('Failed to create collection:', error);
            throw error;
        }
    }

    async mintNFTToCollection(metadata, collectionMint) {
        try {
            logger.info('Minting NFT to collection', {
                metadata,
                collectionMint
            });

            const { uri } = await this.metaplex.nfts().uploadMetadata({
                name: metadata.name,
                description: metadata.description,
                image: metadata.image,
                attributes: metadata.attributes,
                properties: {
                    files: [
                        {
                            uri: metadata.image,
                            type: 'image/png'
                        }
                    ]
                }
            });

            const collectionMintPublicKey = new PublicKey(collectionMint);

            const { nft } = await this.metaplex.nfts().create({
                uri,
                name: metadata.name,
                sellerFeeBasisPoints: metadata.sellerFeeBasisPoints || 500,
                collection: collectionMintPublicKey
            });

            // Verify collection
            await this.metaplex.nfts().verifyCollection({
                mintAddress: nft.address,
                collectionMintAddress: collectionMintPublicKey,
                isSizedCollection: true
            });

            return {
                mint: nft.address.toString(),
                metadata: nft.metadataAddress.toString(),
                uri: nft.uri,
                name: nft.name,
                collection: collectionMint
            };
        } catch (error) {
            logger.error('Failed to mint NFT to collection:', error);
            throw error;
        }
    }

    async getCollectionNFTs(collectionMint) {
        try {
            const nfts = await this.metaplex.nfts().findAllByMintList([new PublicKey(collectionMint)]);
            return nfts.map(nft => ({
                mint: nft.address.toString(),
                metadata: nft.metadataAddress.toString(),
                uri: nft.uri,
                name: nft.name
            }));
        } catch (error) {
            logger.error('Failed to get collection NFTs:', error);
            throw error;
        }
    }

    async verifyNFT(mintAddress) {
        try {
            const nft = await this.metaplex.nfts().findByMint({
                mintAddress: new PublicKey(mintAddress)
            });

            return {
                verified: true,
                mint: nft.address.toString(),
                metadata: nft.metadataAddress.toString(),
                uri: nft.uri,
                name: nft.name,
                collection: nft.collection?.address?.toString()
            };
        } catch (error) {
            logger.error('Failed to verify NFT:', error);
            throw error;
        }
    }

    async getBalance(address = null) {
        try {
            const publicKey = address ? new PublicKey(address) : this.wallet.publicKey;
            const balance = await this.connection.getBalance(publicKey);
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            logger.error('Failed to get balance:', error);
            throw error;
        }
    }

    async requestAirdrop(amount = 1) {
        try {
            const signature = await this.connection.requestAirdrop(
                this.wallet.publicKey,
                amount * LAMPORTS_PER_SOL
            );
            await this.connection.confirmTransaction(signature);
            return signature;
        } catch (error) {
            logger.error('Failed to request airdrop:', error);
            throw error;
        }
    }

    async transferSOL(to, amount) {
        try {
            const toPublicKey = new PublicKey(to);
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this.wallet.publicKey,
                    toPubkey: toPublicKey,
                    lamports: amount * LAMPORTS_PER_SOL
                })
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.wallet]
            );

            return signature;
        } catch (error) {
            logger.error('Failed to transfer SOL:', error);
            throw error;
        }
    }

    async getTransactionStatus(signature) {
        try {
            const status = await this.connection.getSignatureStatus(signature);
            return status;
        } catch (error) {
            logger.error('Failed to get transaction status:', error);
            throw error;
        }
    }
}

export const blockchainService = new BlockchainService();
