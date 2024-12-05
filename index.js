const express = require('express');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const axios = require('axios');

const app = express();
app.use(express.json());

// Solana connection to the local validator
const connection = new Connection("http://127.0.0.1:8899", 'confirmed');

// Route to get Solana balance
app.get('/balance/:address', async (req, res) => {
  try {
    const publicKey = new PublicKey(req.params.address);
    const balance = await connection.getBalance(publicKey);
    res.json({ balance: balance / LAMPORTS_PER_SOL });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving balance');
  }
});

// Route to submit a transaction
app.post('/send', async (req, res) => {
  const { from, to, lamports } = req.body;

  try {
    const fromKeypair = Keypair.fromSecretKey(Uint8Array.from(from.secretKey));
    const toPublicKey = new PublicKey(to);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: lamports,
      })
    );

    const signature = await connection.sendTransaction(transaction, [fromKeypair]);
    res.json({ signature });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending transaction');
  }
});

// Start the AI agent server
app.listen(3000, () => {
  console.log('AI agent running at http://localhost:3000');
});