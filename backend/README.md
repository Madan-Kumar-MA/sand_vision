"""
README for SandVision Backend
Complete setup and deployment guide
"""

# SandVision Backend - Python/Flask API

A comprehensive backend system for sand grain analysis using image processing and machine learning.

## Features

- **Image Processing**: Automated sand grain detection and feature extraction using OpenCV
- **Machine Learning**: Classification of sand grains into fine, medium, and coarse categories
- **REST API**: Full-featured API for image analysis, history management, and data export
- **Database**: SQLAlchemy ORM with SQLite (development) or PostgreSQL (production)
- **Data Export**: Export analysis results in JSON or CSV format
- **Statistics**: Real-time statistical summaries of all analyses
- **Error Handling**: Comprehensive error handling and logging

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/Madan-Kumar-MA/sand_vision.git
cd sand_vision/backend
```

2. **Create virtual environment**
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Create necessary directories**
```bash
mkdir uploads
mkdir models
```

5. **Initialize database**
```bash
python
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()
>>> exit()
```

6. **Run the application**
```bash
python app.py
```

Server will start at `http://localhost:5000`

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///sandvision.db
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### For Production

```
FLASK_ENV=production
SECRET_KEY=production-secret-key
DATABASE_URL=postgresql://user:password@localhost/sandvision
```

## API Endpoints

### 1. Home
```
GET /
```
Health check endpoint

**Response:**
```json
{
  "status": "SandVision Backend is running",
  "version": "1.0"
}
```

### 2. Analyze Image
```
POST /api/analyze
Content-Type: multipart/form-data

Body:
- image: [image file]
```

**Response:**
```json
{
  "success": true,
  "analysis_id": 1,
  "results": {
    "fine_grains": 45.23,
    "medium_grains": 35.67,
    "coarse_grains": 19.10,
    "confidence": 0.85,
    "total_particles": 1250,
    "average_size": 8.5
  },
  "timestamp": "2023-11-17T10:30:00"
}
```

### 3. Get Analysis History
```
GET /api/history?page=1&per_page=10
```

**Response:**
```json
{
  "success": true,
  "total": 25,
  "pages": 3,
  "current_page": 1,
  "results": [
    {
      "id": 1,
      "filename": "sand_sample_001.jpg",
      "fine": 45.23,
      "medium": 35.67,
      "coarse": 19.10,
      "date": "2023-11-17T10:30:00"
    }
  ]
}
```

### 4. Get Specific Analysis
```
GET /api/analysis/<analysis_id>
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": 1,
    "filename": "sand_sample_001.jpg",
    "fine_grains": 45.23,
    "medium_grains": 35.67,
    "coarse_grains": 19.10,
    "date": "2023-11-17T10:30:00",
    "notes": "Beach sample from north coast"
  }
}
```

### 5. Get Statistics
```
GET /api/statistics
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_analyses": 25,
    "average_fine": 42.15,
    "average_medium": 37.45,
    "average_coarse": 20.40
  }
}
```

### 6. Export Data
```
GET /api/export/<format>
# format: json or csv
```

**JSON Response:**
```json
{
  "data": [
    {
      "id": 1,
      "filename": "sand_sample_001.jpg",
      "fine_grains": 45.23,
      "medium_grains": 35.67,
      "coarse_grains": 19.10,
      "date": "2023-11-17T10:30:00"
    }
  ]
}
```

**CSV:** Downloads as `sandvision_data.csv`

### 7. Delete Analysis
```
DELETE /api/analysis/<analysis_id>
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis deleted successfully"
}
```

## Module Structure

### app.py
Main Flask application with API route definitions

### models.py
SQLAlchemy database models:
- `SandAnalysis`: Stores analysis results
- `User`: User management (future)
- `AnalysisLog`: Activity logging

### image_processor.py
Image processing functions:
- `analyze_sand_image()`: Extract grain features
- `get_grain_statistics()`: Calculate statistics
- `classify_by_size()`: Classify by size categories

### ml_model.py
Machine learning classification:
- `SandGrainClassifier`: ML model class
- `classify_sand_grains()`: Classification function

### config.py
Configuration management for different environments

## Testing

Run tests with pytest:
```bash
pytest
pytest -v
pytest --cov=.
```

## Database Schema

### SandAnalysis Table
```sql
CREATE TABLE sand_analysis (
  id INTEGER PRIMARY KEY,
  filename VARCHAR(255),
  original_filename VARCHAR(255),
  fine_percentage FLOAT,
  medium_percentage FLOAT,
  coarse_percentage FLOAT,
  analysis_date DATETIME,
  notes TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

## Deployment

### Using Gunicorn (Production)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:
```bash
docker build -t sandvision-backend .
docker run -p 5000:5000 sandvision-backend
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request
- `404`: Not found
- `500`: Server error

Example error response:
```json
{
  "error": "No image file provided"
}
```

## Performance Tips

1. **Image Size**: Optimize images before uploading (resize to 800x600 max)
2. **Batch Processing**: Process multiple images asynchronously
3. **Caching**: Cache statistics results
4. **Database Indexing**: Add indexes on frequently queried columns

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Batch image processing
- [ ] Real-time WebSocket updates
- [ ] Advanced ML model with training
- [ ] API rate limiting
- [ ] Scheduled automated analysis
- [ ] Email notifications
- [ ] Dashboard analytics

## Troubleshooting

### Camera not working
- Check browser permissions
- Ensure HTTPS in production
- Test with different browsers

### Image upload fails
- Verify file size limit (16MB)
- Check file format (JPG, PNG, etc.)
- Ensure directory permissions

### Database errors
- Verify database connection
- Check database file permissions
- Clear old database and recreate

## Support

For issues and questions, visit: https://github.com/Madan-Kumar-MA/sand_vision

## License

MIT License - See LICENSE file for details

## Contributors

- Manas Manjunath Acharya
- Madan Kumar M A
- RNS Institute of Technology, MCA Department
