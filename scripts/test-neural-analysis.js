import aiService from "../services/ai-service.js";

async function testNeuralAnalysis() {
    try {
        console.log('Initializing AI Service...');
        await aiService.initialize();

        console.log('\nTesting code analysis...');
        const codeResponse = await aiService.answerCodingQuestion(
            'How would you implement a simple blockchain transaction in Solana?'
        );
        console.log('\nCode Analysis Results:');
        console.log(JSON.stringify(codeResponse, null, 2));

        console.log('\nTesting market analysis...');
        const marketResponse = await aiService.analyzeToken({
            symbol: 'SOL',
            price: 60.45,
            volume24h: 1234567890,
            marketCap: 25000000000,
            change24h: 5.67
        });
        console.log('\nMarket Analysis Results:');
        console.log(JSON.stringify(marketResponse, null, 2));

        // Test temporal pattern recognition
        console.log('\nTesting temporal pattern recognition...');
        const responses = await Promise.all([
            aiService.getResponseWithAnalysis('Tell me about DeFi trends'),
            aiService.getResponseWithAnalysis('What are the risks in DeFi?'),
            aiService.getResponseWithAnalysis('How can we mitigate DeFi risks?')
        ]);

        console.log('\nTemporal Analysis Results:');
        responses.forEach((response, i) => {
            console.log(`\nResponse ${i + 1}:`);
            console.log('Content:', response.content);
            console.log('Analysis:', {
                patterns: response.analysis.patterns,
                coherenceScore: response.analysis.coherenceScore,
                temporalDynamics: response.analysis.temporalDynamics
            });
        });

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testNeuralAnalysis().then(() => {
    console.log('\nNeural analysis testing complete');
}).catch(error => {
    console.error('Fatal error during testing:', error);
});
