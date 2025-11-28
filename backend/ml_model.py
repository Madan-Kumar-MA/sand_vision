"""
Machine Learning Model for Sand Grain Classification
Uses scikit-learn for training and prediction
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
from image_processor import classify_by_size, get_grain_statistics


class SandGrainClassifier:
    """
    Machine Learning model for classifying sand grains
    """
    
    def __init__(self, model_path='models/grain_classifier.pkl'):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.load_model()

    def load_model(self):
        """Load pre-trained model if it exists"""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.model_path.replace('.pkl', '_scaler.pkl'))
                self.is_trained = True
                print("Model loaded successfully")
            except Exception as e:
                print(f"Error loading model: {e}")
                self.create_default_model()
        else:
            self.create_default_model()

    def create_default_model(self):
        """Create and train a default model"""
        print("Creating default classifier model...")
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.is_trained = False

    def extract_features(self, grains):
        """
        Extract features from grains for ML model
        
        Args:
            grains (list): List of grain dictionaries
        
        Returns:
            numpy array: Feature matrix
        """
        if not grains:
            return np.array([]).reshape(0, 6)

        features = []
        for grain in grains:
            feature_vector = [
                grain['area'],
                grain['perimeter'],
                grain['circularity'],
                grain['aspect_ratio'],
                grain['solidity'],
                grain['equivalent_diameter']
            ]
            features.append(feature_vector)

        return np.array(features)

    def classify_grains(self, image_features):
        """
        Classify grains into categories
        
        Args:
            image_features (dict): Features extracted from image
        
        Returns:
            dict: Classification results with percentages
        """
        grains = image_features.get('grains', [])
        
        if not grains:
            return {
                'fine': 0, 'medium': 0, 'coarse': 0,
                'confidence': 0, 'total_particles': 0,
                'avg_size': 0, 'statistics': {}
            }

        if self.is_trained:
            # Use trained ML model
            features = self.extract_features(grains)
            predictions = self.predict(features)
            
            # Count predictions (0=fine, 1=medium, 2=coarse) - assuming this mapping
            # We need to ensure training uses this mapping
            fine_count = np.sum(predictions == 0)
            medium_count = np.sum(predictions == 1)
            coarse_count = np.sum(predictions == 2)
            
            confidence = 0.9  # Higher confidence when using ML
        else:
            # Use size-based classification (fallback)
            classification = classify_by_size(grains, percentiles=True)
            fine_count = len(classification['fine'])
            medium_count = len(classification['medium'])
            coarse_count = len(classification['coarse'])
            confidence = 0.85

        total_grains = len(grains)

        # Calculate percentages
        fine_pct = (fine_count / total_grains * 100) if total_grains > 0 else 0
        medium_pct = (medium_count / total_grains * 100) if total_grains > 0 else 0
        coarse_pct = (coarse_count / total_grains * 100) if total_grains > 0 else 0

        # Get statistics
        stats = get_grain_statistics(grains)

        return {
            'fine': fine_pct,
            'medium': medium_pct,
            'coarse': coarse_pct,
            'confidence': confidence,
            'total_particles': total_grains,
            'avg_size': stats.get('avg_diameter', 0),
            'statistics': stats
        }

    def train(self, X_train, y_train):
        """
        Train the model
        
        Args:
            X_train (numpy array): Training features
            y_train (numpy array): Training labels (0=fine, 1=medium, 2=coarse)
        """
        try:
            # Scale features
            X_scaled = self.scaler.fit_transform(X_train)
            
            # Train model
            self.model.fit(X_scaled, y_train)
            self.is_trained = True
            
            # Save model
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.model_path.replace('.pkl', '_scaler.pkl'))
            
            print("Model trained and saved successfully")
        except Exception as e:
            print(f"Error training model: {e}")

    def predict(self, X):
        """
        Make predictions on new data
        
        Args:
            X (numpy array): Feature matrix
        
        Returns:
            numpy array: Predictions
        """
        if not self.is_trained or self.scaler is None:
            raise ValueError("Model must be trained before making predictions")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def predict_proba(self, X):
        """
        Get prediction probabilities
        
        Args:
            X (numpy array): Feature matrix
        
        Returns:
            numpy array: Prediction probabilities
        """
        if not self.is_trained or self.scaler is None:
            raise ValueError("Model must be trained before making predictions")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)


class SandDetector:
    """
    Model to detect if an image is sand or not using One-Class SVM
    """
    
    def __init__(self, model_path='models/sand_detector.pkl'):
        self.model_path = model_path
        self.model = None
        self.scaler = None
        self.is_trained = False
        self.load_model()

    def load_model(self):
        """Load pre-trained model if it exists"""
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.model_path.replace('.pkl', '_scaler.pkl'))
                self.is_trained = True
                print("Sand Detector model loaded successfully")
            except Exception as e:
                print(f"Error loading Sand Detector model: {e}")
                self.create_default_model()
        else:
            self.create_default_model()

    def create_default_model(self):
        """Create a default One-Class SVM model"""
        from sklearn.svm import OneClassSVM
        print("Creating default Sand Detector model...")
        # nu=0.1 means we expect at most 10% outliers in the training data
        # gamma='auto' uses 1/n_features
        self.model = OneClassSVM(nu=0.1, kernel="rbf", gamma='scale')
        self.scaler = StandardScaler()
        self.is_trained = False

    def extract_features(self, image_path):
        """
        Extract global texture/color features from the image
        """
        import cv2
        
        try:
            image = cv2.imread(image_path)
            if image is None:
                return None
                
            # Resize for consistent processing speed
            image = cv2.resize(image, (640, 480))
            
            # 1. Color Statistics (Mean, StdDev) in HSV
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            mean_hsv, std_hsv = cv2.meanStdDev(hsv)
            
            # 2. Edge Density
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges) / (edges.shape[0] * edges.shape[1])
            
            # Flatten features
            features = np.concatenate([
                mean_hsv.flatten(), 
                std_hsv.flatten(), 
                [edge_density]
            ])
            
            return features.reshape(1, -1)
            
        except Exception as e:
            print(f"Error extracting features for detector: {e}")
            return None

    def train(self, image_paths):
        """
        Train the detector on a list of sand images
        """
        features_list = []
        for path in image_paths:
            feat = self.extract_features(path)
            if feat is not None:
                features_list.append(feat[0])
        
        if not features_list:
            print("No valid features extracted for training")
            return
            
        X_train = np.array(features_list)
        
        try:
            # Scale features
            X_scaled = self.scaler.fit_transform(X_train)
            
            # Train model
            self.model.fit(X_scaled)
            self.is_trained = True
            
            # Save model
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.model_path.replace('.pkl', '_scaler.pkl'))
            
            print("Sand Detector trained and saved successfully")
        except Exception as e:
            print(f"Error training Sand Detector: {e}")

    def predict(self, image_path):
        """
        Predict if image is sand (1) or not (-1)
        """
        if not self.is_trained:
            return 0 # Unknown
            
        feat = self.extract_features(image_path)
        if feat is None:
            return -1
            
        X_scaled = self.scaler.transform(feat)
        prediction = self.model.predict(X_scaled)
        return prediction[0]


# Global classifier instance
classifier = None
detector = None

def get_classifier():
    """Get or create classifier instance"""
    global classifier
    if classifier is None:
        classifier = SandGrainClassifier()
    return classifier

def get_detector():
    """Get or create detector instance"""
    global detector
    if detector is None:
        detector = SandDetector()
    return detector

def classify_sand_grains(image_features):
    """
    Classify sand grains from image features
    
    Args:
        image_features (dict): Features extracted from image
    
    Returns:
        dict: Classification results
    """
    clf = get_classifier()
    return clf.classify_grains(image_features)

def is_sand_image(image_path):
    """
    Check if image is sand
    """
    det = get_detector()
    return det.predict(image_path)
