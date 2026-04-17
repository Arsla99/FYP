"""
Emotion Recognition API for Jupyter/Colab Notebooks
Uses nest_asyncio to handle event loop conflicts

SETUP INSTRUCTIONS:
==================
Run this in a Colab/Jupyter cell FIRST:
!pip install fastapi uvicorn nest-asyncio pyngrok modelscope funasr soundfile librosa pydub

Then run this entire file in a single cell.
"""

# Install dependencies (uncomment if running in Colab/Jupyter)
# !pip install fastapi uvicorn nest-asyncio pyngrok modelscope funasr soundfile librosa pydub

import nest_asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
import uvicorn
import os
from pathlib import Path
import tempfile
import logging
import asyncio
from threading import Thread

# Apply nest_asyncio to allow nested event loops
nest_asyncio.apply()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Emotion Recognition API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable for the model
emotion_model = None

def load_emotion_model():
    """Load the emotion recognition model"""
    global emotion_model
    try:
        from modelscope.pipelines import pipeline
        from modelscope.utils.constant import Tasks
        
        logger.info("Loading emotion recognition model...")
        emotion_model = pipeline(
            task=Tasks.emotion_recognition,
            model='iic/emotion2vec_base_finetuned',
            model_revision='v2.0.4'
        )
        logger.info("Model loaded successfully!")
        return True
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_emotion_model()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": emotion_model is not None,
        "service": "Emotion Recognition API"
    }

@app.post("/emotion_recognition")
async def recognize_emotion(file: UploadFile = File(...)):
    """
    Recognize emotion from audio file
    
    Args:
        file: Audio file (WAV, MP3, etc.)
    
    Returns:
        JSON with emotion labels and scores
    """
    if emotion_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            # Write uploaded file to temp file
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        logger.info(f"Processing audio file: {file.filename}")
        
        # Run emotion recognition
        result = emotion_model(temp_path)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        logger.info(f"Emotion recognition result: {result}")
        
        return {
            "success": True,
            "filename": file.filename,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.post("/predict")
async def predict_emotion(file: UploadFile = File(...)):
    """
    Legacy endpoint for backward compatibility
    Same as /emotion_recognition
    """
    return await recognize_emotion(file)

def start_server(port=8000, ngrok_authtoken=None):
    """
    Start the FastAPI server with ngrok tunnel (Notebook-compatible)
    
    Args:
        port: Local port to run the server (default: 8000)
        ngrok_authtoken: Optional ngrok auth token for public URL
    """
    # Load model first
    load_emotion_model()
    
    # Setup ngrok if authtoken provided
    public_url = None
    if ngrok_authtoken:
        try:
            ngrok.set_auth_token(ngrok_authtoken)
            public_url = ngrok.connect(port)
            logger.info(f"🌐 Public URL: {public_url}")
        except Exception as e:
            logger.warning(f"Could not setup ngrok: {e}")
            logger.info("Please visit https://ngrok.com/ to get your authtoken")
    else:
        logger.info("Setting up ngrok tunnel...")
        logger.info("Please visit https://ngrok.com/ to get your authtoken")
        logger.info("Then run: ngrok.set_auth_token('YOUR_AUTHTOKEN_HERE')")
        try:
            public_url = ngrok.connect(port)
            logger.info(f"🌐 Public URL: {public_url}")
        except Exception as e:
            logger.warning(f"Ngrok setup failed: {e}")
    
    logger.info("🚀 FastAPI server is running!")
    logger.info(f"📝 Local URL: http://localhost:{port}")
    logger.info(f"📝 API Documentation: http://localhost:{port}/docs")
    logger.info(f"❤️ Health Check: http://localhost:{port}/health")
    logger.info(f"🎯 Emotion Recognition: http://localhost:{port}/emotion_recognition")
    
    # Run server in a way that works with notebooks
    config = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config)
    
    # Run in a thread to avoid blocking
    thread = Thread(target=server.run, daemon=True)
    thread.start()
    
    return server, public_url

# Quick start function for notebooks
def quick_start(ngrok_token=None, port=8000):
    """
    Quick start for Jupyter/Colab notebooks
    
    Usage:
        server, url = quick_start(ngrok_token='YOUR_TOKEN', port=8000)
    """
    return start_server(port=port, ngrok_authtoken=ngrok_token)

# For Jupyter/Colab notebooks - Example usage:
"""
COPY AND PASTE THIS INTO YOUR COLAB/JUPYTER NOTEBOOK:
=====================================================

# Cell 1: Install dependencies
!pip install fastapi uvicorn nest-asyncio pyngrok modelscope funasr soundfile librosa pydub

# Cell 2: Copy the entire emotion_notebook.py code here

# Cell 3: Start the server
server, public_url = quick_start(ngrok_token='YOUR_NGROK_TOKEN_HERE', port=8000)
print(f"Server running at: {public_url}")

# Cell 4: Test the API
import requests
health = requests.get(f"{public_url}/health")
print(health.json())

# The server will keep running in the background!
"""

if __name__ == "__main__":
    # Direct execution example
    print("="*60)
    print("EMOTION RECOGNITION API - NOTEBOOK VERSION")
    print("="*60)
    print("\nTo use in Colab/Jupyter:")
    print("1. Run: !pip install fastapi uvicorn nest-asyncio pyngrok modelscope funasr soundfile librosa pydub")
    print("2. Copy this entire file into a notebook cell")
    print("3. Run: server, url = quick_start(ngrok_token='YOUR_TOKEN')")
    print("="*60)
