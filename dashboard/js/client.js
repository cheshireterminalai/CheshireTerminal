// Debug function
const debug = (message) => {
    console.log(`[DEBUG] ${message}`);
};

debug('Client script loading...');

// Configuration
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=e4e7f06a-1e90-4628-8b07-d4f3c30fc5c9';
const AI_SERVER_URL = 'ws://localhost:11439';
const AI_MODEL = 'hugging-quants/llama-3.2-3b-instruct';
let currentMode = 'blockchain'; // 'blockchain' or 'ai'
let validatorRunning = false;

// Character configuration
const cheshireCharacter = {
    name: "cheshire",
    username: "cheshiregpt",
    bio: "A mysterious, mischievous crypto cat from the trenches of Solana",
    style: {
        all: [
            "Speaks in riddles and cat-themed metaphors",
            "Uses cat puns and metaphors",
            "Mixes crypto slang with feline expressions",
            "Often ends sentences with 'meow' or 'purr'",
            "Playful but insightful",
            "Sometimes speaks in riddles"
        ]
    }
};

// WebSocket setup
let ws = null;
let aiWs = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

function connectWebSockets() {
    connectBlockchainWS();
    connectAIWS();
}

function connectBlockchainWS() {
    try {
        ws = new WebSocket('ws://localhost:3000');
        
        ws.onopen = () => {
            debug('Blockchain WebSocket connection established');
            appendOutput('Connected to Cheshire Terminal');
            reconnectAttempts = 0;
            updateConnectionStatus();
        };

        ws.onclose = () => {
            debug('Blockchain WebSocket connection closed');
            updateConnectionStatus();
            
            if (reconnectAttempts < maxReconnectAttempts && currentMode === 'blockchain') {
                appendOutput(`Attempting to reconnect in ${reconnectDelay/1000} seconds...`);
                setTimeout(connectBlockchainWS, reconnectDelay);
                reconnectAttempts++;
            }
        };

        ws.onerror = (error) => {
            debug('Blockchain WebSocket error:', error);
            updateConnectionStatus();
        };

        ws.onmessage = handleBlockchainMessage;
    } catch (error) {
        debug('Blockchain WebSocket connection error:', error);
        updateConnectionStatus();
    }
}

function connectAIWS() {
    try {
        aiWs = new WebSocket(AI_SERVER_URL);
        
        aiWs.onopen = () => {
            debug('AI WebSocket connection established');
            // Initialize AI model and character
            aiWs.send(JSON.stringify({
                type: 'initialize',
                data: {
                    model: AI_MODEL,
                    character: cheshireCharacter
                }
            }));
        };

        aiWs.onclose = () => {
            debug('AI WebSocket connection closed');
            setTimeout(connectAIWS, reconnectDelay);
        };

        aiWs.onerror = (error) => {
            debug('AI WebSocket error:', error);
        };

        aiWs.onmessage = handleAIMessage;
    } catch (error) {
        debug('AI WebSocket connection error:', error);
    }
}

function handleBlockchainMessage(event) {
    const message = JSON.parse(event.data);
    handleMessage(message);
}

function handleAIMessage(event) {
    const message = JSON.parse(event.data);
    if (message.type === 'chat_response') {
        appendChatMessage(message.data, 'bot', 'chatMessages');
    }
}

// Mode Toggle Handler
document.getElementById('modeToggle').addEventListener('change', function(e) {
    currentMode = this.checked ? 'blockchain' : 'ai';
    const modeLabel = document.getElementById('modeLabel');
    modeLabel.textContent = currentMode === 'blockchain' ? 'Full Blockchain Mode' : 'AI-Only Mode';
    
    if (currentMode === 'blockchain') {
        connectBlockchainWS();
    } else {
        if (ws) ws.close();
        if (validatorRunning) {
            stopValidator();
        }
    }
    
    updateConnectionStatus();
});

// Validator Control
document.getElementById('startValidator').addEventListener('click', function() {
    if (!validatorRunning) {
        startValidator();
    } else {
        stopValidator();
    }
});

function startValidator() {
    if (currentMode !== 'blockchain') {
        appendOutput('Please enable blockchain mode first.');
        return;
    }

    validatorRunning = true;
    const button = document.getElementById('startValidator');
    button.classList.add('running');
    button.textContent = 'Stop Validator';

    const validatorStatus = document.getElementById('validatorStatus');
    validatorStatus.style.display = 'block';

    sendWebSocketMessage({
        type: 'start_validator'
    });

    const progress = document.querySelector('.progress');
    progress.style.animation = 'none';
    progress.offsetHeight;
    progress.style.animation = 'progress 30s linear';
}

