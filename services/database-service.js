import pg from "pg";

import { logger } from "../utils/logger.js";

class DatabaseService {
    constructor() {
        this.pool = new pg.Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        this.initializeDatabase();
    }

    async initializeDatabase() {
        const client = await this.pool.connect();
        try {
            // First transaction: Create tables
            await client.query('BEGIN');

            await client.query(`
                DROP TABLE IF EXISTS validator_info CASCADE;
                DROP TABLE IF EXISTS collections CASCADE;
                DROP TABLE IF EXISTS nfts CASCADE;
                DROP TABLE IF EXISTS agent_memory CASCADE;
                DROP TABLE IF EXISTS agent_traces CASCADE;
                DROP TABLE IF EXISTS transactions CASCADE;
            `);

            await client.query(`
                CREATE TABLE validator_info (
                    id SERIAL PRIMARY KEY,
                    version JSONB,
                    slot_info BIGINT,
                    block_height BIGINT,
                    supply JSONB,
                    identity TEXT,
                    genesis_hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE collections (
                    id SERIAL PRIMARY KEY,
                    collection_mint TEXT UNIQUE,
                    name TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    description TEXT,
                    collection_address TEXT,
                    status TEXT DEFAULT 'initialized',
                    strategy JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE nfts (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    symbol TEXT,
                    description TEXT,
                    image_url TEXT,
                    attributes JSONB,
                    mint_address TEXT UNIQUE,
                    metadata_address TEXT,
                    collection_mint TEXT REFERENCES collections(collection_mint) ON DELETE SET NULL,
                    status TEXT DEFAULT 'generated',
                    uri TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE agent_memory (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    task TEXT NOT NULL,
                    response TEXT NOT NULL,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE agent_traces (
                    id SERIAL PRIMARY KEY,
                    trace_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    input JSONB,
                    output JSONB,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE transactions (
                    id SERIAL PRIMARY KEY,
                    signature TEXT UNIQUE,
                    type TEXT,
                    status TEXT,
                    from_address TEXT,
                    to_address TEXT,
                    amount DECIMAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query('COMMIT');

            // Second transaction: Create indexes
            await client.query('BEGIN');

            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_collections_mint ON collections(collection_mint);
                CREATE INDEX IF NOT EXISTS idx_nfts_collection_mint ON nfts(collection_mint);
                CREATE INDEX IF NOT EXISTS idx_nfts_mint_address ON nfts(mint_address);
                CREATE INDEX IF NOT EXISTS idx_agent_memory_session ON agent_memory(session_id);
                CREATE INDEX IF NOT EXISTS idx_agent_traces_trace ON agent_traces(trace_id);
                CREATE INDEX IF NOT EXISTS idx_transactions_signature ON transactions(signature);
            `);

            await client.query('COMMIT');

            logger.info('Database initialized successfully');
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Database initialization failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async storeValidatorInfo(info) {
        const query = `
            INSERT INTO validator_info (version, slot_info, block_height, supply, identity, genesis_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            info.version,
            info.slotInfo,
            info.blockHeight,
            info.supply,
            info.identity,
            info.genesisHash
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to store validator info:', error);
            throw error;
        }
    }

    async storeCollection(collection) {
        const query = `
            INSERT INTO collections (name, symbol, description, collection_mint, collection_address, strategy)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [
            collection.name,
            collection.symbol,
            collection.description,
            collection.collectionMint,
            collection.collectionAddress,
            JSON.stringify(collection.strategy)
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to store collection:', error);
            throw error;
        }
    }

    async storeNFTData(nft) {
        const query = `
            INSERT INTO nfts (name, symbol, description, image_url, attributes, collection_mint, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [
            nft.name,
            nft.symbol,
            nft.description,
            nft.image,
            JSON.stringify(nft.attributes),
            nft.collectionMint,
            nft.status
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to store NFT data:', error);
            throw error;
        }
    }

    async updateNFTStatus(mintAddress, status, data = {}) {
        const query = `
            UPDATE nfts
            SET status = $1, metadata_address = $2, uri = $3, updated_at = CURRENT_TIMESTAMP
            WHERE mint_address = $4
            RETURNING *;
        `;
        const values = [status, data.metadata, data.uri, mintAddress];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to update NFT status:', error);
            throw error;
        }
    }

    async updateCollectionStatus(collectionMint, status) {
        const query = `
            UPDATE collections
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE collection_mint = $2
            RETURNING *;
        `;
        const values = [status, collectionMint];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to update collection status:', error);
            throw error;
        }
    }

    async storeNFTVerification(mintAddress, verification) {
        const query = `
            UPDATE nfts
            SET metadata_address = $1, uri = $2, updated_at = CURRENT_TIMESTAMP
            WHERE mint_address = $3
            RETURNING *;
        `;
        const values = [verification.metadata, verification.uri, mintAddress];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to store NFT verification:', error);
            throw error;
        }
    }

    async saveMemory(sessionId, task, response, metadata = {}) {
        const query = `
            INSERT INTO agent_memory (session_id, task, response, metadata)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [sessionId, task, response, JSON.stringify(metadata)];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to save memory:', error);
            throw error;
        }
    }

    async getMemory(sessionId, limit = 10) {
        const query = `
            SELECT * FROM agent_memory
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2;
        `;
        const values = [sessionId, limit];

        try {
            const result = await this.pool.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Failed to get memory:', error);
            throw error;
        }
    }

    async saveTrace(traceId, eventType, input, output, metadata = {}) {
        const query = `
            INSERT INTO agent_traces (trace_id, event_type, input, output, metadata)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [
            traceId,
            eventType,
            JSON.stringify(input),
            JSON.stringify(output),
            JSON.stringify(metadata)
        ];

        try {
            const result = await this.pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            logger.error('Failed to save trace:', error);
            throw error;
        }
    }

    async getTraces(traceId, limit = 10) {
        const query = `
            SELECT * FROM agent_traces
            WHERE trace_id = $1
            ORDER BY created_at DESC
            LIMIT $2;
        `;
        const values = [traceId, limit];

        try {
            const result = await this.pool.query(query, values);
            return result.rows;
        } catch (error) {
            logger.error('Failed to get traces:', error);
            throw error;
        }
    }

    async clearMemory(sessionId) {
        const query = `
            DELETE FROM agent_memory
            WHERE session_id = $1;
        `;
        const values = [sessionId];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            logger.error('Failed to clear memory:', error);
            throw error;
        }
    }

    async clearTraces(traceId) {
        const query = `
            DELETE FROM agent_traces
            WHERE trace_id = $1;
        `;
        const values = [traceId];

        try {
            await this.pool.query(query, values);
        } catch (error) {
            logger.error('Failed to clear traces:', error);
            throw error;
        }
    }
}

export const databaseService = new DatabaseService();
