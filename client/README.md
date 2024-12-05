# NFT Generation API Client

This client library allows you to interact with the NFT Generation API from any web application. The API provides endpoints for generating and minting NFTs on the Solana blockchain.

## Getting Started

1. First, ensure the API server is running:
```bash
cd autonomous-website
npm run dev
```

This will start two servers:
- API Server: http://localhost:3001
- Dashboard: http://localhost:3002

## Using the Client Library

### 1. Include the client library in your HTML:
```html
<script src="path/to/nft-client.js"></script>
```

### 2. Initialize the client:
```javascript
const client = new NFTGenerationClient('http://localhost:3001/api');
```

### 3. Available Methods:

```javascript
// Get collection generation status
const status = await client.getStatus();

// Get wallet balance
const balance = await client.getWalletBalance();

// Start generating NFT collection
const result = await client.startGeneration();

// Stop generation process
await client.stopGeneration();

// Get complete collection metadata
const metadata = await client.getCollectionMetadata();

// Get specific NFT metadata
const nft = await client.getNFTMetadata(0); // Get first NFT

// Poll for status updates
const stopPolling = client.pollStatus((error, status) => {
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Current status:', status);
}, 2000); // Poll every 2 seconds

// Stop polling when done
stopPolling();
```

## API Endpoints

The following REST endpoints are available:

### Collection Management
- `GET /api/collection/status` - Get current generation status
- `POST /api/collection/generate` - Start collection generation
- `POST /api/collection/stop` - Stop generation process
- `GET /api/collection/metadata` - Get complete collection metadata

### NFT Information
- `GET /api/nft/:index` - Get metadata for specific NFT
- `GET /api/wallet/balance` - Get current wallet balance

## Example Implementation

See `example.html` for a complete implementation example. To run it:

1. Start the API server:
```bash
npm run dev
```

2. Open `client/example.html` in your browser

## Response Types

### Collection Status
```typescript
interface CollectionStatus {
    isGenerating: boolean;
    progress: {
        current: number;
        total: number;
        percentage: number;
    };
    collection: NFTMetadata[];
}
```

### NFT Metadata
```typescript
interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes: {
        trait_type: string;
        value: string;
    }[];
    properties: {
        files: {
            uri: string;
            type: string;
        }[];
        category: string;
        creators: {
            address: string;
            share: number;
        }[];
    };
}
```

## Error Handling

The client will throw errors for:
- Network issues
- API errors
- Invalid responses

Always wrap API calls in try/catch blocks:

```javascript
try {
    const status = await client.getStatus();
    console.log('Status:', status);
} catch (error) {
    console.error('Error:', error.message);
}
```

## Notes

- The API uses CORS, so it can be accessed from any domain
- All NFTs are minted on Solana mainnet
- Each mint costs real SOL for transaction fees
- The collection size is fixed at 69 NFTs
- Generation can be stopped and resumed
- Wallet balance is checked before each mint

## Example Projects

1. Basic Implementation: See `example.html`
2. Dashboard: See `../dashboard/` directory
3. API Server: See `../api/server.js`

For more examples and detailed documentation, see the main project README.
