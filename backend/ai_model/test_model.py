"""
ChecknGo - Local Model Test Script
Test your trained fruit recognition model on your computer!

Location: Save this as "test_model.py" in D:\final project\Model\
"""

import os
import json
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

print("=" * 70)
print("🧪 CHECKN GO - MODEL TEST SCRIPT")
print("=" * 70)

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
# Update this path to your model location
MODEL_PATH = r"D:\final project\Model\fruit_model.h5"
CLASS_INDICES_PATH = r"D:\final project\Model\class_indices.json"

# Image settings (must match training)
IMG_SIZE = 224  # Your model expects 224x224 images

# -----------------------------------------------------------------------------
# LOAD MODEL
# -----------------------------------------------------------------------------
print("\n📂 Loading model...")
print(f"   Location: {MODEL_PATH}")

try:
    model = keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
    print(f"   Input shape: {model.input_shape}")
    print(f"   Output shape: {model.output_shape}")
except Exception as e:
    print(f"❌ Error loading model: {str(e)}")
    print("\n💡 Solutions:")
    print("   1. Check if file exists: fruit_model.h5")
    print("   2. Install TensorFlow: pip install tensorflow")
    print("   3. Check file path is correct")
    exit(1)

# -----------------------------------------------------------------------------
# LOAD CLASS MAPPING
# -----------------------------------------------------------------------------
print("\n📋 Loading class mapping...")
print(f"   Location: {CLASS_INDICES_PATH}")

try:
    with open(CLASS_INDICES_PATH, 'r') as f:
        class_indices = json.load(f)
    
    # Create reverse mapping (index -> name)
    idx_to_class = {v: k for k, v in class_indices.items()}
    
    print("✅ Class mapping loaded!")
    print(f"   Total classes: {len(class_indices)}")
    
    # Show first 10 classes
    print("\n📝 Sample classes:")
    for i, (name, idx) in enumerate(list(class_indices.items())[:10]):
        print(f"   {idx:2d} → {name}")
    if len(class_indices) > 10:
        print(f"   ... and {len(class_indices) - 10} more")
        
except Exception as e:
    print(f"❌ Error loading class mapping: {str(e)}")
    print("\n💡 Make sure class_indices.json exists in the same folder!")
    exit(1)

# -----------------------------------------------------------------------------
# PREDICTION FUNCTION
# -----------------------------------------------------------------------------
def predict_fruit(image_path, show_details=True):
    """
    Predict fruit from image
    
    Args:
        image_path: Path to image file
        show_details: Show detailed prediction info
    
    Returns:
        tuple: (fruit_name, confidence, all_predictions)
    """
    try:
        # Load and preprocess image
        img = Image.open(image_path)
        
        # Convert to RGB if needed (handles PNG with alpha)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to model input size
        img_resized = img.resize((IMG_SIZE, IMG_SIZE))
        
        # Convert to array and normalize
        img_array = np.array(img_resized) / 255.0
        
        # Add batch dimension
        img_batch = np.expand_dims(img_array, axis=0)
        
        # Predict
        predictions = model.predict(img_batch, verbose=0)
        
        # Get predicted class
        predicted_idx = np.argmax(predictions[0])
        confidence = predictions[0][predicted_idx] * 100
        fruit_name = idx_to_class[predicted_idx]
        
        # Get top 5 predictions
        top_5_idx = np.argsort(predictions[0])[-5:][::-1]
        top_5_predictions = [
            (idx_to_class[i], predictions[0][i] * 100)
            for i in top_5_idx
        ]
        
        if show_details:
            print(f"\n{'='*70}")
            print(f"📸 Image: {os.path.basename(image_path)}")
            print(f"{'='*70}")
            print(f"\n🎯 PREDICTION: {fruit_name.upper()}")
            print(f"💪 Confidence: {confidence:.2f}%")
            
            if confidence >= 90:
                print("✅ Very confident!")
            elif confidence >= 70:
                print("👍 Reasonably confident")
            else:
                print("⚠️  Low confidence - check image quality")
            
            print(f"\n📊 Top 5 Predictions:")
            for rank, (name, conf) in enumerate(top_5_predictions, 1):
                bar_length = int(conf / 2)
                bar = '█' * bar_length
                print(f"   {rank}. {name:20s} {conf:5.1f}% {bar}")
        
        return fruit_name, confidence, top_5_predictions
    
    except Exception as e:
        print(f"\n❌ Error predicting image: {str(e)}")
        return None, 0, []

# -----------------------------------------------------------------------------
# TEST SINGLE IMAGE
# -----------------------------------------------------------------------------
def test_single_image():
    """Test a single image"""
    print("\n" + "=" * 70)
    print("🖼️  TEST SINGLE IMAGE")
    print("=" * 70)
    
    # Ask for image path
    print("\n💡 Enter the full path to your test image")
    print("   Example: D:\\test_images\\apple.jpg")
    print("   Or drag and drop the file here!")
    
    image_path = input("\n📸 Image path: ").strip().strip('"')
    
    if not os.path.exists(image_path):
        print(f"\n❌ File not found: {image_path}")
        return
    
    # Predict
    fruit, conf, top_5 = predict_fruit(image_path, show_details=True)
    
    if fruit:
        # Price calculation demo
        print(f"\n💰 PRICE CALCULATION DEMO:")
        print(f"   If weight = 0.5 kg")
        
        # Sample prices (you'll replace these with real prices)
        sample_prices = {
            'apple': 200, 'banana': 150, 'orange': 180,
            'mango': 250, 'grape': 300
        }
        
        price_per_kg = sample_prices.get(fruit.lower(), 200)
        weight = 0.5
        total = price_per_kg * weight
        
        print(f"   {fruit}: Rs. {price_per_kg}/kg")
        print(f"   Total: Rs. {total:.2f}")

