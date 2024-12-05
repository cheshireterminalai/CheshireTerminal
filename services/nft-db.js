import pg from "pg";
import { v4 as uuidv4 } from "uuid";

const { Pool } = pg;

// Initialize PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'
});

class NFTDatabase {
    /**
     * Save or update NFT metadata
     * @param {string} mintAddress - The NFT's mint address
     * @param {string} ownerAddress - The NFT owner's wallet address
     * @param {Object} metadata - The NFT metadata following Metaplex standard
     * @returns {Promise<Object>} Saved NFT metadata
     */
    async saveNFT(mintAddress, ownerAddress, metadata) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert or update NFT metadata
            const metadataResult = await client.query(
                `INSERT INTO nft_metadata (
                    mint_address, owner_address, name, description, 
                    image_uri, animation_uri, external_url, 
                    attributes, properties
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (mint_address) DO UPDATE SET
                    owner_address = EXCLUDED.owner_address,
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    image_uri = EXCLUDED.image_uri,
                    animation_uri = EXCLUDED.animation_uri,
                    external_url = EXCLUDED.external_url,
                    attributes = EXCLUDED.attributes,
                    properties = EXCLUDED.properties,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *`,
                [
                    mintAddress,
                    ownerAddress,
                    metadata.name,
                    metadata.description,
                    metadata.image,
                    metadata.animation_url,
                    metadata.external_url,
                    JSON.stringify(metadata.attributes || []),
                    JSON.stringify(metadata.properties || {})
                ]
            );

            // Handle files if present in properties
            if (metadata.properties?.files?.length > 0) {
                // Delete existing files first
                await client.query(
                    'DELETE FROM nft_files WHERE mint_address = $1',
                    [mintAddress]
                );

                // Insert new files
                for (const file of metadata.properties.files) {
                    await client.query(
                        `INSERT INTO nft_files (
                            id, mint_address, file_type, uri, 
                            content_type, is_cdn
                        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            uuidv4(),
                            mintAddress,
                            'asset',
                            file.uri,
                            file.type,
                            file.cdn || false
                        ]
                    );
                }
            }

            await client.query('COMMIT');
            return metadataResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Upload a file associated with an NFT
     * @param {string} fileType - Type of file (pre_mint_image, post_mint_image, etc)
     * @param {string} filePath - Path to the file in storage
     * @param {Object} fileData - File metadata including content type
     * @param {string} mintAddress - Optional mint address to associate with
     * @returns {Promise<Object>} Saved file record
     */
    async uploadFile(fileType, filePath, fileData, mintAddress = null) {
        const fileId = uuidv4();
        const result = await pool.query(
            `INSERT INTO nft_files (
                id, mint_address, file_type, uri, 
                content_type, is_cdn
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [
                fileId,
                mintAddress,
                fileType,
                filePath,
                fileData.contentType,
                fileData.isCdn || false
            ]
        );
        return result.rows[0];
    }

    /**
     * Get NFT metadata by mint address
     * @param {string} mintAddress - The NFT's mint address
     * @returns {Promise<Object>} NFT metadata with associated files
     */
    async getNFTByMintAddress(mintAddress) {
        const client = await pool.connect();
        try {
            // Get metadata
            const metadataResult = await client.query(
                'SELECT * FROM nft_metadata WHERE mint_address = $1',
                [mintAddress]
            );

            if (metadataResult.rows.length === 0) {
                return null;
            }

            // Get associated files
            const filesResult = await client.query(
                'SELECT * FROM nft_files WHERE mint_address = $1',
                [mintAddress]
            );

            // Combine metadata with files
            const nft = metadataResult.rows[0];
            nft.files = filesResult.rows;

            return nft;
        } finally {
            client.release();
        }
    }

    /**
     * Get all NFTs in a collection
     * @param {string} collectionId - The collection ID
     * @returns {Promise<Array>} Array of NFT metadata
     */
    async getCollectionByAddress(collectionId) {
        const result = await pool.query(
            `SELECT m.*, array_agg(f.*) as files
            FROM nft_metadata m
            LEFT JOIN nft_files f ON m.mint_address = f.mint_address
            WHERE m.collection_id = $1
            GROUP BY m.mint_address`,
            [collectionId]
        );
        return result.rows;
    }

    /**
     * Update NFT mint status
     * @param {string} mintAddress - The NFT's mint address
     * @param {boolean} isMinted - Whether the NFT has been minted
     * @returns {Promise<Object>} Updated NFT metadata
     */
    async updateMintStatus(mintAddress, isMinted) {
        const result = await pool.query(
            `UPDATE nft_metadata 
            SET is_minted = $2, updated_at = CURRENT_TIMESTAMP
            WHERE mint_address = $1
            RETURNING *`,
            [mintAddress, isMinted]
        );
        return result.rows[0];
    }
}

const nftDb = new NFTDatabase();
export default nftDb;
