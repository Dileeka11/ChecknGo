"""
ChecknGo - Prediction API Script
Called from Node.js via python-shell to predict fruit/vegetable from image
"""

import sys
import json
import base64
import os
from io import BytesIO

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import numpy as np
from PIL import Image

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'fruit_model.h5')
CLASS_INDICES_PATH = os.path.join(SCRIPT_DIR, 'class_indices.json')

# Image settings (must match training)
IMG_SIZE = 224

def load_model():
    """Load the trained model"""
    from tensorflow import keras
    return keras.models.load_model(MODEL_PATH)

def load_class_indices():
    """Load class indices mapping"""
    with open(CLASS_INDICES_PATH, 'r') as f:
        class_indices = json.load(f)
    # Reverse mapping (index -> name)
    return {v: k for k, v in class_indices.items()}

def preprocess_image(base64_data):
    """Preprocess base64 image for prediction"""
    # Remove data URL prefix if present
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    
    # Decode base64 to bytes
    image_bytes = base64.b64decode(base64_data)
    
    # Open image
    img = Image.open(BytesIO(image_bytes))
    
    # Convert to RGB if needed
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Resize to model input size
    img_resized = img.resize((IMG_SIZE, IMG_SIZE))
    
    # Convert to array and normalize
    img_array = np.array(img_resized) / 255.0
    
    # Add batch dimension
    return np.expand_dims(img_array, axis=0)

def predict(model, idx_to_class, image_data):
    """Run prediction on image"""
    # Preprocess
    img_batch = preprocess_image(image_data)
    
    # Predict
    predictions = model.predict(img_batch, verbose=0)
    
    # Get predicted class
    predicted_idx = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_idx] * 100)
    fruit_name = idx_to_class[predicted_idx]
    
    # Get top 5 predictions
    top_5_idx = np.argsort(predictions[0])[-5:][::-1]
    top_5 = [
        {"name": idx_to_class[int(i)], "confidence": float(predictions[0][i] * 100)}
        for i in top_5_idx
    ]
    
    return {
        "success": True,
        "prediction": {
            "fruit": fruit_name.title(),  # Capitalize first letter
            "confidence": round(confidence, 2),
            "top5": top_5
        }
    }

def main():
    try:
        # Read input from stdin (base64 image data)
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        image_data = data.get('imageData', '')
        
        if not image_data:
            print(json.dumps({"success": False, "error": "No image data provided"}))
            return
        
        # Load model and class indices
        model = load_model()
        idx_to_class = load_class_indices()
        
        # Run prediction
        result = predict(model, idx_to_class, image_data)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
