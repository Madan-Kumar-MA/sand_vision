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
        
        # Use size-based classification (more reliable than ML for this domain)
        classification = classify_by_size(grains, percentiles=True)
        
        total_grains = len(grains)
        fine_count = len(classification['fine'])
        medium_count = len(classification['medium'])
        coarse_count = len(classification['coarse'])

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
            'confidence': 0.85,  # Placeholder confidence
            'total_particles': total_grains,
            'avg_size': stats.get('avg_diameter', 0),
            'statistics': stats
        }

    def train(self, X_train, y_train):
        """
        Train the model
        
        Args:
            X_train (numpy array): Training features
            y_train (numpy array): Training labels
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


# Global classifier instance
classifier = None

def get_classifier():
    """Get or create classifier instance"""
    global classifier
    if classifier is None:
        classifier = SandGrainClassifier()
    return classifier


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