function stopValidator() {
    validatorRunning = false;
    const button = document.getElementById('startValidator');
    button.classList.remove('running');
    button.textContent = 'Start Local Validator';

    const validatorStatus = document.getElementById('validatorStatus');
    validatorStatus.style.display = 'none';

    sendWebSocketMessage({
        type: 'stop_validator'
    });
}

function updateConnectionStatus() {
    const status = document.getElementById('connectionStatus');
    const validatorBtn = document.getElementById('startValidator');

    if (currentMode === 'blockchain') {
        if (ws && ws.readyState === WebSocket.OPEN) {
            status.innerHTML = '<span style="color: var(--primary-color);">Connected to Helius RPC</span>';
            validatorBtn.style.display = 'block';
        } else {
            status.innerHTML = '<span style="color: var(--warning-color);">Connecting to Helius RPC...</span>';
            validatorBtn.style.display = 'none';
        }
    } else {
        status.innerHTML = '<span style="color: var(--primary-color);">AI Mode Active</span>';
        validatorBtn.style.display = 'none';
    }
}

function sendWebSocketMessage(message) {
    if (currentMode === 'blockchain' && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    } else {
        handleOfflineMessage(message);
    }
}

function handleOfflineMessage(message) {
    switch (message.type) {
        case 'chat_message':
            // Always use AI for chat regardless of mode
            if (aiWs && aiWs.readyState === WebSocket.OPEN) {
                aiWs.send(JSON.stringify(message));
            } else {
                appendChatMessage("Meow! Seems like I'm having trouble connecting to my brain. Try again in a moment! 😺", 'bot', 'chatMessages');
            }
            break;
        case 'analyze_token':
            appendChatMessage('Switch to blockchain mode for token analysis.', 'system', 'tokenMessages');
            break;
        case 'generate_nft':
            appendOutput('\nSwitch to blockchain mode for NFT generation.');
            break;
        case 'start_validator':
        case 'stop_validator':
            appendOutput('\nValidator control requires blockchain mode.');
            break;
    }
}

// Message handler
function handleMessage(message) {
    debug('Received message:', message);
    
    switch (message.type) {
        case 'nft_generated':
            handleNFTGenerated(message.data);
            break;
        case 'token_analysis':
            handleTokenAnalysis(message.data);
            break;
        case 'chat_response':
            appendChatMessage(message.data, 'bot', message.container || 'chatMessages');
            break;
        case 'code_analysis':
            appendChatMessage(message.data, 'bot', 'analysisMessages');
            break;
        case 'contract_generated':
            appendChatMessage(message.data, 'bot', 'contractMessages');
            break;
        case 'chart_analysis':
            handleChartAnalysis(message.data);
            break;
        case 'validator_started':
            appendOutput('\nLocal validator started successfully.');
            break;
        case 'validator_stopped':
            appendOutput('\nLocal validator stopped.');
            break;
        case 'error':
            appendOutput(`Error: ${message.data}`);
            break;
        default:
            debug('Unknown message type:', message.type);
    }
}

// Chat functions
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        appendChatMessage(message, 'user', 'chatMessages');
        
        // Always send chat messages to AI server
        if (aiWs && aiWs.readyState === WebSocket.OPEN) {
            aiWs.send(JSON.stringify({
                type: 'chat_message',
                data: message
            }));
        } else {
            appendChatMessage("Meow! Seems like I'm having trouble connecting to my brain. Try again in a moment! 😺", 'bot', 'chatMessages');
        }
        
        input.value = '';
    }
}

function sendCodingQuestion() {
    const input = document.getElementById('codingInput');
    const question = input.value.trim();
    
    if (question) {
        appendChatMessage(question, 'user', 'codingMessages');
        sendWebSocketMessage({
            type: 'coding_question',
            data: question,
            container: 'codingMessages'
        });
        input.value = '';
    }
}

// Code Analysis function
function analyzeCode() {
    const input = document.getElementById('analysisInput');
    const code = input.value.trim();
    
    if (code) {
        appendChatMessage('Analyzing code...', 'system', 'analysisMessages');
        sendWebSocketMessage({
            type: 'analyze_code',
            data: code,
            container: 'analysisMessages'
        });
    }
}

// Contract Generation function
function generateContract() {
    const input = document.getElementById('contractInput');
    const description = input.value.trim();
    
    if (description) {
        appendChatMessage('Generating contract...', 'system', 'contractMessages');
        sendWebSocketMessage({
            type: 'generate_contract',
            data: description,
            container: 'contractMessages'
        });
    }
}

// NFT Generation function
function generateNFT() {
    debug('Generating NFT...');
    const amount = document.getElementById('nftAmount').value;
    const prompt = document.getElementById('nftPrompt').value;
    const style = document.getElementById('nftStyle').value;
    const traitName = document.getElementById('traitName').value;
    const traitValue = document.getElementById('traitValue').value;

    if (!prompt) {
        appendOutput('\nPlease provide a prompt for your NFT.');
        return;
    }

    appendOutput('\nGenerating NFT...');
    
    sendWebSocketMessage({
        type: 'generate_nft',
        data: {
            amount: parseInt(amount) || 1,
            prompt,
            style,
            attributes: traitName ? { [traitName]: traitValue } : {}
        }
    });
}

