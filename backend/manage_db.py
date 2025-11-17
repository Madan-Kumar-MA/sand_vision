"""
Database migration and seed data script
"""

from app import app, db
from models import SandAnalysis, User, AnalysisLog
from datetime import datetime, timedelta
import random


def init_db():
    """Initialize database with tables"""
    with app.app_context():
        db.create_all()
        print("Database initialized successfully!")


def seed_sample_data():
    """Seed database with sample analysis data"""
    with app.app_context():
        # Check if data already exists
        if SandAnalysis.query.first() is not None:
            print("Database already contains data. Skipping seed.")
            return

        sample_data = [
            {
                'filename': 'sample_1.jpg',
                'original_filename': 'beach_sample_001.jpg',
                'fine_percentage': 42.5,
                'medium_percentage': 38.2,
                'coarse_percentage': 19.3,
                'notes': 'North beach sample - calm weather'
            },
            {
                'filename': 'sample_2.jpg',
                'original_filename': 'beach_sample_002.jpg',
                'fine_percentage': 35.8,
                'medium_percentage': 42.1,
                'coarse_percentage': 22.1,
                'notes': 'South beach sample - after storm'
            },
            {
                'filename': 'sample_3.jpg',
                'original_filename': 'beach_sample_003.jpg',
                'fine_percentage': 48.2,
                'medium_percentage': 35.6,
                'coarse_percentage': 16.2,
                'notes': 'Deeper water sample'
            },
            {
                'filename': 'sample_4.jpg',
                'original_filename': 'beach_sample_004.jpg',
                'fine_percentage': 40.1,
                'medium_percentage': 40.5,
                'coarse_percentage': 19.4,
                'notes': 'Mid-tide sample'
            },
            {
                'filename': 'sample_5.jpg',
                'original_filename': 'beach_sample_005.jpg',
                'fine_percentage': 38.9,
                'medium_percentage': 42.3,
                'coarse_percentage': 18.8,
                'notes': 'Reference sample - standard conditions'
            },
        ]

        for i, data in enumerate(sample_data):
            # Create with varied timestamps
            analysis_date = datetime.now() - timedelta(days=random.randint(1, 30))
            
            analysis = SandAnalysis(
                filename=data['filename'],
                original_filename=data['original_filename'],
                fine_percentage=data['fine_percentage'],
                medium_percentage=data['medium_percentage'],
                coarse_percentage=data['coarse_percentage'],
                notes=data['notes'],
                analysis_date=analysis_date
            )
            db.session.add(analysis)

        db.session.commit()
        print(f"Seeded {len(sample_data)} sample analyses")


def drop_db():
    """Drop all database tables"""
    with app.app_context():
        db.drop_all()
        print("Database tables dropped successfully!")


def reset_db():
    """Reset database and seed with sample data"""
    drop_db()
    init_db()
    seed_sample_data()
    print("Database reset and seeded successfully!")


if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'init':
            init_db()
        elif command == 'seed':
            seed_sample_data()
        elif command == 'drop':
            drop_db()
        elif command == 'reset':
            reset_db()
        else:
            print("Unknown command. Use: init, seed, drop, or reset")
    else:
        print("Database Management Script")
        print("Usage: python manage_db.py [command]")
        print("Commands:")
        print("  init  - Initialize database tables")
        print("  seed  - Add sample data")
        print("  drop  - Drop all tables")
        print("  reset - Drop and recreate with sample data")
