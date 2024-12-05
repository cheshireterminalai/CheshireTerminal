curl https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev \
	-X POST \
	-d '{"inputs": "Astronaut riding a horse"}' \
	-H 'Content-Type: application/json' \
	-H "Authorization: Bearer hf_52582552255225522552255225522552"