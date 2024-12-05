#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";

import firecrawlService from "../services/firecrawl-service.js";

const program = new Command();

// Setup CLI interface
program
    .version('1.0.0')
    .description('FireCrawl CLI - Data Analysis Tool');

// Command to analyze a specific token
program
    .command('analyze <token>')
    .description('Analyze a token across all data sources')
    .option('-t, --timeframe <timeframe>', 'Analysis timeframe (1h, 24h, 7d)', '24h')
    .action(async (token, options) => {
        const spinner = ora('Fetching comprehensive analysis...').start();
        try {
            const analysis = await firecrawlService.getComprehensiveAnalysis(token, options.timeframe);
            spinner.succeed('Analysis complete');
            
            console.log('\n' + chalk.blue('=== Analysis Results ==='));
            console.log(chalk.yellow('\nKey Metrics:'));
            Object.entries(analysis.analysis.metrics).forEach(([key, value]) => {
                console.log(chalk.cyan(`${key}: `) + chalk.white(value.toFixed(3)));
            });

            console.log(chalk.yellow('\nKey Insights:'));
            analysis.insights.forEach(insight => {
                const color = getInsightColor(insight.type);
                console.log(color(`[${insight.type}] ${insight.description}`));
                console.log(chalk.gray(`Significance: ${(insight.significance * 100).toFixed(1)}%\n`));
            });

            console.log(chalk.yellow('\nIdentified Patterns:'));
            analysis.analysis.patterns.forEach(pattern => {
                console.log(chalk.magenta(`- ${pattern.description}`));
                console.log(chalk.gray(`  Confidence: ${(pattern.confidence * 100).toFixed(1)}%`));
            });

        } catch (error) {
            spinner.fail('Analysis failed');
            console.error(chalk.red('Error:'), error.message);
        }
    });

// Command to monitor a token in real-time
program
    .command('monitor <token>')
    .description('Monitor a token in real-time')
    .option('-i, --interval <seconds>', 'Update interval in seconds', '60')
    .action(async (token, options) => {
        console.log(chalk.blue(`Starting real-time monitoring for ${token}`));
        console.log(chalk.gray('Press Ctrl+C to stop monitoring\n'));

        const interval = parseInt(options.interval) * 1000;
        let lastAnalysis = null;

        const monitor = async () => {
            const spinner = ora('Fetching latest data...').start();
            try {
                const analysis = await firecrawlService.getComprehensiveAnalysis(token, '1h');
                spinner.stop();
                clearScreen();

                console.log(chalk.blue(`=== ${token} Real-time Monitor ===`));
                console.log(chalk.gray(`Last update: ${new Date().toLocaleTimeString()}\n`));

                // Print current metrics
                console.log(chalk.yellow('Current Metrics:'));
                Object.entries(analysis.analysis.metrics).forEach(([key, value]) => {
                    console.log(chalk.cyan(`${key}: `) + chalk.white(value.toFixed(3)));
                });

                // Compare with previous analysis
                if (lastAnalysis) {
                    console.log(chalk.yellow('\nChanges Since Last Update:'));
                    compareAnalyses(analysis, lastAnalysis);
                }

                // Print latest insights
                console.log(chalk.yellow('\nLatest Insights:'));
                analysis.insights
                    .sort((a, b) => b.significance - a.significance)
                    .slice(0, 3)
                    .forEach(insight => {
                        const color = getInsightColor(insight.type);
                        console.log(color(`[${insight.type}] ${insight.description}`));
                    });

                lastAnalysis = analysis;
            } catch (error) {
                spinner.fail('Update failed');
                console.error(chalk.red('Error:'), error.message);
            }
        };

        // Initial analysis
        await monitor();
        // Set up interval for updates
        const intervalId = setInterval(monitor, interval);

        // Handle cleanup on exit
        process.on('SIGINT', () => {
            clearInterval(intervalId);
            console.log(chalk.blue('\nMonitoring stopped'));
            process.exit();
        });
    });

// Command to fetch data from a specific source
program
    .command('source <source> <token>')
    .description('Fetch data from a specific source (onchain, social, news, market)')
    .option('-t, --timeframe <timeframe>', 'Analysis timeframe (1h, 24h, 7d)', '24h')
    .action(async (source, token, options) => {
        const spinner = ora(`Fetching ${source} data...`).start();
        try {
            const data = await firecrawlService.fetchData(source, { 
                token, 
                timeframe: options.timeframe 
            });
            spinner.succeed('Data fetched successfully');

            console.log('\n' + chalk.blue(`=== ${source.toUpperCase()} Data ===\n`));
            console.log(JSON.stringify(data, null, 2));
        } catch (error) {
            spinner.fail('Failed to fetch data');
            console.error(chalk.red('Error:'), error.message);
        }
    });

// Helper functions
function getInsightColor(type) {
    const colors = {
        market: chalk.green,
        social: chalk.blue,
        onchain: chalk.yellow,
        news: chalk.magenta
    };
    return colors[type] || chalk.white;
}

function clearScreen() {
    process.stdout.write('\x1Bc');
}

function compareAnalyses(current, previous) {
    Object.entries(current.analysis.metrics).forEach(([key, value]) => {
        const prevValue = previous.analysis.metrics[key];
        const change = value - prevValue;
        const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
        const color = change > 0 ? chalk.green : change < 0 ? chalk.red : chalk.gray;
        console.log(color(`${key}: ${arrow} ${Math.abs(change).toFixed(3)}`));
    });
}

// Parse command line arguments
program.parse(process.argv);
