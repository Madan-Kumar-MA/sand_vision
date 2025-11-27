# SandVision - Complete Setup Guide

Complete frontend-backend integrated project for sand grain analysis using AI/ML.

## 📋 Table of Contents
1. [Quick Start (Docker)](#quick-start-docker)
2. [Manual Setup](#manual-setup)
3. [Project Structure](#project-structure)
4. [API Endpoints](#api-endpoints)
5. [Features](#features)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Madan-Kumar-MA/sand_vision.git
cd sand_vision

# 2. Start all services with Docker Compose
docker-compose up -d

# 3. Initialize the database (first time only)
docker exec sandvision-backend python manage_db.py reset

# 4. Access the application
Frontend:  http://localhost:8000
Backend:   http://localhost:5000
API Docs:  http://localhost:5000/
```

### Stopping services
```bash
docker-compose down
```

### Viewing logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🛠 Manual Setup

### Prerequisites
- Python 3.8+
- Node.js (optional, for serving frontend)
- Git

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create necessary directories
mkdir uploads models logs

# 5. Initialize database
python manage_db.py reset

# 6. Run the server
python app.py
```

Server will start at `http://localhost:5000`

### Frontend Setup

```bash
# Method 1: Using Python's built-in server
cd ..
python -m http.server 8000

# Method 2: Using Node.js http-server
npm install -g http-server
http-server -p 8000 -c-1

# Method 3: Using any other web server
# Point root to the project directory
```

Access frontend at `http://localhost:8000`

---

## 📁 Project Structure

```
sand_vision/
├── index.html                 # Main entry point
├── styles.css                 # Global styles
├── script.js                  # Frontend logic + API integration
├── pages/
│   ├── home.html             # Home page with camera/upload
│   ├── analysis.html         # Analysis history
│   ├── dashboard.html        # Statistics dashboard
│   ├── download.html         # Export data
│   └── live-capture.html     # Live capture page
├── backend/
│   ├── app.py                # Flask main application
│   ├── models.py             # Database models
│   ├── image_processor.py    # Image analysis
│   ├── ml_model.py           # ML classification
│   ├── advanced_analyzer.py  # Advanced analysis
│   ├── config.py             # Configuration
│   ├── utils.py              # Utility functions
│   ├── manage_db.py          # Database management
│   ├── test_app.py           # Unit tests
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Docker build file
│   └── README.md             # Backend documentation
├── docker-compose.yml        # Docker compose config
└── SETUP.md                  # This file
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:5000/api
```

### 1. Analyze Image
**POST** `/analyze`

```bash
curl -X POST -F "image=@sand_sample.jpg" http://localhost:5000/api/analyze
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
  "timestamp": "2025-11-17T10:30:00"
}
```

### 2. Get Analysis History
**GET** `/history?page=1&per_page=10`

```bash
curl http://localhost:5000/api/history
```

### 3. Get Specific Analysis
**GET** `/analysis/<id>`

```bash
curl http://localhost:5000/api/analysis/1
```

### 4. Get Statistics
**GET** `/statistics`

```bash
curl http://localhost:5000/api/statistics
```

### 5. Export Data
**GET** `/export/<format>`

Formats: `json`, `csv`

```bash
curl http://localhost:5000/api/export/csv -o data.csv
```

### 6. Delete Analysis
**DELETE** `/analysis/<id>`

```bash
curl -X DELETE http://localhost:5000/api/analysis/1
```

---

## ✨ Features

### Frontend Features
- ✅ **Live Camera Capture** - Real-time camera access
- ✅ **Image Upload** - File browser image selection
- ✅ **Instant Analysis** - Automatic backend processing
- ✅ **Results Display** - Show analysis results in modal
- ✅ **Analysis History** - View previous analyses
- ✅ **Dashboard** - Statistics and trends
- ✅ **Data Export** - Download JSON/CSV
- ✅ **Hover Effects** - Interactive UI elements
- ✅ **Responsive Design** - Mobile-friendly

### Backend Features
- ✅ **Image Processing** - OpenCV grain detection
- ✅ **ML Classification** - Grain size categorization
- ✅ **REST API** - Full CRUD operations
- ✅ **Database** - SQLAlchemy ORM
- ✅ **Data Export** - Multiple formats
- ✅ **Statistics** - Real-time analytics
- ✅ **Error Handling** - Comprehensive validation
- ✅ **Testing** - Unit tests with pytest
- ✅ **Docker Support** - Containerized deployment

---

## 🔄 Workflow

### Analyzing an Image

1. **User Action** → Click "Start Camera" or "Upload Sample"
2. **Capture/Upload** → Image is selected (camera or file)
3. **Frontend** → Converts image to Base64/Blob
4. **API Call** → Sends POST request to `/api/analyze`
5. **Backend Processing**:
   - Save image temporarily
   - Extract grain features using OpenCV
   - Classify grains using ML model
   - Calculate statistics
   - Save to database
6. **Response** → JSON with analysis results
7. **Frontend Display** → Show results in modal popup
8. **Local Storage** → Save analysis locally

---

## 🛡️ Environment Configuration

Create `.env` file in backend directory:

```
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///sandvision.db
CORS_ORIGINS=http://localhost:8000,http://localhost:3000
MAX_UPLOAD_SIZE=16777216
```

For production:

```
FLASK_ENV=production
SECRET_KEY=secure-random-key
DATABASE_URL=postgresql://user:password@db:5432/sandvision
CORS_ORIGINS=https://yourdomain.com
```

---

## 📊 Database Schema

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

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest --cov=.           # With coverage report
```

### Manual Testing
```bash
# Test API endpoint
curl http://localhost:5000/
# Should return: {"status": "SandVision Backend is running", "version": "1.0"}

# Test image analysis
curl -X POST -F "image=@test.jpg" http://localhost:5000/api/analyze
```

---

## 🐛 Troubleshooting

### Camera Not Working
- ✓ Check browser permissions
- ✓ Use HTTPS in production (required for camera access)
- ✓ Test with different browsers (Chrome works best)
- ✓ Check API_URL in browser console

### Image Upload Fails
- ✓ Verify file size < 16MB
- ✓ Check file format (JPG, PNG, etc.)
- ✓ Ensure `/uploads` folder exists
- ✓ Check backend logs

### Backend Connection Error
- ✓ Verify backend is running: `curl http://localhost:5000/`
- ✓ Check CORS settings
- ✓ Verify API_URL in `script.js`
- ✓ Check firewall settings

### Database Errors
- ✓ Reinitialize database: `python manage_db.py reset`
- ✓ Delete `sandvision.db` and restart backend
- ✓ Check database file permissions

### Docker Issues
- ✓ Rebuild images: `docker-compose build --no-cache`
- ✓ Remove old containers: `docker-compose down -v`
- ✓ Check Docker logs: `docker-compose logs`

---

## 📈 Performance Tips

1. **Image Optimization**
   - Keep images under 2MB
   - Resize to max 1920x1080
   - Use JPEG format

2. **Batch Processing**
   - Process multiple images asynchronously
   - Cache analysis results

3. **Database**
   - Add indexes on frequently queried columns
   - Archive old analyses

4. **Frontend**
   - Lazy load images
   - Cache API responses
   - Compress static assets

---

## 🚀 Deployment

### Heroku
```bash
heroku login
heroku create sandvision-app
git push heroku master
heroku config:set FLASK_ENV=production
heroku ps:scale web=1
```

### AWS (EC2)
```bash
# Launch EC2 instance
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and run
git clone <repo>
cd sand_vision
docker-compose up -d
```

### DigitalOcean
```bash
# Create droplet with Docker pre-installed
# SSH into droplet
git clone <repo>
cd sand_vision
docker-compose up -d
```

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenCV Documentation](https://docs.opencv.org/)
- [scikit-learn Documentation](https://scikit-learn.org/)
- [SQLAlchemy Documentation](https://www.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

MIT License - See LICENSE file

---

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/Madan-Kumar-MA/sand_vision/issues
- Email: madan@example.com

---

## 👨‍💻 Contributors

- **Manas Manjunath Acharya** - Backend Architecture & ML
- **Madan Kumar M A** - Full Stack Development
- **RNS Institute of Technology** - Guide: Prof. Raghu Prasad K

---

## 🎯 Roadmap

### v1.1
- [ ] User authentication
- [ ] Advanced reporting
- [ ] Real-time predictions
- [ ] Mobile app

### v2.0
- [ ] Deep learning model
- [ ] Multi-location analysis
- [ ] Historical trends
- [ ] API rate limiting

---

**Last Updated:** November 17, 2025  
**Status:** Production Ready ✅
