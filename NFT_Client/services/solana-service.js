const { Connection } = require("@solana/web3.js");

class SolanaService {
    constructor() {
        // Use a default devnet URL if environment variable is not set
        const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        this.connection = new Connection(rpcUrl);
    }

    async analyzeWallet(address) {
        return { address, balance: 0 };
    }

    async analyzeNFTCollection(collection) {
        return { collection, items: [] };
    }

    async getTransactionHistory(address, limit = 10) {
        return [];
    }
}

module.exports = new SolanaService();
