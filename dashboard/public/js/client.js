// WebSocket connection
let ws;
let currentTokenAddress = null;
let wsReconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Initialize WebSocket connection
function initWebSocket() {
    try {
        // Use the same host as the current page
        const wsHost = window.location.hostname || 'localhost';
        const wsUrl = `ws://${wsHost}:8080`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to trading service');
            updateConnectionStatus('Connected');
            wsReconnectAttempts = 0;
        };

        ws.onclose = () => {
            console.log('Disconnected from trading service');
            updateConnectionStatus('Disconnected');
            
            // Attempt to reconnect with backoff
            if (wsReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = Math.min(1000 * Math.pow(2, wsReconnectAttempts), 10000);
                wsReconnectAttempts++;
                console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${wsReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(initWebSocket, delay);
            } else {
                console.log('Max reconnection attempts reached. Please refresh the page.');
                showError('Connection lost. Please refresh the page to reconnect.');
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleServerMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('Error');
        };
    } catch (error) {
        console.error('Error initializing WebSocket:', error);
        updateConnectionStatus('Error');
    }
}

// Handle messages from the server
function handleServerMessage(message) {
    try {
        switch (message.type) {
            case 'token_analysis':
                updateTokenAnalysis(message.data);
                break;

            case 'trading_signal':
                handleTradingSignal(message.data);
                break;

            case 'chat_response':
                updateChatResponse(message.data);
                break;

            case 'error':
                showError(message.error);
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    } catch (error) {
        console.error('Error handling server message:', error);
        showError('Error processing server response');
    }
}

// Handle command input
const commandInput = document.getElementById('commandInput');
if (commandInput) {
    commandInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const command = e.target.value.trim();
            if (!command) return;

            try {
                // Send command to server
                const response = await fetch('/api/command', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command })
                });

                if (!response.ok) {
                    throw new Error('Failed to process command');
                }

                const result = await response.json();
                console.log('Command response:', result);

                // Clear the input
                e.target.value = '';

                // Hide all containers first
                document.querySelectorAll('.chat-container, .coding-container, .analysis-container, .contract-container, .token-analysis-container, .chart-analysis-container, .form-container').forEach(container => {
                    container.style.display = 'none';
                });

                // Show the menu
                const mainMenu = document.getElementById('mainMenu');
                if (mainMenu) {
                    mainMenu.style.display = 'block';
                }

                // Handle the command
                switch (command) {
                    case '1':
                        const generateForm = document.getElementById('generateForm');
                        if (generateForm) generateForm.style.display = 'block';
                        break;
                    case '5':
                        const chatContainer = document.getElementById('chatContainer');
                        if (chatContainer) chatContainer.style.display = 'block';
                        break;
                    case '6':
                        const codingContainer = document.getElementById('codingContainer');
                        if (codingContainer) codingContainer.style.display = 'block';
                        break;
                    case '7':
                        const analysisContainer = document.getElementById('analysisContainer');
                        if (analysisContainer) analysisContainer.style.display = 'block';
                        break;
                    case '8':
                        const contractContainer = document.getElementById('contractContainer');
                        if (contractContainer) contractContainer.style.display = 'block';
                        break;
                    case '9':
                        const tokenAnalysisContainer = document.getElementById('tokenAnalysisContainer');
                        if (tokenAnalysisContainer) tokenAnalysisContainer.style.display = 'block';
                        break;
                    case '10':
                        const chartAnalysisContainer = document.getElementById('chartAnalysisContainer');
                        if (chartAnalysisContainer) chartAnalysisContainer.style.display = 'block';
                        break;
                    case '11':
                        window.close();
                        break;
                    default:
                        showError('Invalid command. Please enter a number between 1 and 11.');
                }
            } catch (error) {
                console.error('Error processing command:', error);
                showError('Failed to process command. Please try again.');
            }
        }
    });
}

// Menu item click handlers
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const command = item.getAttribute('data-command');
        const commandInput = document.getElementById('commandInput');
        if (commandInput) {
            commandInput.value = command;
            // Trigger the enter key press event
            commandInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        }
    });
});

// Chat input handler
const chatInput = document.getElementById('chatInput');
if (chatInput) {
    chatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const message = e.target.value.trim();
            if (!message) return;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message, type: 'chat' })
                });

                if (!response.ok) {
                    throw new Error('Failed to send message');
                }

                const result = await response.json();
                updateChatResponse({
                    query: message,
                    response: result.response
                });

                // Clear input
                e.target.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
                showError('Failed to send message. Please try again.');
            }
        }
    });
}

// Code analysis handler
const analysisInput = document.getElementById('analysisInput');
if (analysisInput) {
    analysisInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            const code = e.target.value.trim();
            if (!code) return;

            try {
                const response = await fetch('/api/analyze-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    throw new Error('Failed to analyze code');
                }

                const result = await response.json();
                const analysisMessages = document.getElementById('analysisMessages');
                if (analysisMessages) {
                    // Add code and analysis to messages
                    const codeBlock = document.createElement('div');
                    codeBlock.className = 'code-block';
                    codeBlock.textContent = code;
                    analysisMessages.appendChild(codeBlock);

                    const analysisBlock = document.createElement('div');
                    analysisBlock.className = 'analysis-block';
                    analysisBlock.innerHTML = formatAIAnalysis(result.analysis);
                    analysisMessages.appendChild(analysisBlock);

                    // Clear input
                    e.target.value = '';
                    
                    // Scroll to bottom
                    analysisMessages.scrollTop = analysisMessages.scrollHeight;
                }
            } catch (error) {
                console.error('Error analyzing code:', error);
                showError('Failed to analyze code. Please try again.');
            }
        }
    });
}

// Token analysis handler
const tokenAddressInput = document.getElementById('tokenAddressInput');
if (tokenAddressInput) {
    tokenAddressInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const tokenAddress = e.target.value.trim();
            if (!tokenAddress) return;

            try {
                const response = await fetch('/api/analyze-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tokenAddress })
                });

                if (!response.ok) {
                    throw new Error('Failed to analyze token');
                }

                const result = await response.json();
                updateTokenAnalysis(result);

                // Start monitoring via WebSocket if connected
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'monitor_token',
                        tokenAddress
                    }));
                }
            } catch (error) {
                console.error('Error analyzing token:', error);
                showError('Failed to analyze token. Please try again.');
            }
        }
    });
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
    }).format(num);
}

function formatAIAnalysis(analysis) {
    if (!analysis) return '';
    // Convert markdown-style formatting to HTML
    return analysis
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = `Trading Service: ${status}`;
        statusElement.className = `status-text ${status.toLowerCase()}`;
    }
}

function showError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = error;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize WebSocket when page loads
window.addEventListener('load', () => {
    console.log('Page loaded, initializing WebSocket...');
    initWebSocket();
    // Focus on command input
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
        commandInput.focus();
    }
});
