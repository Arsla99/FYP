"""
Emotion Recognition API using ModelScope's emotion2vec
Standalone Flask server for production use
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Global variable for the model
emotion_model = None

def load_emotion_model():
    """Load the emotion recognition model from ModelScope"""
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
        logger.info("Install required packages: pip install modelscope funasr")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": emotion_model is not None,
        "service": "Emotion Recognition API"
    })

@app.route('/emotion_recognition', methods=['POST'])
def recognize_emotion():
    """
    Recognize emotion from audio file
    
    Expected: multipart/form-data with 'file' field containing audio
    Returns: JSON with emotion labels and scores
    """
    if emotion_model is None:
        return jsonify({
            "success": False,
            "error": "Model not loaded. Please restart the service."
        }), 503
    
    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({
            "success": False,
            "error": "No file provided. Please upload an audio file."
        }), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({
            "success": False,
            "error": "Empty filename"
        }), 400
    
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        logger.info(f"Processing audio file: {file.filename}")
        
        # Run emotion recognition
        result = emotion_model(temp_path)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        logger.info(f"Emotion recognition result: {result}")
        
        return jsonify({
            "success": True,
            "filename": file.filename,
            "result": result
        })
        
    except Exception as e:
        logger.error(f"Error processing audio: {e}")
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        return jsonify({
            "success": False,
            "error": f"Error processing audio: {str(e)}"
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """
    Legacy endpoint for backward compatibility
    Same as /emotion_recognition
    """
    return recognize_emotion()

if __name__ == '__main__':
    # Load model on startup
    if load_emotion_model():
        logger.info("🚀 Starting Emotion Recognition API on port 5001")
        logger.info("📝 API Endpoints:")
        logger.info("   - Health Check: http://localhost:5001/health")
        logger.info("   - Emotion Recognition: http://localhost:5001/emotion_recognition")
        logger.info("   - Legacy Predict: http://localhost:5001/predict")
        app.run(debug=True, host="0.0.0.0", port=5001)
    else:
        logger.error("❌ Failed to load model. Server not started.")
