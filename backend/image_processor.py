"""
Image Processing Module for SandVision
Uses OpenCV for image analysis and feature extraction
"""

import cv2
import numpy as np
from scipy import ndimage
import os


def analyze_sand_image(image_path):
    """
    Analyze sand image and extract features
    
    Args:
        image_path (str): Path to the image file
    
    Returns:
        dict: Dictionary containing extracted features
    """
    try:
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError("Could not read image file")

        # Convert to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Apply adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 11, 2
        )

        # Morphological operations
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

        # Find contours
        contours, _ = cv2.findContours(
            morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # Extract grain features
        grains = []
        for contour in contours:
            area = cv2.contourArea(contour)
            
            # Filter by minimum area (remove noise)
            if area < 10:
                continue

            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0:
                continue

            # Calculate circularity
            circularity = 4 * np.pi * area / (perimeter ** 2)

            # Get bounding rect
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = float(w) / h if h != 0 else 0

            # Solidity
            hull = cv2.convexHull(contour)
            hull_area = cv2.contourArea(hull)
            solidity = float(area) / hull_area if hull_area > 0 else 0

            grains.append({
                'area': area,
                'perimeter': perimeter,
                'circularity': circularity,
                'aspect_ratio': aspect_ratio,
                'solidity': solidity,
                'equivalent_diameter': np.sqrt(4 * area / np.pi)
            })

        # Remove temporary file
        if os.path.exists(image_path):
            os.remove(image_path)

        return {
            'total_grains': len(grains),
            'grains': grains,
            'image_shape': image.shape,
            'image_area': image.shape[0] * image.shape[1]
        }

    except Exception as e:
        print(f"Error in analyze_sand_image: {str(e)}")
        raise


def get_grain_statistics(grains):
    """
    Calculate statistics from grain measurements
    """
    if not grains:
        return {}

    areas = [g['area'] for g in grains]
    diameters = [g['equivalent_diameter'] for g in grains]
    circularities = [g['circularity'] for g in grains]

    return {
        'avg_area': np.mean(areas),
        'avg_diameter': np.mean(diameters),
        'avg_circularity': np.mean(circularities),
        'std_area': np.std(areas),
        'std_diameter': np.std(diameters),
        'min_area': np.min(areas),
        'max_area': np.max(areas),
        'min_diameter': np.min(diameters),
        'max_diameter': np.max(diameters)
    }


def classify_by_size(grains, percentiles=True):
    """
    Classify grains by size categories
    Uses percentile-based classification
    """
    if not grains:
        return {'fine': [], 'medium': [], 'coarse': []}

    diameters = [g['equivalent_diameter'] for g in grains]
    
    if percentiles:
        # 33rd and 67th percentile for classification
        p33 = np.percentile(diameters, 33)
        p67 = np.percentile(diameters, 67)
    else:
        # Fixed size thresholds (in pixels)
        p33 = 5
        p67 = 15

    fine = []
    medium = []
    coarse = []

    for grain in grains:
        d = grain['equivalent_diameter']
        if d < p33:
            fine.append(grain)
        elif d < p67:
            medium.append(grain)
        else:
            coarse.append(grain)

    return {
        'fine': fine,
        'medium': medium,
        'coarse': coarse,
        'thresholds': {'p33': p33, 'p67': p67}
    }
