import os
import sys

def check_model():
    model_path = "/Users/8bit/Downloads/eliza-main/models/stablediffusion/sd3.5_medium_incl_clips_t5xxlfp8scaled.safetensors"
    
    print(f"\nChecking Stable Diffusion model...")
    print(f"Model path: {model_path}")
    
    # Check if file exists
    if os.path.exists(model_path):
        print("✓ Model file exists")
        
        # Get file size
        size_bytes = os.path.getsize(model_path)
        size_gb = size_bytes / (1024 * 1024 * 1024)
        print(f"✓ Model size: {size_gb:.2f} GB")
        
        # Check permissions
        permissions = oct(os.stat(model_path).st_mode)[-3:]
        print(f"✓ File permissions: {permissions}")
        
        # Check if readable
        if os.access(model_path, os.R_OK):
            print("✓ File is readable")
        else:
            print("✗ File is not readable")
            
    else:
        print("✗ Model file not found!")
        # Check if directory exists
        dir_path = os.path.dirname(model_path)
        if os.path.exists(dir_path):
            print(f"  - Parent directory exists: {dir_path}")
            print("  - Contents of parent directory:")
            for file in os.listdir(dir_path):
                print(f"    {file}")
        else:
            print(f"  - Parent directory does not exist: {dir_path}")

if __name__ == "__main__":
    check_model()
