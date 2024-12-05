import fs from "fs/promises";
import path from "path";

import { logger } from "../utils/logger.js";

class CollectionGenerator {
    constructor() {
        this.collectionSize = 69;
        this.outputDir = path.join(process.cwd(), 'generated', 'images');
        this.metadataDir = path.join(process.cwd(), 'generated', 'metadata');
    }

    async addToCollection(item) {
        try {
            // Create directories if they don't exist
            await fs.mkdir(this.outputDir, { recursive: true });
            await fs.mkdir(this.metadataDir, { recursive: true });

            // Get current collection status
            const status = await this.getCollectionStatus();
            const index = status.generated;

            // Save metadata
            const metadata = {
                index,
                imagePath: item.imagePath,
                originalPrompt: item.originalPrompt,
                enhancedPrompt: item.enhancedPrompt,
                timestamp: item.timestamp,
                minted: false
            };

            await fs.writeFile(
                path.join(this.metadataDir, `nft_${index}.json`),
                JSON.stringify(metadata, null, 2)
            );

            logger.info('Added item to collection', { index, metadata });
            return metadata;
        } catch (error) {
            logger.error('Failed to add item to collection:', error);
            throw error;
        }
    }

    async updateItemMinted(index, mintData) {
        try {
            const metadataPath = path.join(this.metadataDir, `nft_${index}.json`);
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

            metadata.minted = true;
            metadata.mintAddress = mintData.mint;
            metadata.explorerUrl = mintData.explorerUrl;
            metadata.imageUrl = mintData.imageUrl;
            metadata.mintTimestamp = new Date().toISOString();

            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            logger.info('Updated item mint status', { index, mintAddress: mintData.mint });
        } catch (error) {
            logger.error('Failed to update item mint status:', error);
            throw error;
        }
    }

    async getCollectionStatus() {
        try {
            // Create directories if they don't exist
            await fs.mkdir(this.outputDir, { recursive: true });
            await fs.mkdir(this.metadataDir, { recursive: true });

            // Read metadata files
            const metadataFiles = await fs.readdir(this.metadataDir);
            const items = await Promise.all(
                metadataFiles
                    .filter(f => f.endsWith('.json'))
                    .map(async f => {
                        const content = await fs.readFile(
                            path.join(this.metadataDir, f),
                            'utf-8'
                        );
                        return JSON.parse(content);
                    })
            );

            // Sort items by index
            items.sort((a, b) => a.index - b.index);

            // Count minted items
            const minted = items.filter(item => item.minted).length;

            return {
                targetSize: this.collectionSize,
                generated: items.length,
                minted,
                remaining: this.collectionSize - items.length,
                images: items
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                return {
                    targetSize: this.collectionSize,
                    generated: 0,
                    minted: 0,
                    remaining: this.collectionSize,
                    images: []
                };
            }
            throw error;
        }
    }

    async getItemByIndex(index) {
        try {
            const metadataPath = path.join(this.metadataDir, `nft_${index}.json`);
            const content = await fs.readFile(metadataPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            logger.error('Failed to get item:', error);
            throw error;
        }
    }
}

export const collectionGenerator = new CollectionGenerator();
