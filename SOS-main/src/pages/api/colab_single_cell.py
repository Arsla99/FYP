"""
🎯 EMOTION RECOGNITION API - SINGLE CELL VERSION FOR COLAB
===========================================================

INSTRUCTIONS:
1. Copy this ENTIRE cell into Google Colab
2. Replace YOUR_NGROK_TOKEN_HERE with your token from https://dashboard.ngrok.com/
3. Run the cell
4. Wait 5-7 minutes (model downloads on first run)
5. Use the public URL to access the API

QUICK START:
- Get ngrok token: https://dashboard.ngrok.com/get-started/your-authtoken
- Model size: ~1GB (downloads automatically)
- Free tier: Works fine on Colab free!
"""

# ============================================================
# STEP 1: Install dependencies (uncomment on first run)
# ============================================================
# !pip install -q fastapi uvicorn nest-asyncio pyngrok modelscope funasr soundfile librosa pydub

# ============================================================
# STEP 2: Import and setup
# ============================================================
import nest_asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pyngrok import ngrok
import uvicorn
import os, tempfile, logging
from pathlib import Path
from threading import Thread

nest_asyncio.apply()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================
# STEP 3: Create FastAPI app
# ============================================================
app = FastAPI(title="Emotion Recognition API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

emotion_model = None

def load_model():
    global emotion_model
    try:
        from modelscope.pipelines import pipeline
        from modelscope.utils.constant import Tasks
        
        print("\n📥 Loading emotion model (1GB download on first run)...")
        emotion_model = pipeline(
            task=Tasks.emotion_recognition,
            model='iic/emotion2vec_base_finetuned',
            model_revision='v2.0.4'
        )
        print("✅ Model loaded!")
        return True
    except Exception as e:
        print(f"❌ Model load failed: {e}")
        return False

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": emotion_model is not None}

@app.post("/emotion_recognition")
async def recognize(file: UploadFile = File(...)):
    if emotion_model is None:
        raise HTTPException(503, "Model not loaded")
    
    if not file.content_type.startswith('audio/'):
        raise HTTPException(400, "Must be audio file")
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp:
            temp.write(await file.read())
            temp_path = temp.name
        
        result = emotion_model(temp_path)
        os.unlink(temp_path)
        
        return {"success": True, "filename": file.filename, "result": result}
    except Exception as e:
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        raise HTTPException(500, f"Error: {str(e)}")

# ============================================================
# STEP 4: Start server function
# ============================================================
def start(ngrok_token=None, port=8000):
    # Load model
    load_model()
    
    # Setup ngrok
    if ngrok_token:
        ngrok.set_auth_token(ngrok_token)
        public_url = ngrok.connect(port)
        
        print("\n" + "="*70)
        print("🎉 EMOTION RECOGNITION API IS LIVE!")
        print("="*70)
        print(f"\n🌐 PUBLIC URL: {public_url}")
        print(f"📖 API DOCS:   {public_url}/docs")
        print(f"❤️  HEALTH:    {public_url}/health")
        print(f"🎯 ENDPOINT:   {public_url}/emotion_recognition")
        print("\n📝 Save this URL for your Next.js app!")
        print("⚠️  Keep this cell running to maintain the server")
        print("="*70 + "\n")
    else:
        print("⚠️ No ngrok token provided!")
        print("Get your token: https://dashboard.ngrok.com/get-started/your-authtoken")
    
    # Start server in thread
    config = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config)
    thread = Thread(target=server.run, daemon=True)
    thread.start()
    
    return server, public_url if ngrok_token else None

# ============================================================
# STEP 5: RUN THE SERVER
# ============================================================

# 🔑 PASTE YOUR NGROK TOKEN HERE:
NGROK_TOKEN = "YOUR_NGROK_TOKEN_HERE"  # ⬅️ REPLACE THIS!

# Start the server
server, url = start(ngrok_token=NGROK_TOKEN, port=8000)

# Test the API
if url:
    import requests
    try:
        health_check = requests.get(f"{url}/health", timeout=10)
        print(f"🧪 Health Check: {health_check.json()}")
    except Exception as e:
        print(f"⏳ Server starting... (wait 10 seconds and try again)")

print("\n✅ Setup complete! Server is running in background.")
print("📤 To test: Upload an audio file using the '/docs' endpoint")
