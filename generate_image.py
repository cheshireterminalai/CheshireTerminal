import argparse
import torch
from diffusers import StableDiffusionPipeline
from PIL import Image
import os
import time

def generate_image(model_path, prompt):
    # Initialize the pipeline
    pipe = StableDiffusionPipeline.from_single_file(
        model_path,
        torch_dtype=torch.float16,
        use_safetensors=True
    ).to("cuda")

    # Generate the image
    image = pipe(
        prompt=prompt,
        num_inference_steps=50,
        guidance_scale=7.5,
        width=768,
        height=768,
        negative_prompt="blurry, bad art, ugly, poorly drawn, deformed"
    ).images[0]

    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.getcwd(), "generated", "images")
    os.makedirs(output_dir, exist_ok=True)

    # Save the image with timestamp
    timestamp = int(time.time())
    output_path = os.path.join(output_dir, f"generated_{timestamp}.png")
    image.save(output_path)

    # Print the path for the Node.js process to capture
    print(output_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Path to the model file")
    parser.add_argument("--prompt", required=True, help="Prompt for image generation")
    args = parser.parse_args()

    generate_image(args.model, args.prompt)
