curl -X POST http://localhost:3000/send -H "Content-Type: application/json" -d '{
  "from": {"secretKey": [<your_keypair_secret_array>]},
  "to": "RecipientPublicKeyHere",
  "lamports": 1000000
}'