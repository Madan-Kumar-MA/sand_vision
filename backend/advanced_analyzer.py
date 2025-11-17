"""
Advanced image processing with additional analysis
"""

import cv2
import numpy as np
from scipy import ndimage
import matplotlib.pyplot as plt


class AdvancedImageAnalyzer:
    """Advanced image analysis capabilities"""

    @staticmethod
    def detect_edges(image_path):
        """Detect edges using Canny edge detection"""
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        return edges

    @staticmethod
    def extract_color_features(image_path):
        """Extract color histogram features"""
        image = cv2.imread(image_path)
        
        hist_b = cv2.calcHist([image], [0], None, [256], [0, 256])
        hist_g = cv2.calcHist([image], [1], None, [256], [0, 256])
        hist_r = cv2.calcHist([image], [2], None, [256], [0, 256])

        return {
            'blue_hist': hist_b.flatten().tolist(),
            'green_hist': hist_g.flatten().tolist(),
            'red_hist': hist_r.flatten().tolist()
        }

    @staticmethod
    def watershed_segmentation(image_path):
        """Advanced segmentation using watershed algorithm"""
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        sure_bg = cv2.dilate(thresh, kernel, iterations=3)

        dist_transform = cv2.distanceTransform(thresh, cv2.DIST_L2, 5)
        ret, sure_fg = cv2.threshold(dist_transform, 0.7 * dist_transform.max(), 255, 0)

        sure_fg = np.uint8(sure_fg)
        unknown = cv2.subtract(sure_bg, sure_fg)

        ret, markers = cv2.connectedComponents(sure_fg)
        markers = markers + 1
        markers[unknown == 255] = 0

        markers = cv2.watershed(image, markers)

        return markers

    @staticmethod
    def analyze_texture(image_path):
        """Analyze texture using Local Binary Patterns"""
        from skimage.feature import local_binary_pattern
        
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        lbp = local_binary_pattern(gray, 8, 1, method='uniform')
        hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, 10), range=(0, 9))

        return {
            'texture_histogram': hist.tolist(),
            'texture_mean': float(np.mean(lbp)),
            'texture_std': float(np.std(lbp))
        }

    @staticmethod
    def compare_images(image_path1, image_path2):
        """Compare two images using structural similarity"""
        from skimage.metrics import structural_similarity as ssim

        img1 = cv2.imread(image_path1, 0)
        img2 = cv2.imread(image_path2, 0)

        # Resize img2 to match img1 if needed
        if img1.shape != img2.shape:
            img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))

        mse = np.mean((img1.astype(float) - img2.astype(float)) ** 2)
        similarity = ssim(img1, img2)

        return {
            'mse': float(mse),
            'ssim': float(similarity)
        }

    @staticmethod
    def estimate_sand_composition(grains_dict):
        """Estimate composition from classified grains"""
        fine = grains_dict.get('fine', [])
        medium = grains_dict.get('medium', [])
        coarse = grains_dict.get('coarse', [])

        total = len(fine) + len(medium) + len(coarse)
        
        if total == 0:
            return {}

        # Calculate by count
        composition_count = {
            'fine_count': len(fine),
            'medium_count': len(medium),
            'coarse_count': len(coarse),
            'total_count': total
        }

        # Calculate by area
        fine_area = sum(g['area'] for g in fine) if fine else 0
        medium_area = sum(g['area'] for g in medium) if medium else 0
        coarse_area = sum(g['area'] for g in coarse) if coarse else 0
        total_area = fine_area + medium_area + coarse_area

        if total_area > 0:
            composition_area = {
                'fine_area_pct': (fine_area / total_area) * 100,
                'medium_area_pct': (medium_area / total_area) * 100,
                'coarse_area_pct': (coarse_area / total_area) * 100
            }
        else:
            composition_area = {}

        return {**composition_count, **composition_area}

    @staticmethod
    def quality_assessment(image_path):
        """Assess image quality for analysis"""
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Laplacian variance (blur detection)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        # Contrast
        contrast = gray.std()

        # Brightness
        brightness = gray.mean()

        quality_metrics = {
            'laplacian_variance': float(laplacian_var),
            'contrast': float(contrast),
            'brightness': float(brightness),
            'quality_score': float((laplacian_var + contrast) / 100)  # Simplified score
        }

        return quality_metrics


def batch_analyze_images(image_paths):
    """Batch analyze multiple images"""
    results = []
    analyzer = AdvancedImageAnalyzer()

    for image_path in image_paths:
        try:
            quality = analyzer.quality_assessment(image_path)
            color_features = analyzer.extract_color_features(image_path)
            
            results.append({
                'image': image_path,
                'quality': quality,
                'color_features': color_features
            })
        except Exception as e:
            results.append({
                'image': image_path,
                'error': str(e)
            })

    return results
