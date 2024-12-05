// Dashboard WebSocket Client
let socket;
let isConnected = false;
let nftCollection = [];
let currentPrompt = null;

// UI Elements
const connectionStatus = document.getElementById('connectionStatus');
const connectionText = document.getElementById('connectionText');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const currentStage = document.getElementById('currentStage');
const consoleOutput = document.getElementById('consoleOutput');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const walletInfo = document.getElementById('walletInfo');
const nftGallery = document.getElementById('nftGallery');
const sortSelect = document.getElementById('sortSelect');
const generatePromptBtn = document.getElementById('generatePromptBtn');
const generateImageBtn = document.getElementById('generateImageBtn');
const currentPromptDisplay = document.getElementById('currentPrompt');
const imagePreview = document.getElementById('imagePreview');

// Set placeholder image
const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAAC3Ycb+AAAABlBMVEUAAABVVVWX3PJkAAAAAXRSTlMAQObYZgAAAFpJREFUeNrtwQENAAAAwqD3T20PBxQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8GY4QAAB/lQn6QAAAABJRU5ErkJggg==';
imagePreview.src = placeholderImage;

// API endpoints
const API_BASE = 'http://localhost:3001/api';
const SD_API = 'http://127.0.0.1:8000';

// Initialize WebSocket connection
function initializeWebSocket() {
    socket = io(`http://localhost:${window.SOCKET_PORT}`, {
        transports: ['websocket'],
        reconnectionAttempts: 5
    });

    socket.on('connect', () => {
        isConnected = true;
        updateConnectionStatus(true);
        console.log('Connected to server');
        addConsoleMessage('Connected to Solana mainnet');
    });

    socket.on('disconnect', () => {
        isConnected = false;
        updateConnectionStatus(false);
        console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        addConsoleMessage(`Connection error: ${error.message}`);
    });

    // Handle different event types
    socket.on('progress', handleProgress);
    socket.on('stage', handleStage);
    socket.on('console', handleConsoleOutput);
    socket.on('nft', handleNFTMinted);
    socket.on('wallet', handleWalletUpdate);
}

// Update UI functions
function updateConnectionStatus(connected) {
    connectionStatus.className = `status-indicator ${connected ? 'status-active' : 'status-inactive'}`;
    connectionText.textContent = connected ? 'Connected' : 'Disconnected';
    startButton.disabled = !connected;
    generatePromptBtn.disabled = !connected;
}

