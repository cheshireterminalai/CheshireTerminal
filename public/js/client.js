// WebSocket connection
let ws;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000;

// UI Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const aiStatus = document.getElementById('aiStatus');
const blockchainStatus = document.getElementById('blockchainStatus');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const taskStatus = document.getElementById('taskStatus');
const progressBar = document.getElementById('progressBar').querySelector('.progress');
const artPreview = document.getElementById('artPreview');
const metadataDisplay = document.getElementById('metadataDisplay');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');
const debugOutput = document.getElementById('debugOutput');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const toggleDebugBtn = document.getElementById('toggleDebugBtn');
const wsModal = document.getElementById('wsModal');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Initialize WebSocket connection
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        wsModal.classList.remove('active');
        reconnectAttempts = 0;
        updateConnectionStatus('connected');
        hideLoadingOverlay();
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        updateConnectionStatus('disconnected');
        handleReconnection();
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus('error');
    };
    
    ws.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
    };
}

// Handle WebSocket reconnection
function handleReconnection() {
    if (reconnectAttempts >= maxReconnectAttempts) {
        wsModal.classList.add('active');
        return;
    }
    
    reconnectAttempts++;
    setTimeout(() => {
        initWebSocket();
    }, reconnectDelay);
}

// Update connection status indicators
function updateConnectionStatus(status) {
    const statusMap = {
        connected: { text: 'Connected', class: 'connected' },
        connecting: { text: 'Connecting...', class: 'connecting' },
        disconnected: { text: 'Disconnected', class: 'error' },
        error: { text: 'Error', class: 'error' }
    };
    
    aiStatus.textContent = statusMap[status].text;
    aiStatus.className = `status-indicator ${statusMap[status].class}`;
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(message) {
    console.log('Received message:', message);
    
    switch (message.type) {
        case 'status':
            updateAgentStatus(message.data);
            break;
        case 'generation_start':
            handleGenerationStart(message);
            break;
        case 'generation_progress':
            handleGenerationProgress(message);
            break;
        case 'generation_complete':
            handleGenerationComplete(message);
            break;
        case 'generation_error':
            handleGenerationError(message);
            break;
        case 'error':
            showError(message.error);
            break;
    }
}

// Update agent status display
function updateAgentStatus(status) {
    if (status.currentTask) {
        taskStatus.textContent = status.currentTask.status || 'Idle';
        if (status.currentTask.progress) {
            progressBar.style.width = `${status.currentTask.progress}%`;
        }
    }
    
    updateAnalytics(status);
}

// Handle generation start
function handleGenerationStart(message) {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    taskStatus.textContent = 'Generating...';
    progressBar.style.width = '0%';
    artPreview.innerHTML = '<div class="placeholder">Generating art...</div>';
    metadataDisplay.textContent = '// Generating metadata...';
}

// Handle generation progress
function handleGenerationProgress(message) {
    if (message.progress) {
        progressBar.style.width = `${message.progress}%`;
    }
    if (message.stage) {
        taskStatus.textContent = message.stage;
    }
}

// Handle generation complete
function handleGenerationComplete(message) {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    taskStatus.textContent = 'Complete';
    progressBar.style.width = '100%';
    
    if (message.data) {
        if (message.data.imageUrl) {
            artPreview.innerHTML = `<img src="${message.data.imageUrl}" alt="Generated NFT">`;
        }
        if (message.data.metadata) {
            metadataDisplay.textContent = JSON.stringify(message.data.metadata, null, 2);
        }
        addHistoryItem(message.data);
    }
}

// Handle generation error
function handleGenerationError(message) {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    taskStatus.textContent = 'Error';
    progressBar.style.width = '0%';
    showError(message.error);
}

// Show error message
function showError(error) {
    errorMessage.textContent = error;
    errorModal.classList.add('active');
}

// Add item to history list
function addHistoryItem(data) {
    const template = document.getElementById('historyItemTemplate');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.timestamp').textContent = new Date().toLocaleString();
    clone.querySelector('.name').textContent = data.metadata.name;
    clone.querySelector('.style').textContent = `Style: ${data.metadata.attributes.find(a => a.trait_type === 'Style')?.value}`;
    clone.querySelector('.theme').textContent = `Theme: ${data.metadata.attributes.find(a => a.trait_type === 'Theme')?.value}`;
    
    if (data.imageUrl) {
        clone.querySelector('.thumbnail').style.backgroundImage = `url(${data.imageUrl})`;
    }
    
    if (data.mintResult?.mint) {
        const mintLink = clone.querySelector('.mint-link');
        mintLink.href = `https://explorer.solana.com/address/${data.mintResult.mint}`;
    }
    
    historyList.insertBefore(clone, historyList.firstChild);
}

// Update analytics displays
function updateAnalytics(status) {
    if (status.preferences) {
        updatePreferencesChart('stylePreferences', status.preferences.styles);
        updatePreferencesChart('themePreferences', status.preferences.themes);
    }
    
    if (status.history) {
        updateSuccessRate(status.history);
        updateGenerationStats(status.history);
    }
}

// Update preferences chart
function updatePreferencesChart(elementId, data) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Convert data to array and sort by rating
    const items = Object.entries(data)
        .sort((a, b) => b[1].rating - a[1].rating)
        .map(([key, value]) => ({
            name: key,
            rating: value.rating,
            used: value.used,
            successful: value.successful
        }));
    
    // Create simple bar chart
    element.innerHTML = items.map(item => `
        <div class="preference-bar">
            <div class="preference-label">${item.name}</div>
            <div class="preference-value" style="width: ${item.rating * 100}%"></div>
            <div class="preference-stats">${item.successful}/${item.used}</div>
        </div>
    `).join('');
}

