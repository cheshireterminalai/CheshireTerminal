import torch
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
from flask import Flask, request, send_file, jsonify
import os
import uuid
from PIL import Image
import io

app = Flask(__name__)

def initialize_pipeline():
    # Initialize Stable Diffusion with a standard model
    model_id = "runwayml/stable-diffusion-v1-5"
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float32,  # Use float32 for better compatibility
        safety_checker=None
    )
    
    # Use DPM-Solver++ scheduler for better results
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    
    # Move to GPU if available, otherwise use CPU
    device = "cuda" if torch.cuda.is_available() else "cpu"
    pipe = pipe.to(device)
    
    # Enable memory efficient attention
    pipe.enable_attention_slicing()
    if torch.cuda.is_available():
        pipe.enable_xformers_memory_efficient_attention()
    
    return pipe

# Initialize the pipeline
pipe = initialize_pipeline()
print(f"Model loaded on device: {pipe.device}")

@app.route('/generate', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({'status': 'error', 'message': 'No prompt provided'}), 400
            
        prompt = data.get('prompt', '')
        print(f"Generating image for prompt: {prompt}")
        
        # Generate image with fixed parameters
        with torch.inference_mode():
            image = pipe(
                prompt=prompt,
                num_inference_steps=25,
                guidance_scale=7.5,
                height=512,
                width=512,
                negative_prompt="blurry, bad art, ugly, poorly drawn, deformed"
            ).images[0]
        
        # Generate unique filename and save
        filename = f"generated_{uuid.uuid4()}.png"
        output_dir = os.path.join(os.getcwd(), 'cheshireterminal', 'generated', 'images')
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)
        
        image.save(output_path)
        print(f"Image saved to: {output_path}")
        
        return jsonify({
            'status': 'success',
            'path': output_path,
            'filename': filename
        })
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model': "runwayml/stable-diffusion-v1-5",
        'device': str(pipe.device)
    })

if __name__ == '__main__':
    print("Starting Stable Diffusion server...")
    app.run(host='0.0.0.0', port=5001)
