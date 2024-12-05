import { logger } from "../utils/logger.js";
import { nftMinter } from "../utils/nft-minter.js";
import { aiService } from "./ai-service.js";
import { collectionGenerator } from "./collection-generator.js";

class CommandsService {
    constructor() {
        this.commands = {
            'help': this.showHelp.bind(this),
            'generate': this.generateArt.bind(this),
            'mint': this.mintNFT.bind(this),
            'status': this.getStatus.bind(this),
            'clear': this.clearOutput.bind(this)
        };
    }

    async processCommand(command) {
        try {
            // First, let's get a Cheshire Cat response using LLaMA
            const cheshireResponse = await aiService.generateCheshireResponse(command);
            
            // Parse the command
            const [cmd, ...args] = command.toLowerCase().split(' ');
            
            // If it's a known command, execute it
            if (this.commands[cmd]) {
                const result = await this.commands[cmd](args.join(' '));
                return {
                    ...result,
                    cheshireResponse
                };
            }
            
            // If not a known command, treat it as a conversation with the Cheshire Cat
            return {
                type: 'chat',
                message: cheshireResponse
            };
        } catch (error) {
            logger.error('Command processing error:', error);
            return {
                type: 'error',
                message: await aiService.generateCheshireResponse(
                    `Oh dear, something went wrong: ${error.message}`
                )
            };
        }
    }

    async showHelp() {
        const helpText = `Available commands:
- generate : Generate new NFT artwork
- mint     : Mint generated artwork as NFT
- status   : Check system status
- clear    : Clear terminal output
- help     : Show this help message

You can also chat with me! I'll respond in my characteristic Cheshire Cat style using the power of LLaMA :grin:`;

        return {
            type: 'info',
            message: await aiService.generateCheshireResponse(helpText)
        };
    }

    async generateArt(prompt) {
        try {
            if (!prompt) {
                return {
                    type: 'error',
                    message: await aiService.generateCheshireResponse(
                        "Oh my, you'll need to give me a prompt to work with! What shall I create for you?"
                    )
                };
            }

            logger.info('Starting art generation', { prompt });

            // First, enhance the prompt using LLaMA
            const enhancedPrompt = await aiService.generateCheshireResponse(
                `Enhance this art prompt with your Cheshire Cat creativity: ${prompt}`
            );

            // Generate art using Stable Diffusion
            const result = await aiService.generateImage(enhancedPrompt);
            
            // Store the result for potential minting
            await collectionGenerator.addToCollection({
                imagePath: result.path,
                originalPrompt: prompt,
                enhancedPrompt: result.enhancedPrompt,
                timestamp: new Date().toISOString()
            });

            return {
                type: 'art',
                message: await aiService.generateCheshireResponse(
                    `Behold my creation! I've transformed "${prompt}" into something truly wonderous!`
                ),
                image: result.path,
                prompts: {
                    original: prompt,
                    enhanced: result.enhancedPrompt
                }
            };
        } catch (error) {
            logger.error('Art generation error:', error);
            return {
                type: 'error',
                message: await aiService.generateCheshireResponse(
                    `My artistic paw slipped! ${error.message}`
                )
            };
        }
    }

    async mintNFT(args) {
        try {
            const index = parseInt(args);
            if (isNaN(index)) {
                return {
                    type: 'error',
                    message: await aiService.generateCheshireResponse(
                        "You'll need to tell me which piece to mint! Try 'mint 0' for the first one."
                    )
                };
            }

            // Get collection status to verify the index
            const status = await collectionGenerator.getCollectionStatus();
            if (index >= status.generated) {
                return {
                    type: 'error',
                    message: await aiService.generateCheshireResponse(
                        "That piece seems to have vanished into thin air! Try a different number."
                    )
                };
            }

            // Get the image info
            const imageInfo = status.images[index];
            
            // Generate creative description using LLaMA
            const description = await aiService.generateCheshireResponse(
                `Create a whimsical description for this NFT generated from the prompt: ${imageInfo.enhancedPrompt}`
            );

            // Generate attributes using LLaMA
            const attributesResponse = await aiService.generateCheshireResponse(
                `Generate 3-5 unique attributes for an NFT based on this prompt: ${imageInfo.enhancedPrompt}. 
                Format them as JSON array like this: [{"trait_type": "Background", "value": "Mystical Forest"}, ...]`
            );
            
            // Parse attributes from the response
            const attributesMatch = attributesResponse.match(/\[.*\]/s);
            const attributes = attributesMatch ? JSON.parse(attributesMatch[0]) : [];

            // Mint NFT
            const mintResult = await nftMinter.mintNFT(
                imageInfo.imagePath,
                `Cheshire Art: ${imageInfo.enhancedPrompt.slice(0, 30)}...`,
                description,
                attributes
            );

            return {
                type: 'success',
                message: await aiService.generateCheshireResponse(
                    `Purrfect! Your NFT has materialized on the blockchain at ${mintResult.mint}`
                ),
                data: {
                    mint: mintResult.mint,
                    explorerUrl: mintResult.explorerUrl,
                    imageUrl: mintResult.imageUrl,
                    description,
                    attributes
                }
            };
        } catch (error) {
            logger.error('NFT minting error:', error);
            return {
                type: 'error',
                message: await aiService.generateCheshireResponse(
                    `Oh dear, the minting went awry! ${error.message}`
                )
            };
        }
    }

    async getStatus() {
        try {
            const status = await collectionGenerator.getCollectionStatus();
            const balance = await nftMinter.getBalance();

            const statusMessage = await aiService.generateCheshireResponse(
                `Here's what's happening in our wonderland:\n\n` +
                `🎨 Generated Artworks: ${status.generated}\n` +
                `💎 Minted NFTs: ${status.minted}\n` +
                `💰 Wallet Balance: ${balance} SOL\n` +
                `🎯 Collection Target: ${status.targetSize}`
            );

            return {
                type: 'info',
                message: statusMessage,
                data: {
                    ...status,
                    balance
                }
            };
        } catch (error) {
            logger.error('Status check error:', error);
            return {
                type: 'error',
                message: await aiService.generateCheshireResponse(
                    `The status seems to have disappeared... ${error.message}`
                )
            };
        }
    }

    async clearOutput() {
        return {
            type: 'clear',
            message: await aiService.generateCheshireResponse(
                "Poof! Like the Cheshire Cat, the previous messages have vanished, leaving only a grin behind..."
            )
        };
    }
}

export const commandsService = new CommandsService();
