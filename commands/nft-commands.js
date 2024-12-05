import NFTGenerationClient from "../client/nft-client.js";

const client = new NFTGenerationClient();

// In-memory storage for NFT metadata
const nftStorage = new Map();

export const nftCommands = {
    async generate(options = {}) {
        try {
            const {
                prompt = "vibrant abstract artwork",
                style = "abstract",
                attributes = [],
                index = 1,
                total = 1
            } = options;

            console.log(`Starting NFT generation ${index}/${total} with prompt:`, prompt);
            
            const result = await client.startGeneration({
                name: `Collection ${Date.now()}`,
                symbol: 'AINFT',
                description: `Generated with prompt: ${prompt}`,
                prompt: `${prompt} (${index}/${total})`, // Add index to make each prompt unique
                style,
                attributes
            });

            if (!result.success) {
                throw new Error('NFT generation failed: ' + result.error);
            }

            const nftData = {
                name: `AI Art #${index} - ${Date.now()}`,
                description: `AI-generated artwork using prompt: ${prompt}`,
                image: result.imageUrl || `generated/art_${Date.now()}_${index}.png`,
                attributes: [
                    { trait_type: "Style", value: style },
                    { trait_type: "Prompt", value: prompt },
                    { trait_type: "Edition", value: `${index} of ${total}` },
                    ...attributes
                ],
                properties: {
                    edition: {
                        index,
                        total
                    }
                }
            };

            return {
                ...nftData,
                generationResult: result
            };
        } catch (error) {
            console.error('NFT generation error:', error);
            throw new Error('Failed to generate NFT: ' + error.message);
        }
    },

    async save(nftData) {
        try {
            const mintAddress = 'temp_' + Date.now();
            const ownerAddress = process.env.SOLANA_IDENTITY || 'default_owner';

            console.log('Saving NFT metadata:', { mintAddress, ownerAddress });
            
            const metadata = client.createMetadata(nftData);
            
            nftStorage.set(mintAddress, {
                mintAddress,
                ownerAddress,
                metadata,
                minted: false,
                createdAt: new Date().toISOString()
            });

            console.log('NFT saved to storage successfully');
            return nftStorage.get(mintAddress);
        } catch (error) {
            console.error('NFT save error:', error);
            throw new Error('Failed to save NFT: ' + error.message);
        }
    },

    async get(mintAddress) {
        try {
            const nft = nftStorage.get(mintAddress);
            if (!nft) {
                throw new Error('NFT not found');
            }
            return nft;
        } catch (error) {
            console.error('NFT retrieval error:', error);
            throw new Error('Failed to get NFT: ' + error.message);
        }
    },

    async getCollection(collectionId) {
        try {
            return Array.from(nftStorage.values());
        } catch (error) {
            console.error('Collection retrieval error:', error);
            throw new Error('Failed to get collection: ' + error.message);
        }
    },

    async updateMintStatus(mintAddress, isMinted = true) {
        try {
            const nft = nftStorage.get(mintAddress);
            if (!nft) {
                throw new Error('NFT not found');
            }
            
            nft.minted = isMinted;
            nft.mintedAt = isMinted ? new Date().toISOString() : null;
            
            nftStorage.set(mintAddress, nft);
            return nft;
        } catch (error) {
            console.error('Mint status update error:', error);
            throw new Error('Failed to update mint status: ' + error.message);
        }
    }
};
