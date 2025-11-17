"""
Test suite for SandVision Backend
Run with: pytest
"""

import pytest
import os
import tempfile
from app import app, db
from models import SandAnalysis


@pytest.fixture
def client():
    """Create test client"""
    db_fd, db_path = tempfile.mkstemp()
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['TESTING'] = True

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()

    os.close(db_fd)
    os.unlink(db_path)


def test_home(client):
    """Test home endpoint"""
    response = client.get('/')
    assert response.status_code == 200
    assert b'SandVision Backend' in response.data


def test_analyze_no_image(client):
    """Test analyze endpoint without image"""
    response = client.post('/api/analyze')
    assert response.status_code == 400
    assert b'No image file provided' in response.data


def test_history_empty(client):
    """Test history endpoint with no data"""
    response = client.get('/api/history')
    assert response.status_code == 200
    data = response.get_json()
    assert data['total'] == 0
    assert len(data['results']) == 0


def test_statistics_empty(client):
    """Test statistics endpoint with no data"""
    response = client.get('/api/statistics')
    assert response.status_code == 200
    data = response.get_json()
    assert data['statistics']['total_analyses'] == 0


def test_export_json(client):
    """Test export endpoint with JSON format"""
    response = client.get('/api/export/json')
    assert response.status_code == 200
    data = response.get_json()
    assert 'data' in data


def test_export_csv(client):
    """Test export endpoint with CSV format"""
    response = client.get('/api/export/csv')
    assert response.status_code == 200
    assert b'ID,Filename' in response.data


def test_export_invalid_format(client):
    """Test export endpoint with invalid format"""
    response = client.get('/api/export/invalid')
    assert response.status_code == 400


def test_get_analysis_not_found(client):
    """Test get analysis with non-existent ID"""
    response = client.get('/api/analysis/999')
    assert response.status_code == 404


def test_delete_analysis_not_found(client):
    """Test delete analysis with non-existent ID"""
    response = client.delete('/api/analysis/999')
    assert response.status_code == 404


def test_not_found(client):
    """Test 404 error handler"""
    response = client.get('/nonexistent')
    assert response.status_code == 404
    assert b'not found' in response.data
