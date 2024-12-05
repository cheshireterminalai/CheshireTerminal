 class NeuralAnalysisService {
    constructor() {
        this.analysisWindow = 1000 * 60 * 5; // 5 minutes
        this.thoughtBuffer = [];
        this.patterns = [];
    }

    async analyzeResponse(response, context = {}) {
        const timestamp = Date.now();
        const analysis = await this._performNeuralAnalysis(response, context);
        
        this._updateBuffer({
            content: response,
            timestamp,
            analysis
        });

        return {
            patterns: this._identifyPatterns(),
            metrics: this._calculateMetrics(),
            temporalDynamics: this._analyzeTemporalDynamics(),
            coherenceScore: this._calculateCoherenceScore()
        };
    }

    async _performNeuralAnalysis(response, context) {
        try {
            const prompt = this._constructAnalysisPrompt(response, context);
            const aiService = (await import('./ai-service.js')).default;
            
            const analysisResponse = await aiService.generateResponse(prompt, 'analysis');
            return this._parseAnalysisResponse(analysisResponse);
        } catch (error) {
            console.error('Neural analysis failed:', error);
            return this._generateFallbackAnalysis();
        }
    }

    _constructAnalysisPrompt(response, context) {
        // Keep prompt concise to avoid context length issues
        return `Analyze this response:
${response.slice(0, 1000)}... // Truncate long responses

Context type: ${context.type || 'general'}
Previous responses: ${this.thoughtBuffer.length}

Provide:
1. Key patterns
2. Coherence (0-1)
3. Complexity (0-1)
4. Relevance (0-1)`;
    }

    _parseAnalysisResponse(analysisResponse) {
        try {
            const patterns = this._extractPatterns(analysisResponse);
            const metrics = this._extractMetrics(analysisResponse);
            
            return {
                patterns,
                metrics,
                rawAnalysis: analysisResponse
            };
        } catch (error) {
            console.error('Failed to parse analysis response:', error);
            return this._generateFallbackAnalysis();
        }
    }

    _extractPatterns(analysis) {
        const patternRegex = /Pattern (\d+):\s*([^\n]+)/g;
        const patterns = [];
        let match;

        while ((match = patternRegex.exec(analysis)) !== null) {
            patterns.push({
                id: match[1],
                description: match[2],
                confidence: this._extractConfidenceScore(analysis, match[1])
            });
        }

        return patterns;
    }

    _extractMetrics(analysis) {
        return {
            coherence: this._extractMetricValue(analysis, 'coherence', 0.5),
            complexity: this._extractMetricValue(analysis, 'complexity', 0.5),
            contextRelevance: this._extractMetricValue(analysis, 'relevance', 0.5),
            novelty: this._extractMetricValue(analysis, 'novelty', 0.5)
        };
    }

    _extractMetricValue(analysis, metricName, defaultValue) {
        const match = analysis.match(new RegExp(`${metricName}[^\\d]*(\\d+(?:\\.\\d+)?)`));
        return match ? parseFloat(match[1]) : defaultValue;
    }

    _extractConfidenceScore(analysis, patternId) {
        const match = analysis.match(new RegExp(`Pattern ${patternId}[^]*?confidence:?\\s*(\\d+(?:\\.\\d+)?)`));
        return match ? parseFloat(match[1]) : 0.5;
    }

    _updateBuffer(entry) {
        const cutoffTime = Date.now() - this.analysisWindow;
        this.thoughtBuffer = this.thoughtBuffer
            .filter(t => t.timestamp > cutoffTime)
            .concat(entry);
    }

    _identifyPatterns() {
        if (this.thoughtBuffer.length < 2) return [];

        return this.thoughtBuffer
            .map(t => t.analysis?.patterns || [])
            .flat()
            .reduce((acc, pattern) => {
                const existing = acc.find(p => p.id === pattern.id);
                if (existing) {
                    existing.frequency++;
                    existing.confidence = (existing.confidence + pattern.confidence) / 2;
                } else {
                    acc.push({ ...pattern, frequency: 1 });
                }
                return acc;
            }, [])
            .sort((a, b) => b.frequency - a.frequency);
    }

    _calculateMetrics() {
        const recentThoughts = this.thoughtBuffer.slice(-5);
        if (!recentThoughts.length) return this._getDefaultMetrics();

        return {
            complexity: this._calculateComplexity(recentThoughts),
            stability: this._calculateStability(recentThoughts),
            novelty: this._calculateNovelty(recentThoughts),
            resonance: this._calculateResonance(recentThoughts)
        };
    }

    _calculateComplexity(thoughts) {
        return thoughts.reduce((sum, t) => 
            sum + (t.analysis?.metrics?.complexity || 0.5)
        , 0) / thoughts.length;
    }

    _calculateStability(thoughts) {
        if (thoughts.length < 2) return 1;
        
        const metrics = thoughts.map(t => t.analysis?.metrics || this._getDefaultMetrics());
        const variations = metrics.slice(1).map((m, i) => 
            Math.abs(m.coherence - metrics[i].coherence)
        );
        
        return 1 - (variations.reduce((sum, v) => sum + v, 0) / variations.length);
    }

    _calculateNovelty(thoughts) {
        const uniquePatterns = new Set(
            thoughts.flatMap(t => t.analysis?.patterns || []).map(p => p.id)
        );
        return uniquePatterns.size / (thoughts.length * 2);
    }

    _calculateResonance(thoughts) {
        return thoughts.reduce((sum, t) => 
            sum + (t.analysis?.metrics?.contextRelevance || 0.5)
        , 0) / thoughts.length;
    }

    _analyzeTemporalDynamics() {
        const shortTermWindow = 1000 * 60; // 1 minute
        const now = Date.now();

        const shortTerm = this.thoughtBuffer
            .filter(t => t.timestamp > now - shortTermWindow)
            .reduce((sum, t) => sum + (t.analysis?.metrics?.coherence || 0.5), 0);

        const longTerm = this.thoughtBuffer
            .reduce((sum, t) => sum + (t.analysis?.metrics?.coherence || 0.5), 0);

        return {
            shortTerm: shortTerm / Math.max(1, this.thoughtBuffer.length),
            longTerm: longTerm / Math.max(1, this.thoughtBuffer.length)
        };
    }

    _calculateCoherenceScore() {
        if (this.thoughtBuffer.length < 2) return 1;

        return this.thoughtBuffer.reduce((sum, t, i, arr) => {
            if (i === 0) return sum;
            const prev = arr[i - 1];
            return sum + (t.analysis?.metrics?.coherence || 0.5);
        }, 0) / (this.thoughtBuffer.length - 1);
    }

    _getDefaultMetrics() {
        return {
            coherence: 0.5,
            complexity: 0.5,
            contextRelevance: 0.5,
            novelty: 0.5
        };
    }

    _generateFallbackAnalysis() {
        return {
            patterns: [],
            metrics: this._getDefaultMetrics(),
            rawAnalysis: 'Analysis unavailable'
        };
    }
}

export default new NeuralAnalysisService();
