-- Create tables
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    details JSONB DEFAULT '{}'
);

CREATE TABLE rooms (
    id TEXT PRIMARY KEY
);

CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES accounts(id),
    room_id TEXT NOT NULL REFERENCES rooms(id),
    user_state TEXT,
    last_message_read TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE memories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    embedding TEXT,
    user_id TEXT REFERENCES accounts(id),
    room_id TEXT REFERENCES rooms(id),
    agent_id TEXT,
    is_unique BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id),
    user_id TEXT REFERENCES accounts(id),
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    objectives JSONB NOT NULL
);

CREATE TABLE relationships (
    id TEXT PRIMARY KEY,
    user_a TEXT NOT NULL REFERENCES accounts(id),
    user_b TEXT NOT NULL REFERENCES accounts(id),
    user_id TEXT NOT NULL REFERENCES accounts(id)
);

CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    body JSONB NOT NULL,
    user_id TEXT REFERENCES accounts(id),
    room_id TEXT REFERENCES rooms(id),
    type TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- NFT Related Tables
CREATE TABLE nft_collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    description TEXT,
    creator_address TEXT NOT NULL,
    royalty_percentage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nft_metadata (
    mint_address TEXT PRIMARY KEY,
    collection_id TEXT REFERENCES nft_collections(id),
    owner_address TEXT,
    name TEXT NOT NULL,
    description TEXT,
    image_uri TEXT,
    animation_uri TEXT,
    external_url TEXT,
    attributes JSONB DEFAULT '[]',
    properties JSONB DEFAULT '{}',
    is_minted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE nft_files (
    id TEXT PRIMARY KEY,
    mint_address TEXT REFERENCES nft_metadata(mint_address),
    file_type TEXT NOT NULL, -- 'pre_mint_image', 'post_mint_image', 'animation', etc.
    uri TEXT NOT NULL,
    content_type TEXT NOT NULL, -- 'image/png', 'video/mp4', etc.
    is_cdn BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_room ON memories(room_id);
CREATE INDEX idx_memories_user ON memories(user_id);
CREATE INDEX idx_memories_agent ON memories(agent_id);
CREATE INDEX idx_participants_room ON participants(room_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_goals_room ON goals(room_id);
CREATE INDEX idx_goals_user ON goals(user_id);
CREATE INDEX idx_relationships_users ON relationships(user_a, user_b);

-- NFT Related Indexes
CREATE INDEX idx_nft_metadata_collection ON nft_metadata(collection_id);
CREATE INDEX idx_nft_metadata_owner ON nft_metadata(owner_address);
CREATE INDEX idx_nft_files_mint ON nft_files(mint_address);