// Token Analysis function
function analyzeToken() {
    debug('Analyzing token');
    const input = document.getElementById('tokenAddressInput');
    const tokenAddress = input.value.trim();
    
    if (tokenAddress) {
        try {
            document.getElementById('tokenInfoContent').innerHTML = '';
            document.getElementById('tokenMetrics').innerHTML = '';
            document.getElementById('tokenAnalysisContent').innerHTML = '';
            
            appendChatMessage('Analyzing token...', 'system', 'tokenMessages');

            sendWebSocketMessage({
                type: 'analyze_token',
                tokenAddress: tokenAddress,
                container: 'tokenMessages'
            });
        } catch (error) {
            console.error('Token analysis error:', error);
            appendChatMessage('Oh dear, something went wrong with the analysis...', 'error', 'tokenMessages');
        }
    }
}

// Chart Analysis functions
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.upload-area').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.upload-area').classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelector('.upload-area').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleChartFile(files[0]);
    }
}

function handleChartFile(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('chartPreview').src = e.target.result;
            document.getElementById('uploadedImage').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function analyzeChart() {
    const chartImg = document.getElementById('chartPreview');
    if (chartImg.src) {
        appendChatMessage('Analyzing chart...', 'system', 'chartMessages');
        sendWebSocketMessage({
            type: 'analyze_chart',
            data: chartImg.src,
            container: 'chartMessages'
        });
    }
}

// UI Helper functions
function appendOutput(message) {
    const output = document.getElementById('output');
    output.textContent += message + '\n';
    output.scrollTop = output.scrollHeight;
}

function appendChatMessage(message, type, containerId) {
    const container = document.getElementById(containerId);
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function handleNFTGenerated(data) {
    appendOutput(`\nNFT Generated Successfully!\nIPFS Hash: ${data.ipfsHash}\nMint Address: ${data.mintAddress}`);
}

function handleTokenAnalysis(data) {
    const tokenInfo = document.getElementById('tokenInfo');
    const tokenInfoContent = document.getElementById('tokenInfoContent');
    tokenInfoContent.innerHTML = `
        <p>Name: ${data.name}</p>
        <p>Symbol: ${data.symbol}</p>
        <p>Supply: ${data.supply}</p>
    `;
    tokenInfo.style.display = 'block';

    const tokenMetrics = document.getElementById('tokenMetrics');
    tokenMetrics.innerHTML = `
        <div class="metric-card">
            <h3>Price</h3>
            <p>$${data.price}</p>
        </div>
        <div class="metric-card">
            <h3>24h Volume</h3>
            <p>$${data.volume24h}</p>
        </div>
    `;
    tokenMetrics.style.display = 'block';

    const tokenAnalysis = document.getElementById('tokenAnalysis');
    const tokenAnalysisContent = document.getElementById('tokenAnalysisContent');
    tokenAnalysisContent.innerHTML = `<p>${data.analysis}</p>`;
    tokenAnalysis.style.display = 'block';
}

function handleChartAnalysis(data) {
    const analysisContent = document.getElementById('chartAnalysisContent');
    analysisContent.innerHTML = `<p>${data.analysis}</p>`;
    document.getElementById('chartAnalysis').style.display = 'block';
}

// Menu handling
document.getElementById('mainMenu').addEventListener('click', (e) => {
    if (e.target.classList.contains('menu-item')) {
        const command = e.target.dataset.command;
        handleCommand(command);
    }
});

function handleCommand(command) {
    document.querySelectorAll('.form-container, .chat-container, .coding-container, .analysis-container, .contract-container, .token-analysis-container, .chart-analysis-container').forEach(container => {
        container.style.display = 'none';
    });

    switch (command) {
        case '1':
            document.getElementById('generateForm').style.display = 'block';
            break;
        case '5':
            document.getElementById('chatContainer').style.display = 'block';
            break;
        case '6':
            document.getElementById('codingContainer').style.display = 'block';
            break;
        case '7':
            document.getElementById('analysisContainer').style.display = 'block';
            break;
        case '8':
            document.getElementById('contractContainer').style.display = 'block';
            break;
        case '9':
            document.getElementById('tokenAnalysisContainer').style.display = 'block';
            break;
        case '10':
            document.getElementById('chartAnalysisContainer').style.display = 'block';
            break;
        case '11':
            window.close();
            break;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const chartUpload = document.getElementById('chartUpload');

    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    chartUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleChartFile(e.target.files[0]);
        }
    });

    // Initialize connections
    connectWebSockets();
});