function handleProgress(data) {
    const percent = Math.round(data.progress);
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${data.current}/69 NFTs`;
}

function handleStage(data) {
    currentStage.textContent = data.stage;
    addConsoleMessage(`Stage: ${data.stage}`);
}

function handleConsoleOutput(data) {
    addConsoleMessage(data.message);
    
    if (data.message.includes('wallet balance:')) {
        const balance = data.message.match(/[\d.]+/)[0];
        updateWalletBalance(balance);
    }
}

function handleNFTMinted(nft) {
    nftCollection.push(nft);
    updateNFTGallery();
    addConsoleMessage(`NFT Minted: ${nft.name}`);
}

function handleWalletUpdate(data) {
    updateWalletBalance(data.balance);
}

function updateWalletBalance(balance) {
    walletInfo.innerHTML = `Wallet Balance: <span class="text-yellow-400">${Number(balance).toFixed(4)} SOL</span>`;
}

function addConsoleMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.textContent = `[${timestamp}] ${message}`;
    consoleOutput.appendChild(logEntry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// NFT Gallery functions
function calculateRarityScore(nft) {
    return nft.attributes.reduce((score, attr) => {
        const traitRarity = attr.value.toLowerCase().includes('rare') ? 2 :
                          attr.value.toLowerCase().includes('epic') ? 3 :
                          attr.value.toLowerCase().includes('legendary') ? 4 : 1;
        return score + traitRarity;
    }, 0);
}

function updateNFTGallery() {
    const sortType = sortSelect.value;
    const sortedNFTs = [...nftCollection].sort((a, b) => {
        switch (sortType) {
            case 'newest':
                return b.mintTimestamp - a.mintTimestamp;
            case 'oldest':
                return a.mintTimestamp - b.mintTimestamp;
            case 'rarity':
                return calculateRarityScore(b) - calculateRarityScore(a);
            default:
                return 0;
        }
    });

    nftGallery.innerHTML = sortedNFTs.map(nft => `
        <div class="nft-card">
            <img src="${nft.image}" alt="${nft.name}" class="nft-image">
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${nft.name}</h3>
                <div class="mb-2">
                    ${nft.attributes.map(attr => 
                        `<span class="trait-pill">${attr.trait_type}: ${attr.value}</span>`
                    ).join('')}
                </div>
                <div class="text-sm text-gray-400 mb-2">
                    Rarity Score: ${calculateRarityScore(nft)}
                </div>
                <a href="https://explorer.solana.com/address/${nft.mint}" 
                   target="_blank" 
                   class="text-blue-400 hover:text-blue-300 text-sm">
                    View on Explorer
                </a>
            </div>
        </div>
    `).join('');
}

// Prompt and Image Generation functions
async function generatePrompt() {
    try {
        const response = await fetch(`${API_BASE}/generate-prompt`);
        if (!response.ok) {
            throw new Error('Failed to generate prompt');
        }
        const data = await response.json();
        currentPrompt = data;
        currentPromptDisplay.textContent = data.prompt;
        generateImageBtn.disabled = false;
        addConsoleMessage('New prompt generated');
    } catch (error) {
        addConsoleMessage(`Error generating prompt: ${error.message}`);
    }
}

async function generateImage() {
    if (!currentPrompt) {
        addConsoleMessage('Please generate a prompt first');
        return;
    }

    try {
        addConsoleMessage('Generating image from prompt...');
        generateImageBtn.disabled = true;

        const response = await fetch(`${SD_API}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                prompt: currentPrompt.prompt,
                negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
                num_inference_steps: 50,
                guidance_scale: 7.5
            })
        });

        if (!response.ok) {
            throw new Error(`Image generation failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        imagePreview.src = imageUrl;
        addConsoleMessage('Image generated successfully');

        // Store the generated image
        const formData = new FormData();
        formData.append('image', blob);
        formData.append('metadata', JSON.stringify(currentPrompt));

        const storeResponse = await fetch(`${API_BASE}/store-image`, {
            method: 'POST',
            body: formData
        });

        if (!storeResponse.ok) {
            throw new Error('Failed to store the generated image');
        }

        addConsoleMessage('Image stored successfully');
        generateImageBtn.disabled = false;

    } catch (error) {
        addConsoleMessage(`Error: ${error.message}`);
        generateImageBtn.disabled = false;
    }
}

// Button event handlers
startButton.addEventListener('click', async () => {
    if (!isConnected) return;
    
    if (confirm('This will mint 69 NFTs on Solana mainnet and cost real SOL. Continue?')) {
        try {
            const response = await fetch(`${API_BASE}/collection/generate`, {
                method: 'POST'
            });
            const data = await response.json();
            
            startButton.disabled = true;
            stopButton.disabled = false;
            addConsoleMessage('Starting collection generation on mainnet...');
            
            // Start polling for updates
            startPolling();
        } catch (error) {
            addConsoleMessage(`Error: ${error.message}`);
        }
    }
});

stopButton.addEventListener('click', async () => {
    if (!isConnected) return;
    
    try {
        const response = await fetch(`${API_BASE}/collection/stop`, {
            method: 'POST'
        });
        const data = await response.json();
        
        startButton.disabled = false;
        stopButton.disabled = true;
        addConsoleMessage('Stopping generation process...');
    } catch (error) {
        addConsoleMessage(`Error: ${error.message}`);
    }
});

generatePromptBtn.addEventListener('click', generatePrompt);
generateImageBtn.addEventListener('click', generateImage);

// Sort handler
sortSelect.addEventListener('change', updateNFTGallery);

// Polling functions
let pollInterval;

function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(async () => {
        try {
            const [statusRes, balanceRes] = await Promise.all([
                fetch(`${API_BASE}/collection/status`),
                fetch(`${API_BASE}/wallet/balance`)
            ]);
            
            const status = await statusRes.json();
            const balance = await balanceRes.json();
            
            handleProgress({
                progress: status.progress.percentage,
                current: status.progress.current
            });
            updateWalletBalance(balance.balance);
            
            // Update collection if needed
            if (status.collection.length > nftCollection.length) {
                nftCollection = status.collection;
                updateNFTGallery();
            }
            
            // Stop polling if generation is complete
            if (!status.isGenerating && status.progress.current === status.progress.total) {
                clearInterval(pollInterval);
                addConsoleMessage('Collection generation complete!');
                startButton.disabled = false;
                stopButton.disabled = true;
            }
        } catch (error) {
            console.error('Polling error:', error);
            addConsoleMessage(`Polling error: ${error.message}`);
        }
    }, 2000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeWebSocket();
    // Load existing collection
    fetch(`${API_BASE}/collection/status`)
        .then(res => res.json())
        .then(status => {
            nftCollection = status.collection;
            updateNFTGallery();
        })
        .catch(console.error);
});
