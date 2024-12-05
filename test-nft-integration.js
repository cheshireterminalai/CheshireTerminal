import NFTGenerationClient from "./client/nft-client.js";
import nftDb from "./services/nft-db.js";

async function testNFTIntegration() {
    try {
        // Initialize NFT client
        const client = new NFTGenerationClient();

        console.log('Starting NFT generation and storage test...');

        // 1. Generate an NFT with Metaplex standard metadata
        const nftData = {
            name: "AI Generated Art #1",
            description: "A unique piece of AI-generated artwork",
            image: "generated/art1.png",
            attributes: [
                { trait_type: "Style", value: "Abstract" },
                { trait_type: "Colors", value: "Vibrant" }
            ],
            properties: {
                category: "image",
                files: []
            }
        };

        // 2. Start the generation process
        console.log('Starting NFT generation...');
        const generationStatus = await client.startGeneration({
            count: 1,
            style: "abstract",
            prompt: "vibrant abstract artwork with dynamic shapes"
        });
        console.log('Generation started:', generationStatus);

        // 3. Poll for generation completion
        await new Promise((resolve) => {
            client.pollStatus((error, status) => {
                if (error) {
                    console.error('Generation error:', error);
                    return;
                }
                console.log('Generation status:', status);
                if (!status.isGenerating) {
                    resolve();
                }
            });
        });

        // 4. Store pre-mint image
        console.log('Uploading pre-mint image...');
        const preMintFile = await nftDb.uploadFile(
            'pre_mint_image',
            nftData.image,
            {
                contentType: 'image/png',
                isCdn: false
            }
        );
        console.log('Pre-mint image uploaded:', preMintFile);

        // 5. Save NFT metadata
        console.log('Saving NFT metadata...');
        const mintAddress = 'test_mint_address_' + Date.now();
        const ownerAddress = 'test_owner_address';
        
        const savedNFT = await nftDb.saveNFT(
            mintAddress,
            ownerAddress,
            client.createMetadata(nftData)
        );
        console.log('NFT metadata saved:', savedNFT);

        // 6. Verify stored NFT data
        console.log('Verifying stored NFT...');
        const storedNFT = await nftDb.getNFTByMintAddress(mintAddress);
        console.log('Retrieved NFT:', storedNFT);

        console.log('NFT integration test completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testNFTIntegration().catch(console.error);
