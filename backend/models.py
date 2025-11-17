"""
Database Models for SandVision
Using SQLAlchemy ORM
"""

from app import db
from datetime import datetime


class SandAnalysis(db.Model):
    """
    Model for storing sand analysis results
    """
    __tablename__ = 'sand_analysis'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    fine_percentage = db.Column(db.Float, nullable=False)
    medium_percentage = db.Column(db.Float, nullable=False)
    coarse_percentage = db.Column(db.Float, nullable=False)
    analysis_date = db.Column(db.DateTime, default=datetime.now, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f'<SandAnalysis {self.id}: {self.original_filename}>'

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.original_filename,
            'fine': self.fine_percentage,
            'medium': self.medium_percentage,
            'coarse': self.coarse_percentage,
            'date': self.analysis_date.isoformat()
        }


class User(db.Model):
    """
    Model for user management (future feature)
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f'<User {self.username}>'


class AnalysisLog(db.Model):
    """
    Model for logging all analysis activities
    """
    __tablename__ = 'analysis_logs'

    id = db.Column(db.Integer, primary_key=True)
    analysis_id = db.Column(db.Integer, db.ForeignKey('sand_analysis.id'))
    action = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # success, failed, pending
    message = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<AnalysisLog {self.id}: {self.action}>'
