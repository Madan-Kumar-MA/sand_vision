"""
Configuration file for SandVision Backend
"""

import os
from datetime import timedelta


class Config:
    """Base configuration"""
    
    # Flask
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'sqlite:///sandvision.db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = 'uploads'
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}
    
    # API
    JSON_SORT_KEYS = False
    
    # CORS
    CORS_ORIGINS = ["*"]  # Restrict in production
    
    # Image Processing
    MIN_GRAIN_AREA = 10
    MAX_GRAIN_AREA = 10000
    
    # Model
    MODEL_PATH = 'models/grain_classifier.pkl'
    CONFIDENCE_THRESHOLD = 0.7


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    # Use environment variables for sensitive data
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')


# Config selector
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config(env=None):
    """Get configuration object"""
    if env is None:
        env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
