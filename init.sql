-- Create tables
CREATE TABLE nfts (
    id SERIAL PRIMARY KEY,
    mint_address VARCHAR(255) UNIQUE NOT NULL,
    owner_address VARCHAR(255) NOT NULL,
    collection_address VARCHAR(255),
    metadata JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    address VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    key_value VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

CREATE TABLE agent_memory (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_traces (
    id SERIAL PRIMARY KEY,
    trace_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_nfts_owner ON nfts(owner_address);
CREATE INDEX idx_nfts_collection ON nfts(collection_address);
CREATE INDEX idx_memory_session ON agent_memory(session_id);
CREATE INDEX idx_traces_trace ON agent_traces(trace_id);

-- Insert default API key
INSERT INTO api_keys (key_value, name, permissions)
VALUES (
    'sk_test_default_key',
    'Default Test Key',
    '["read", "write"]'
);
