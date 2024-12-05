# 🎩 Cheshire Terminal

A whimsical NFT command-line interface powered by the Cheshire Cat's magic, built on Solana and Metaplex.

```
    /\___/\  
   (  o o  )  🎩 Cheshire Terminal
   (  =^=  ) 
    (---)  
```

## ✨ Features

- 🎨 AI-powered NFT generation with custom prompts
- 🔮 Metaplex standard integration
- 📦 Local database storage for pre/post mint images
- 🎭 Collection management with Solana integration
- 😺 Delightful Cheshire Cat-themed interface

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cheshireterminal.git
cd cheshireterminal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WALLET_PRIVATE_KEY=your_private_key
SOLANA_IDENTITY=your_identity
SOLANA_GENESIS_HASH=your_genesis_hash
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=54322
DB_NAME=postgres
API_PORT=3001
```

4. Start the server:
```bash
npm start
```

5. In a new terminal, launch the Cheshire Terminal:
```bash
npm run cli
```

## 🎮 Available Commands

### In the Terminal:
- `npm start` - Start the API server
- `npm run cli` - Launch the Cheshire Terminal
- `npm test` - Run the test suite

### In the Cheshire Terminal:
1. **Conjure a new NFT**
   - Generate AI artwork with custom prompts
   - Add unique traits and attributes
   - Save to local database

2. **Find NFT by address**
   - Look up NFT metadata
   - View associated files
   - Check mint status

3. **View collections**
   - Browse all NFTs
   - View collection stats
   - Export collection data

4. **Update mint status**
   - Toggle NFT visibility
   - Track minting progress

## 🎨 NFT Generation Examples

```bash
# Launch the CLI
npm run cli

# Select option 1 to generate an NFT
# Example prompts:
"A grinning cat fading into moonlight"
"Wonderland tea party with floating cups"
"Chess pieces dancing in neon rain"
```

## 🔮 Technical Details

### Metaplex Standard
```json
{
  "name": "Cheshire's Grin #1",
  "description": "A mysterious smile in the dark",
  "image": "image.png",
  "attributes": [
    {
      "trait_type": "Style",
      "value": "Wonderland"
    }
  ],
  "properties": {
    "files": [
      {
        "uri": "image.png",
        "type": "image/png"
      }
    ],
    "category": "image"
  }
}
```

### Directory Structure
```
cheshireterminal/
├── commands/          # CLI commands and tests
├── services/          # Core services (NFT, DB, etc.)
├── utils/            # Utility functions
├── client/           # NFT client library
└── db/              # Database schemas and migrations
```

## 🐱 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎭 Acknowledgments

- Inspired by Lewis Carroll's Cheshire Cat
- Built with Solana and Metaplex
- Powered by AI image generation

---

"We're all mad here. I'm mad. You're mad. You must be, or you wouldn't have come here." 
- The Cheshire Cat 😸

*Remember: Every great NFT begins with a grin!*
