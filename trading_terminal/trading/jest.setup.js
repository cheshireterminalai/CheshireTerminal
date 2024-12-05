// Mock environment variables
process.env.SOLANA_TRACKER_API_KEY = '7d5348f1-b95e-4569-8256-375a2ac01437';
process.env.SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
process.env.MONITORING_INTERVAL = '300000';
process.env.SIGNAL_THRESHOLD_PRICE_CHANGE = '3';
process.env.SIGNAL_THRESHOLD_VOLUME = '50000';
process.env.SIGNAL_THRESHOLD_LIQUIDITY = '250000';

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Mock WebSocket for Solana connection
class WebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 1;
    }

    send(data) {}
    close() {}
}

global.WebSocket = WebSocket;

// Mock setInterval and clearInterval
jest.useFakeTimers();

// Add custom matchers
expect.extend({
    toBeWithinRange(received, floor, ceiling) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () =>
                    `expected ${received} not to be within range ${floor} - ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected ${received} to be within range ${floor} - ${ceiling}`,
                pass: false,
            };
        }
    },
});

// Mock axios defaults
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
    })),
    defaults: {
        headers: {
            common: {},
        },
    },
    interceptors: {
        request: { use: jest.fn(), eject: jest.fn() },
        response: { use: jest.fn(), eject: jest.fn() },
    },
}));

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
    Connection: jest.fn().mockImplementation(() => ({
        getAccountInfo: jest.fn().mockResolvedValue(null),
        getProgramAccounts: jest.fn().mockResolvedValue([]),
        getRecentBlockhash: jest.fn().mockResolvedValue({
            blockhash: 'mock-blockhash',
            feeCalculator: { lamportsPerSignature: 5000 },
        }),
    })),
    PublicKey: jest.fn().mockImplementation((key) => ({
        toString: () => key,
        toBase58: () => key,
    })),
    SystemProgram: {
        programId: 'mock-system-program-id',
        createAccount: jest.fn(),
    },
    Transaction: jest.fn().mockImplementation(() => ({
        add: jest.fn(),
        sign: jest.fn(),
    })),
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('mock-signature'),
}));

// Add global test utilities
global.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock EventEmitter methods
jest.spyOn(require('events').EventEmitter.prototype, 'emit');
jest.spyOn(require('events').EventEmitter.prototype, 'on');
jest.spyOn(require('events').EventEmitter.prototype, 'once');
jest.spyOn(require('events').EventEmitter.prototype, 'removeListener');
