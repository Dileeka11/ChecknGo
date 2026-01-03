# ChecknGo - Fruit Recognition Model

## Quick Start

### Load Model (Python)
```python
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import json

# Load model
model = keras.models.load_model('fruit_model.h5')

# Load class mapping
with open('class_indices.json', 'r') as f:
    class_map = json.load(f)

# Reverse mapping (index -> name)
idx_to_name = {v: k for k, v in class_map.items()}

# Predict function
def predict_fruit(image_path):
    # Load and preprocess
    img = Image.open(image_path).resize((224, 224))
    img_array = np.array(img) / 255.0
    img_batch = np.expand_dims(img_array, axis=0)
    
    # Predict
    predictions = model.predict(img_batch)
    predicted_idx = np.argmax(predictions[0])
    confidence = predictions[0][predicted_idx] * 100
    fruit_name = idx_to_name[predicted_idx]
    
    return fruit_name, confidence

# Example
fruit, conf = predict_fruit('test.jpg')
print(f"{fruit}: {conf:.1f}%")
```

## Model Info
- **Classes**: 36
- **Input**: 224x224 RGB images
- **Output**: Softmax probabilities
- **Architecture**: MobileNetV2

## Supported Fruits
apple, banana, beetroot, bell pepper, cabbage, capsicum, carrot, cauliflower, chilli pepper, corn, cucumber, eggplant, garlic, ginger, grapes, jalepeno, kiwi, lemon, lettuce, mango...

## Files
- `fruit_model.h5` - Main model (use this!)
- `fruit_model.tflite` - Mobile version (optional)
- `class_indices.json` - Class mapping
- `model_info.json` - Model metadata

## Integration with ChecknGo
1. Load model in Express.js backend
2. Accept image from React frontend
3. Return prediction + confidence
4. Calculate price: weight × unit_price
5. Display and print bill

---
Project: ChecknGo Smart Checkout
Created: 20251130_123339
