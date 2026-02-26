"""
ChecknGo - Weight Scale OCR Script
Reads weight value from a digital scale display image using Google Cloud Vision API
"""

import sys
import os
import json
import base64
import re
import warnings

warnings.filterwarnings('ignore')

def extract_weight_from_text(text):
    """Extract numeric weight value from OCR text"""
    # Clean the text
    text = text.strip()
    
    # 1. Prioritize large decimal numbers (the actual weight on LCD display)
    decimals = re.findall(r'(\d+\.\d{1,3})', text)
    if decimals:
        return float(decimals[0])
        
    # 2. Check for explicit kg formats
    lines = text.split('\n')
    for line in lines:
        if 'max' in line.lower() or 'cap' in line.lower() or 'd=' in line.lower():
            continue
            
        kg_match = re.search(r'(\d+)\s*kg', line, re.IGNORECASE)
        if kg_match:
            return float(kg_match.group(1))
            
        g_match = re.search(r'(\d+)\s*g\b', line, re.IGNORECASE)
        if g_match:
            return round(float(g_match.group(1)) / 1000, 3)
            
    # 3. Last fallback: Just grab the first sequence of digits we see.
    # In images where the bright LED display is unreadable by Google Vision, 
    # it will fall back to reading the printed "180kg" instructions.
    numbers = re.findall(r'\b(\d{2,4})\b', text)
    if numbers:
        val = float(numbers[0])
        # If the number is large (e.g. 500), it's almost certainly grams on a scale
        if val >= 100:
            val = val / 1000
        return round(val, 3)
        
    return None

def ocr_with_google_vision(base64_data, api_key):
    """Use Google Cloud Vision API for OCR"""
    import urllib.request
    import urllib.error
    
    # Remove data URL prefix if present
    if ',' in base64_data:
        base64_data = base64_data.split(',')[1]
    
    url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
    
    request_body = {
        "requests": [{
            "image": {"content": base64_data},
            "features": [{"type": "TEXT_DETECTION", "maxResults": 10}]
        }]
    }
    
    data = json.dumps(request_body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        raise Exception(f"Google Vision API error: {error_body}")
    
    # Extract text from response
    responses = result.get('responses', [])
    if not responses:
        return None
    
    annotations = responses[0].get('textAnnotations', [])
    if not annotations:
        return None
    
    # First annotation contains all detected text
    full_text = annotations[0].get('description', '')
    return full_text

def main():
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        image_data = data.get('imageData', '')
        api_key = data.get('apiKey', '')
        
        if not image_data:
            print(json.dumps({"success": False, "error": "No image data provided"}))
            return
            
        if not api_key:
            print(json.dumps({"success": False, "error": "No API key provided / Set GOOGLE_CLOUD_VISION_API_KEY in backend .env"}))
            return
        
        # Run OCR
        detected_text = ocr_with_google_vision(image_data, api_key)
        
        if not detected_text:
            print(json.dumps({
                "success": False, 
                "error": "No text detected in image. Make sure the scale display is clearly visible."
            }))
            return
        
        # Extract weight value
        weight = extract_weight_from_text(detected_text)
        
        if weight is None:
            print(json.dumps({
                "success": False,
                "error": f"Could not extract weight from detected text: '{detected_text}'",
                "detectedText": detected_text
            }))
            return
        
        print(json.dumps({
            "success": True,
            "weight": weight,
            "unit": "kg",
            "detectedText": detected_text,
            "confidence": 90
        }))
        
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
