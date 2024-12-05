class AgentService {
    async processTask(query, context = {}) {
        return {
            response: "Task processed",
            context
        };
    }

    async getMemory() {
        return [];
    }

    async getTraces(traceId) {
        return [];
    }
}

export const agentService = new AgentService();
