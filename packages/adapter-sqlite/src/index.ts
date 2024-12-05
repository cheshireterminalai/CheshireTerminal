import { Database } from "better-sqlite3";

import {
    Account,
    DatabaseAdapter,
    Memory,
    UUID,
} from "@ai16z/eliza";

interface MemoryRow {
    id: string;
    user_id: string;
    agent_id: string;
    room_id: string;
    content: string;
    embedding: string;
    created_at: number;
}

interface AccountRow {
    id: string;
    username: string;
    name: string;
    platform: string;
    created_at: number;
}

interface RoomParticipantRow {
    room_id: string;
    user_id: string;
    joined_at: number;
}

export class SqliteDatabaseAdapter implements DatabaseAdapter {
    db: Database;

    constructor(db: Database) {
        this.db = db;
        this.initializeSchema();
    }

    private initializeSchema() {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                room_id TEXT NOT NULL,
                content TEXT NOT NULL,
                embedding TEXT,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS rooms (
                id TEXT PRIMARY KEY,
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS room_participants (
                room_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                joined_at INTEGER NOT NULL,
                PRIMARY KEY (room_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                name TEXT NOT NULL,
                platform TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
        `);
    }

    async getMemoryById(id: UUID): Promise<Memory | null> {
        const row = this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as MemoryRow | undefined;
        if (!row) return null;
        return {
            id: row.id as UUID,
            userId: row.user_id as UUID,
            agentId: row.agent_id as UUID,
            roomId: row.room_id as UUID,
            content: JSON.parse(row.content),
            embedding: JSON.parse(row.embedding),
            createdAt: row.created_at
        };
    }

    async getMemories(params: {
        roomId: UUID;
        count?: number;
        unique?: boolean;
        tableName: string;
    }): Promise<Memory[]> {
        const { roomId, count = 10 } = params;
        const rows = this.db
            .prepare('SELECT * FROM memories WHERE room_id = ? ORDER BY created_at DESC LIMIT ?')
            .all(roomId, count) as MemoryRow[];
        return rows.map(row => ({
            id: row.id as UUID,
            userId: row.user_id as UUID,
            agentId: row.agent_id as UUID,
            roomId: row.room_id as UUID,
            content: JSON.parse(row.content),
            embedding: JSON.parse(row.embedding),
            createdAt: row.created_at
        }));
    }

    async getMemoriesByRoomIds(p: {
        agentId?: UUID;
        roomIds: UUID[];
        tableName: string;
    }): Promise<Memory[]> {
        const { agentId, roomIds } = p;
        const placeholders = roomIds.map(() => '?').join(',');
        const query = agentId
            ? `SELECT * FROM memories WHERE agent_id = ? AND room_id IN (${placeholders})`
            : `SELECT * FROM memories WHERE room_id IN (${placeholders})`;
        const params = agentId ? [agentId, ...roomIds] : roomIds;
        const rows = this.db.prepare(query).all(params) as MemoryRow[];
        return rows.map(row => ({
            id: row.id as UUID,
            userId: row.user_id as UUID,
            agentId: row.agent_id as UUID,
            roomId: row.room_id as UUID,
            content: JSON.parse(row.content),
            embedding: JSON.parse(row.embedding),
            createdAt: row.created_at
        }));
    }

    async createMemory(memory: Memory, tableName: string): Promise<void> {
        this.db.prepare(`
            INSERT INTO memories (id, user_id, agent_id, room_id, content, embedding, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            memory.id,
            memory.userId,
            memory.agentId,
            memory.roomId,
            JSON.stringify(memory.content),
            JSON.stringify(memory.embedding),
            memory.createdAt
        );
    }

    async getAccountById(userId: UUID): Promise<Account | null> {
        const row = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(userId) as AccountRow | undefined;
        if (!row) return null;
        return {
            id: row.id as UUID,
            username: row.username,
            name: row.name
        };
    }

    async createAccount(account: Account): Promise<boolean> {
        try {
            this.db.prepare(`
                INSERT INTO accounts (id, username, name, platform, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                account.id,
                account.username,
                account.name,
                'twitter', // Default platform for Twitter bot
                Date.now()
            );
            return true;
        } catch (error) {
            console.error('Error creating account:', error);
            return false;
        }
    }

    async createRoom(roomId?: UUID): Promise<UUID> {
        const id = roomId || crypto.randomUUID() as UUID;
        this.db.prepare('INSERT INTO rooms (id, created_at) VALUES (?, ?)').run(id, Date.now());
        return id;
    }

    async getRoom(roomId: UUID): Promise<UUID | null> {
        const row = this.db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId) as { id: string } | undefined;
        return row ? row.id as UUID : null;
    }

    async addParticipant(userId: UUID, roomId: UUID): Promise<boolean> {
        try {
            this.db.prepare(`
                INSERT INTO room_participants (room_id, user_id, joined_at)
                VALUES (?, ?, ?)
            `).run(roomId, userId, Date.now());
            return true;
        } catch (error) {
            console.error('Error adding participant:', error);
            return false;
        }
    }

    async getParticipantsForRoom(roomId: UUID): Promise<UUID[]> {
        const rows = this.db
            .prepare('SELECT user_id FROM room_participants WHERE room_id = ?')
            .all(roomId) as RoomParticipantRow[];
        return rows.map(row => row.user_id as UUID);
    }

    async getRoomsForParticipant(userId: UUID): Promise<UUID[]> {
        const rows = this.db
            .prepare('SELECT room_id FROM room_participants WHERE user_id = ?')
            .all(userId) as RoomParticipantRow[];
        return rows.map(row => row.room_id as UUID);
    }

    // Required by interface but not used by Twitter client
    async searchMemoriesByEmbedding(): Promise<Memory[]> { return []; }
    async removeMemory(): Promise<void> {}
    async removeAllMemories(): Promise<void> {}
    async countMemories(): Promise<number> { return 0; }
    async getGoals(): Promise<any[]> { return []; }
    async updateGoal(): Promise<void> {}
    async createGoal(): Promise<void> {}
    async removeGoal(): Promise<void> {}
    async removeAllGoals(): Promise<void> {}
    async removeRoom(): Promise<void> {}
    async getRoomsForParticipants(): Promise<UUID[]> { return []; }
    async removeParticipant(): Promise<boolean> { return false; }
    async getParticipantsForAccount(): Promise<any[]> { return []; }
    async getParticipantUserState(): Promise<any> { return null; }
    async setParticipantUserState(): Promise<void> {}
    async createRelationship(): Promise<boolean> { return false; }
    async getRelationship(): Promise<any> { return null; }
    async getRelationships(): Promise<any[]> { return []; }
    async updateGoalStatus(): Promise<void> {}
    async searchMemories(): Promise<Memory[]> { return []; }
    async getCachedEmbeddings(): Promise<any[]> { return []; }
    async log(): Promise<void> {}
    async getActorDetails(): Promise<any[]> { return []; }
}