# -----------------------------------------------------------------------------
# BATCH TEST (TEST FOLDER OF IMAGES)
# -----------------------------------------------------------------------------
def test_batch_images():
    """Test multiple images in a folder"""
    print("\n" + "=" * 70)
    print("📁 BATCH TEST - TEST MULTIPLE IMAGES")
    print("=" * 70)
    
    # Ask for folder path
    print("\n💡 Enter the path to folder containing test images")
    print("   Example: D:\\test_images\\")
    
    folder_path = input("\n📁 Folder path: ").strip().strip('"')
    
    if not os.path.exists(folder_path):
        print(f"\n❌ Folder not found: {folder_path}")
        return
    
    # Get all image files
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    image_files = []
    
    for file in os.listdir(folder_path):
        if any(file.lower().endswith(ext) for ext in image_extensions):
            image_files.append(os.path.join(folder_path, file))
    
    if not image_files:
        print(f"\n❌ No images found in folder!")
        print(f"   Looking for: {', '.join(image_extensions)}")
        return
    
    print(f"\n✅ Found {len(image_files)} images")
    print(f"\n🔄 Testing all images...\n")
    
    # Test all images
    results = []
    for img_path in image_files:
        fruit, conf, _ = predict_fruit(img_path, show_details=False)
        if fruit:
            results.append((os.path.basename(img_path), fruit, conf))
            print(f"✓ {os.path.basename(img_path):30s} → {fruit:15s} ({conf:5.1f}%)")
    
    # Summary
    print(f"\n{'='*70}")
    print(f"📊 BATCH TEST SUMMARY")
    print(f"{'='*70}")
    print(f"Total images tested: {len(results)}")
    
    avg_confidence = sum([r[2] for r in results]) / len(results) if results else 0
    print(f"Average confidence: {avg_confidence:.1f}%")
    
    high_conf = sum(1 for r in results if r[2] >= 90)
    medium_conf = sum(1 for r in results if 70 <= r[2] < 90)
    low_conf = sum(1 for r in results if r[2] < 70)
    
    print(f"\nConfidence distribution:")
    print(f"   High (≥90%):   {high_conf:3d} images")
    print(f"   Medium (70-90%): {medium_conf:3d} images")
    print(f"   Low (<70%):    {low_conf:3d} images")

# -----------------------------------------------------------------------------
# LIVE CAMERA TEST (OPTIONAL)
# -----------------------------------------------------------------------------
def test_live_camera():
    """Test with webcam (requires opencv)"""
    print("\n" + "=" * 70)
    print("📷 LIVE CAMERA TEST")
    print("=" * 70)
    
    try:
        import cv2
        
        print("\n📹 Opening camera...")
        print("   Press 'SPACE' to capture and predict")
        print("   Press 'Q' to quit")
        
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ Cannot open camera!")
            return
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("❌ Failed to grab frame")
                break
            
            # Display frame
            cv2.putText(frame, "Press SPACE to predict, Q to quit", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 
                       0.7, (0, 255, 0), 2)
            
            cv2.imshow('ChecknGo - Camera Test', frame)
            
            key = cv2.waitKey(1) & 0xFF
            
            # Quit
            if key == ord('q'):
                break
            
            # Capture and predict
            elif key == ord(' '):
                # Save frame temporarily
                temp_path = "temp_capture.jpg"
                cv2.imwrite(temp_path, frame)
                
                print("\n📸 Captured! Predicting...")
                fruit, conf, top_5 = predict_fruit(temp_path, show_details=True)
                
                # Remove temp file
                os.remove(temp_path)
                
                print("\nPress SPACE for another capture, Q to quit")
        
        cap.release()
        cv2.destroyAllWindows()
        print("\n✅ Camera closed")
        
    except ImportError:
        print("\n❌ OpenCV not installed!")
        print("   Install with: pip install opencv-python")
        print("   Then run this option again")

# -----------------------------------------------------------------------------
# MAIN MENU
# -----------------------------------------------------------------------------
def main():
    """Main menu"""
    
    print("\n" + "=" * 70)
    print("🎯 CHOOSE TEST MODE")
    print("=" * 70)
    
    print("""
1. Test Single Image    - Predict one image with detailed results
2. Test Batch Images    - Test multiple images in a folder
3. Live Camera Test     - Use webcam for real-time testing
4. Exit

""")
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == '1':
        test_single_image()
        
        # Ask if want to test another
        again = input("\n🔄 Test another image? (y/n): ").lower()
        if again == 'y':
            main()
    
    elif choice == '2':
        test_batch_images()
        
        again = input("\n🔄 Test another batch? (y/n): ").lower()
        if again == 'y':
            main()
    
    elif choice == '3':
        test_live_camera()
        main()
    
    elif choice == '4':
        print("\n👋 Goodbye!")
        return
    
    else:
        print("\n❌ Invalid choice!")
        main()

# -----------------------------------------------------------------------------
# RUN SCRIPT
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user. Goodbye!")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        print("\n💡 If you need help, check:")
        print("   1. TensorFlow is installed: pip install tensorflow")
        print("   2. PIL is installed: pip install pillow")
        print("   3. Model files exist in correct location")
        print("   4. Image paths are correct")

print("\n" + "=" * 70)
print("🎊 Script finished!")
print("=" * 70)