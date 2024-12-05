class Terminal {
    constructor() {
        this.output = document.getElementById('terminalOutput');
        this.input = document.getElementById('terminalInput');
        this.thoughts = document.getElementById('aiThoughts');
        this.imageGrid = document.getElementById('imageGrid');
        this.commandHistory = [];
        this.historyIndex = -1;

        this.setupEventListeners();
        this.initializeTerminal();
    }

    setupEventListeners() {
        this.input.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    initializeTerminal() {
        this.print('Cheshire Terminal v1.0.0', 'system');
        this.print('Connected to Solana Mainnet', 'system');
        this.print('Type "help" for available commands', 'system');
        this.updateStatus();
    }

    async handleKeyPress(e) {
        if (e.key === 'Enter' && this.input.value.trim()) {
            const command = this.input.value.trim();
            this.commandHistory.push(command);
            this.historyIndex = this.commandHistory.length;
            this.print(`> ${command}`, 'input');
            this.input.value = '';
            await this.executeCommand(command);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.input.value = this.commandHistory[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.input.value = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = this.commandHistory.length;
                this.input.value = '';
            }
        }
    }

    async executeCommand(command) {
        try {
            const response = await fetch('/api/terminal/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const result = await response.json();

            if (result.type === 'clear') {
                this.clear();
                return;
            }

            this.handleCommandResult(result);
            await this.updateStatus();
        } catch (error) {
            this.print(`Error: ${error.message}`, 'error');
        }
    }

    handleCommandResult(result) {
        switch (result.type) {
            case 'error':
                this.print(result.message, 'error');
                break;
            case 'success':
                this.print(result.message, 'success');
                if (result.data) {
                    if (typeof result.data === 'object') {
                        this.print(JSON.stringify(result.data, null, 2), 'data');
                    } else {
                        this.print(result.data, 'data');
                    }
                }
                break;
            case 'info':
                this.print(result.message, 'info');
                break;
            case 'image':
                this.addImage(result.url, result.metadata);
                break;
            case 'thought':
                this.printThought(result.message);
                break;
            default:
                this.print(result.message || 'Command executed');
        }
    }

    print(message, type = 'output') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        
        if (type === 'data') {
            line.innerHTML = `<pre>${message}</pre>`;
        } else {
            line.textContent = message;
        }

        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }

    printThought(thought) {
        const line = document.createElement('div');
        line.className = 'terminal-thought';
        line.textContent = `> ${thought}`;
        this.thoughts.appendChild(line);
        this.thoughts.scrollTop = this.thoughts.scrollHeight;
    }

    addImage(imageUrl, metadata) {
        const div = document.createElement('div');
        div.className = 'image-card p-2 rounded';
        div.innerHTML = `
            <img src="${imageUrl}" class="w-full h-40 object-cover rounded mb-2">
            <p class="text-sm truncate">${metadata.name || 'Untitled'}</p>
            <p class="text-xs opacity-75">${metadata.status || 'pending'}</p>
        `;
        this.imageGrid.appendChild(div);
    }

    async updateStatus() {
        try {
            const response = await fetch('/api/collection/stats');
            const stats = await response.json();
            
            document.getElementById('collectionStatus').textContent = stats.status || 'Not Initialized';
            document.getElementById('itemsGenerated').textContent = stats.total || 0;
            document.getElementById('itemsMinted').textContent = stats.minted || 0;
            document.getElementById('lastAction').textContent = stats.lastAction || 'None';
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    }

    clear() {
        this.output.innerHTML = '';
        this.print('Terminal cleared', 'system');
    }
}

// Initialize terminal when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.terminal = new Terminal();
});