// Update success rate display
function updateSuccessRate(history) {
    const element = document.getElementById('successRate');
    if (!element) return;
    
    const total = history.length;
    const successful = history.filter(item => item.success).length;
    const rate = total > 0 ? (successful / total) * 100 : 0;
    
    element.textContent = `${rate.toFixed(1)}% (${successful}/${total})`;
}

// Update generation stats
function updateGenerationStats(history) {
    const element = document.getElementById('generationStats');
    if (!element) return;
    
    const today = new Date().toDateString();
    const stats = {
        total: history.length,
        today: history.filter(item => new Date(item.timestamp).toDateString() === today).length,
        styles: {},
        themes: {}
    };
    
    // Count styles and themes
    history.forEach(item => {
        if (item.style) {
            stats.styles[item.style] = (stats.styles[item.style] || 0) + 1;
        }
        if (item.theme) {
            stats.themes[item.theme] = (stats.themes[item.theme] || 0) + 1;
        }
    });
    
    element.innerHTML = `
        <div>Total Generated: ${stats.total}</div>
        <div>Generated Today: ${stats.today}</div>
        <div>Unique Styles: ${Object.keys(stats.styles).length}</div>
        <div>Unique Themes: ${Object.keys(stats.themes).length}</div>
    `;
}

// Hide loading overlay
function hideLoadingOverlay() {
    loadingOverlay.style.display = 'none';
}

// Event Listeners
startBtn.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'generate' }));
});

stopBtn.addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'stop' }));
});

clearHistoryBtn.addEventListener('click', async () => {
    const response = await fetch('/api/clear-history', { method: 'POST' });
    if (response.ok) {
        historyList.innerHTML = '';
    }
});

exportHistoryBtn.addEventListener('click', async () => {
    const response = await fetch('/api/history');
    const history = await response.json();
    
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `nft-generation-history-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

clearLogsBtn.addEventListener('click', async () => {
    const response = await fetch('/api/clear-logs', { method: 'POST' });
    if (response.ok) {
        debugOutput.textContent = '';
    }
});

toggleDebugBtn.addEventListener('click', () => {
    const debugContent = document.querySelector('.debug-content');
    debugContent.style.display = debugContent.style.display === 'none' ? 'block' : 'none';
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing client...');
    initWebSocket();
});
