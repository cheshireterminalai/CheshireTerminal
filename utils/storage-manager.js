import { v2 as cloudinary } from "cloudinary";
import fetch from "node-fetch";

import { logger } from "./logger.js";

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'do5z0jxol',
    api_key: process.env.CLOUDINARY_API_KEY || '857259462313331',
    api_secret: process.env.CLOUDINARY_API_SECRET || '_iefbiaKFvWvXWZP2cZ_xetJLy8'
});

class StorageManager {
    constructor() {
        this.arweaveGateway = "https://arweave.net";
    }

    async uploadToCloudinary(imageBuffer, options = {}) {
        try {
            logger.info('Uploading image to Cloudinary');
            
            // Convert buffer to base64
            const base64Image = imageBuffer.toString('base64');
            const uploadStr = `data:image/png;base64,${base64Image}`;

            // Upload to Cloudinary with optimizations for NFTs
            const result = await cloudinary.uploader.upload(uploadStr, {
                folder: 'nft-mainnet',
                resource_type: 'image',
                format: 'png',
                transformation: [
                    { quality: 'auto:best' },
                    { fetch_format: 'auto' }
                ],
                ...options
            });

            logger.info('Successfully uploaded to Cloudinary', { 
                publicId: result.public_id,
                url: result.secure_url
            });

            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
                resourceType: result.resource_type
            };
        } catch (error) {
            logger.error('Failed to upload to Cloudinary', error);
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    async optimizeImage(imageBuffer) {
        try {
            // Upload to Cloudinary for optimization
            const result = await this.uploadToCloudinary(imageBuffer, {
                transformation: [
                    { width: 1000, height: 1000, crop: 'limit' },
                    { quality: 'auto:best' },
                    { fetch_format: 'png' }
                ]
            });

            // Download optimized image
            const response = await fetch(result.url);
            if (!response.ok) {
                throw new Error(`Failed to download optimized image: ${response.statusText}`);
            }

            const optimizedBuffer = await response.arrayBuffer();
            
            logger.info('Successfully optimized image', {
                originalSize: imageBuffer.length,
                optimizedSize: optimizedBuffer.byteLength
            });

            return Buffer.from(optimizedBuffer);
        } catch (error) {
            logger.error('Failed to optimize image', error);
            throw new Error(`Failed to optimize image: ${error.message}`);
        }
    }

    async deleteFromCloudinary(publicId) {
        try {
            logger.info('Deleting image from Cloudinary', { publicId });
            const result = await cloudinary.uploader.destroy(publicId);
            
            if (result.result !== 'ok') {
                throw new Error(`Failed to delete image: ${result.result}`);
            }

            logger.info('Successfully deleted from Cloudinary', { publicId });
            return result;
        } catch (error) {
            logger.error('Failed to delete from Cloudinary', error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }

    async validateImageUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to validate image URL: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                throw new Error('Invalid content type: URL does not point to an image');
            }

            return true;
        } catch (error) {
            logger.error('Failed to validate image URL', error);
            throw new Error(`Failed to validate image URL: ${error.message}`);
        }
    }
}

export const storageManager = new StorageManager();
