import chalk from "chalk";
import readline from "readline";

import { nftCommands } from "./nft-commands.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const cheshireBanner = `
    /\\___/\\  
   (  o o  )  🎩 Cheshire Terminal
   (  =^=  ) 
    (---)  
`;

function printBanner() {
    console.log(chalk.magenta(cheshireBanner));
    console.log(chalk.cyan('Welcome to the Cheshire Terminal Command Line Interface'));
    console.log(chalk.cyan('Where NFTs appear and disappear with a grin 😸\n'));
}

async function showMenu() {
    console.log(chalk.magenta('\nCheshire\'s Menu of Wonders:'));
    console.log(chalk.yellow('1.') + ' Conjure NFTs (Single or Batch)');
    console.log(chalk.yellow('2.') + ' Find an NFT by its magical address');
    console.log(chalk.yellow('3.') + ' View your collection of curiosities');
    console.log(chalk.yellow('4.') + ' Toggle NFT visibility (mint status)');
    console.log(chalk.yellow('5.') + ' Vanish into thin air (Exit)');
    
    const choice = await question(chalk.cyan('\nWhat shall it be? (1-5): '));
    return choice;
}

async function handleGenerateNFT() {
    console.log(chalk.magenta('\n🎨 Time to create some magical art...'));
    
    const amount = await question(chalk.cyan('How many NFTs shall we conjure? (1-100): '));
    const numNFTs = parseInt(amount) || 1;
    
    if (numNFTs < 1 || numNFTs > 100) {
        console.log(chalk.yellow('\n😺 Let\'s keep it reasonable - generating 1 NFT instead.'));
        numNFTs = 1;
    }

    const prompt = await question(chalk.cyan('Describe your vision (prompt): '));
    const style = await question(chalk.cyan('What style shall we use? (default: wonderland): '));
    const trait = await question(chalk.cyan('Name a special trait (or press enter to skip): '));
    const value = trait ? await question(chalk.cyan('And what value shall this trait have?: ')) : '';

    const attributes = trait ? [{ trait_type: trait, value }] : [];
    
    console.log(chalk.yellow(`\nWorking some Cheshire magic... Generating ${numNFTs} NFT(s) 🌟`));
    
    for (let i = 0; i < numNFTs; i++) {
        try {
            const nftData = await nftCommands.generate({
                prompt,
                style: style || 'wonderland',
                attributes,
                index: i + 1,
                total: numNFTs
            });
            
            console.log(chalk.green(`\n✨ Behold creation ${i + 1} of ${numNFTs}:`));
            console.log(chalk.cyan(JSON.stringify(nftData, null, 2)));

            const save = await question(chalk.magenta('\nShall we preserve this wonder? (y/n): '));
            if (save.toLowerCase() === 'y') {
                const savedNFT = await nftCommands.save(nftData);
                console.log(chalk.green('\n🎉 Your creation has been eternalized:'));
                console.log(chalk.cyan(JSON.stringify(savedNFT, null, 2)));
            }
        } catch (error) {
            console.error(chalk.red(`🙀 Oh dear, something went wrong with NFT ${i + 1}:`, error.message));
            const continueGen = await question(chalk.magenta('\nShall we continue with the remaining NFTs? (y/n): '));
            if (continueGen.toLowerCase() !== 'y') break;
        }
    }
}

async function handleGetNFT() {
    const mintAddress = await question(chalk.cyan('\nWhich NFT shall we seek? (enter mint address): '));
    try {
        console.log(chalk.yellow('\nSearching through the mist... 🔍'));
        const nft = await nftCommands.get(mintAddress);
        if (nft) {
            console.log(chalk.green('\n✨ Found this curious thing:'));
            console.log(chalk.cyan(JSON.stringify(nft, null, 2)));
        } else {
            console.log(chalk.yellow('\n😺 Curiouser and curiouser... No such NFT exists!'));
        }
    } catch (error) {
        console.error(chalk.red('🙀 Oh my whiskers:', error.message));
    }
}

async function handleGetCollection() {
    const collectionId = await question(chalk.cyan('\nWhich collection shall we explore? (press enter for default): '));
    try {
        console.log(chalk.yellow('\nGathering your curiosities... 🎩'));
        const collection = await nftCommands.getCollection(collectionId || 'default');
        console.log(chalk.green('\n✨ Your collection of wonders:'));
        console.log(chalk.cyan(JSON.stringify(collection, null, 2)));
    } catch (error) {
        console.error(chalk.red('🙀 Oh dear, oh dear:', error.message));
    }
}

async function handleUpdateMintStatus() {
    const mintAddress = await question(chalk.cyan('\nWhich NFT shall we transform? (enter mint address): '));
    const status = await question(chalk.cyan('Shall we make it visible? (y/n): '));
    
    try {
        console.log(chalk.yellow('\nWaving our magical paw... 🐱'));
        const updatedNFT = await nftCommands.updateMintStatus(
            mintAddress, 
            status.toLowerCase() === 'y'
        );
        console.log(chalk.green('\n✨ Transformation complete:'));
        console.log(chalk.cyan(JSON.stringify(updatedNFT, null, 2)));
    } catch (error) {
        console.error(chalk.red('🙀 Something went wrong with the spell:', error.message));
    }
}

async function main() {
    printBanner();
    
    while (true) {
        const choice = await showMenu();
        
        switch (choice) {
            case '1':
                await handleGenerateNFT();
                break;
            case '2':
                await handleGetNFT();
                break;
            case '3':
                await handleGetCollection();
                break;
            case '4':
                await handleUpdateMintStatus();
                break;
            case '5':
                console.log(chalk.magenta('\n😸 "We\'re all mad here. Goodbye!" 👋\n'));
                rl.close();
                process.exit(0);
            default:
                console.log(chalk.yellow('\n😺 Now that\'s a curious choice... Try again!'));
        }
    }
}

// Start the Cheshire Terminal
main().catch(error => {
    console.error(chalk.red('\n🙀 A most unfortunate error:', error));
    process.exit(1);
});
