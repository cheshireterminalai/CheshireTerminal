import torch
from diffusers import StableDiffusionPipeline
import argparse
import sys
import os

def generate_image(prompt, output_path, model_path):
    try:
        print(f"Checking if model exists at: {model_path}")
        if not os.path.exists(model_path):
            print(f"Error: Model file not found at {model_path}")
            sys.exit(1)
            
        print("Loading base model...")
        
        # Initialize with base model
        pipe = StableDiffusionPipeline.from_pretrained(
            "CompVis/stable-diffusion-v1-4",
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            safety_checker=None
        )
        
        print("Base model loaded successfully")
        
        # Check device availability
        if torch.cuda.is_available():
            print("Using CUDA device")
            device = "cuda"
        elif torch.backends.mps.is_available():
            print("Using MPS device (Apple Silicon)")
            device = "mps"
        else:
            print("Using CPU")
            device = "cpu"
            
        pipe = pipe.to(device)
            
        # Enable memory efficient attention if available
        if hasattr(pipe, 'enable_attention_slicing'):
            pipe.enable_attention_slicing()
            
        print("Model loaded successfully!")
        
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Generate the image
        print(f"Generating image with prompt: {prompt}")
        with torch.inference_mode():
            image = pipe(
                prompt=prompt,
                negative_prompt="blurry, low quality, distorted, deformed",
                num_inference_steps=50,
                guidance_scale=7.5,
            ).images[0]
        
        # Save the image
        image.save(output_path, format='PNG')
        print(f"Image saved to: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error during image generation: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate NFT image using Stable Diffusion')
    parser.add_argument('--prompt', required=True, help='The prompt for image generation')
    parser.add_argument('--output', required=True, help='Output path for the generated image')
    parser.add_argument('--model', default="/Users/8bit/Downloads/eliza-main/models/stablediffusion/sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors",
                        help='Path to the model file')
    
    args = parser.parse_args()
    generate_image(args.prompt, args.output, args.model)
