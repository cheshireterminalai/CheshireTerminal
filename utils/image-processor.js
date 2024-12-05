import { spawn } from "child_process";
import path from "path";

export const imageProcessor = {
    modelPath: process.env.STABLE_DIFFUSION_MODEL_PATH,

    async processImage(buffer, options = {}) {
        try {
            const outputPath = path.join(process.cwd(), 'generated', `generated_image_${Date.now()}.png`);
            
            // Ensure the model path is set
            if (!this.modelPath) {
                throw new Error('Stable Diffusion model path not configured');
            }

            // Process the image using the specified model
            const pythonProcess = spawn('python3', [
                path.join(process.cwd(), 'generate_image.py'),
                '--model_path', this.modelPath,
                '--output_path', outputPath
            ]);

            return new Promise((resolve, reject) => {
                let error = '';

                pythonProcess.stderr.on('data', (data) => {
                    error += data;
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        reject(new Error(`Image processing failed: ${error}`));
                        return;
                    }

                    resolve({
                        url: outputPath,
                        width: options.width || 1024,
                        height: options.height || 1024
                    });
                });
            });
        } catch (error) {
            console.error('Image processing error:', error);
            throw error;
        }
    }
};
