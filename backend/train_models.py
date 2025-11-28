
import os
import numpy as np
import cv2
from ml_model import get_classifier, get_detector
from image_processor import analyze_sand_image

# Paths to the uploaded images
IMAGE_PATHS = [
    r"C:/Users/Madan/.gemini/antigravity/brain/c6b1396d-a2b5-4526-85a5-1d1db4061331/uploaded_image_0_1764234426707.jpg",
    r"C:/Users/Madan/.gemini/antigravity/brain/c6b1396d-a2b5-4526-85a5-1d1db4061331/uploaded_image_1_1764234426707.jpg",
    r"C:/Users/Madan/.gemini/antigravity/brain/c6b1396d-a2b5-4526-85a5-1d1db4061331/uploaded_image_2_1764234426707.jpg",
    r"C:/Users/Madan/.gemini/antigravity/brain/c6b1396d-a2b5-4526-85a5-1d1db4061331/uploaded_image_3_1764234426707.jpg",
    r"C:/Users/Madan/.gemini/antigravity/brain/c6b1396d-a2b5-4526-85a5-1d1db4061331/uploaded_image_4_1764234426707.jpg"
]

def train_sand_detector():
    print("Training Sand Detector...")
    detector = get_detector()
    
    # Verify images exist
    valid_paths = []
    for path in IMAGE_PATHS:
        if os.path.exists(path):
            valid_paths.append(path)
        else:
            print(f"Warning: Image not found: {path}")
    
    if not valid_paths:
        print("No valid images found for training detector.")
        return

    detector.train(valid_paths)
    print("Sand Detector training complete.")

def train_grain_classifier():
    print("Training Grain Classifier...")
    classifier = get_classifier()
    
    all_grains = []
    
    # Extract grains from all images
    for path in IMAGE_PATHS:
        if not os.path.exists(path):
            continue
            
        print(f"Processing {path}...")
        try:
            # Note: analyze_sand_image deletes the file by default if it thinks it's temp.
            # We should make a copy or modify analyze_sand_image. 
            # Looking at image_processor.py, it deletes if os.path.exists(image_path).
            # To avoid deleting our source images, we'll copy them to a temp file first.
            
            import shutil
            temp_path = f"temp_train_{os.path.basename(path)}"
            shutil.copy(path, temp_path)
            
            results = analyze_sand_image(temp_path)
            if results and 'grains' in results:
                all_grains.extend(results['grains'])
                
        except Exception as e:
            print(f"Error processing {path}: {e}")

    if not all_grains:
        print("No grains extracted.")
        return

    print(f"Extracted {len(all_grains)} grains total.")

    # Auto-label grains based on size percentiles
    # This creates our "ground truth" for the ML model based on the current dataset
    diameters = [g['equivalent_diameter'] for g in all_grains]
    p33 = np.percentile(diameters, 33)
    p67 = np.percentile(diameters, 67)
    
    print(f"Auto-labeling thresholds: Fine < {p33:.2f}, Medium < {p67:.2f}, Coarse >= {p67:.2f}")

    X_train = []
    y_train = []

    for grain in all_grains:
        # Extract features
        features = [
            grain['area'],
            grain['perimeter'],
            grain['circularity'],
            grain['aspect_ratio'],
            grain['solidity'],
            grain['equivalent_diameter']
        ]
        
        # Determine label
        d = grain['equivalent_diameter']
        if d < p33:
            label = 0 # Fine
        elif d < p67:
            label = 1 # Medium
        else:
            label = 2 # Coarse
            
        X_train.append(features)
        y_train.append(label)

    X_train = np.array(X_train)
    y_train = np.array(y_train)

    print(f"Training data shape: {X_train.shape}")
    
    # Train the classifier
    classifier.train(X_train, y_train)
    print("Grain Classifier training complete.")

if __name__ == "__main__":
    train_sand_detector()
    train_grain_classifier()
