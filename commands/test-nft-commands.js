import { nftCommands } from "./nft-commands.js";

async function testNFTCommands() {
    try {
        console.log('Testing NFT Commands...\n');

        // 1. Generate an NFT
        console.log('1. Generating NFT...');
        const nftData = await nftCommands.generate({
            prompt: "cosmic space exploration with vibrant nebulas",
            style: "digital art",
            attributes: [
                { trait_type: "Theme", value: "Space" },
                { trait_type: "Color Scheme", value: "Vibrant" }
            ]
        });
        console.log('Generated NFT:', nftData, '\n');

        // 2. Save the NFT metadata
        console.log('2. Saving NFT metadata...');
        const savedNFT = await nftCommands.save(nftData);
        console.log('Saved NFT:', savedNFT, '\n');

        // 3. Retrieve the NFT by mint address
        console.log('3. Retrieving NFT...');
        const retrievedNFT = await nftCommands.get(savedNFT.mint_address);
        console.log('Retrieved NFT:', retrievedNFT, '\n');

        // 4. Update mint status
        console.log('4. Updating mint status...');
        const mintedNFT = await nftCommands.updateMintStatus(savedNFT.mint_address, true);
        console.log('Updated NFT:', mintedNFT, '\n');

        // 5. Get collection
        console.log('5. Getting collection...');
        const collection = await nftCommands.getCollection(savedNFT.collection_id || 'default');
        console.log('Collection:', collection, '\n');

        console.log('All NFT commands tested successfully!');
    } catch (error) {
        console.error('Error testing NFT commands:', error);
    }
}

// Run the test
testNFTCommands().catch(console.error);
