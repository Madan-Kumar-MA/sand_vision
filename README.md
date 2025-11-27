# 🏖️ SandVision - AI-Powered Beach Sand Grain Analysis System

A complete full-stack application for automated sand grain classification and analysis using machine learning and computer vision.

![SandVision](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-2.3+-blue)
![OpenCV](https://img.shields.io/badge/OpenCV-4.8+-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

### Core Functionality
- 📷 **Live Camera Capture** - Real-time sand image acquisition
- 📤 **Image Upload** - File browser support for image selection
- 🤖 **AI Analysis** - Automated sand grain classification
- 📊 **Data Visualization** - Interactive analysis results
- 💾 **Data Management** - History tracking and export
- 📈 **Statistics** - Real-time trends and analytics

### Technical Highlights
- **Frontend**: Modern responsive HTML/CSS/JavaScript
- **Backend**: Flask REST API with SQLAlchemy ORM
- **Image Processing**: OpenCV-based grain detection
- **Machine Learning**: scikit-learn classification
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Containerization**: Docker & Docker Compose
- **Testing**: Comprehensive unit tests

## 🚀 Quick Start

### Using Docker (Recommended)
```bash
git clone https://github.com/Madan-Kumar-MA/sand_vision.git
cd sand_vision
docker-compose up -d
```

Access at:
- **Frontend:** http://localhost:8000
- **Backend:** http://localhost:5000

### Manual Setup
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage_db.py reset
python app.py

# Frontend (separate terminal)
python -m http.server 8000
```

## 📁 Project Structure

```
sand_vision/
├── Frontend
│   ├── index.html          # Main app
│   ├── styles.css          # Global styles
│   ├── script.js           # App logic + API integration
│   ├── pages/              # Dynamic pages
│   │   ├── home.html       # Home with camera/upload
│   │   ├── analysis.html   # Analysis history
│   │   ├── dashboard.html  # Statistics
│   │   ├── download.html   # Export
│   │   └── live-capture.html
│   └── ...
│
├── Backend
│   ├── app.py              # Flask main app
│   ├── models.py           # Database models
│   ├── image_processor.py  # Image analysis
│   ├── ml_model.py         # ML classification
│   ├── advanced_analyzer.py # Advanced features
│   ├── config.py           # Configuration
│   ├── utils.py            # Utilities
│   ├── requirements.txt    # Dependencies
│   ├── Dockerfile          # Docker build
│   └── tests/
│
├── docker-compose.yml      # Docker orchestration
├── SETUP.md               # Setup guide
└── README.md              # This file
```

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze` | Analyze sand image |
| GET | `/api/history` | Get analysis history |
| GET | `/api/analysis/<id>` | Get specific analysis |
| GET | `/api/statistics` | Get statistics |
| GET | `/api/export/<format>` | Export data (json/csv) |
| DELETE | `/api/analysis/<id>` | Delete analysis |

## 💻 Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive Design
- Camera API (getUserMedia)
- Fetch API for backend communication

### Backend
- Flask 2.3
- SQLAlchemy ORM
- OpenCV 4.8
- scikit-learn
- NumPy, SciPy

### DevOps
- Docker & Docker Compose
- Git & GitHub
- Gunicorn WSGI Server
- SQLite / PostgreSQL

## 📸 Workflow

1. **Capture** → User takes photo or uploads image
2. **Process** → Frontend sends to backend API
3. **Analyze** → OpenCV detects and measures grains
4. **Classify** → ML model categorizes grain sizes
5. **Store** → Results saved to database
6. **Display** → Results shown to user
7. **Export** → Data available for download

## 🧠 ML Model

The system uses **Random Forest Classification** to categorize sand grains into:
- 🟤 **Fine**: Small sand particles
- 🟠 **Medium**: Medium-sized particles
- ⭕ **Coarse**: Large sand particles

Based on extracted features:
- Grain area
- Perimeter
- Circularity
- Aspect ratio
- Solidity
- Equivalent diameter

## 🔧 Configuration

### Environment Variables
```bash
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///sandvision.db
CORS_ORIGINS=*
MAX_UPLOAD_SIZE=16777216
```

See `.env.example` for all options.

## 🧪 Testing

```bash
cd backend
pytest                  # Run all tests
pytest -v              # Verbose
pytest --cov=.        # With coverage
```

## 📊 Database Schema

**SandAnalysis Table**
- id (Primary Key)
- filename, original_filename
- fine_percentage, medium_percentage, coarse_percentage
- analysis_date
- notes
- created_at, updated_at

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Initialize database
docker exec sandvision-backend python manage_db.py reset

# Run tests
docker exec sandvision-backend pytest

# Stop services
docker-compose down
```

## 🚀 Deployment

### Heroku
```bash
heroku login
heroku create sandvision-app
git push heroku master
```

### AWS / DigitalOcean / GCP
See [SETUP.md](./SETUP.md) for detailed instructions.

## 📝 API Usage Example

### Python
```python
import requests

# Analyze image
with open('sand_sample.jpg', 'rb') as f:
    response = requests.post(
        'http://localhost:5000/api/analyze',
        files={'image': f}
    )
    results = response.json()
    print(f"Fine: {results['results']['fine_grains']}%")
```

### JavaScript
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('http://localhost:5000/api/analyze', {
  method: 'POST',
  body: formData
});

const results = await response.json();
console.log(results.results);
```

### cURL
```bash
curl -X POST -F "image=@sand.jpg" http://localhost:5000/api/analyze
```

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Check browser permissions, use HTTPS |
| Image upload fails | Verify file size < 16MB, check format |
| Backend connection error | Ensure backend running on port 5000 |
| Database errors | Run `python manage_db.py reset` |
| Docker issues | Run `docker-compose build --no-cache` |

See [SETUP.md](./SETUP.md#-troubleshooting) for more solutions.

## 📚 Documentation

- [Complete Setup Guide](./SETUP.md)
- [Backend Documentation](./backend/README.md)
- [API Reference](#-api-endpoints)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

## 👥 Team

- **Manas Manjunath Acharya** - Backend & ML Engineering
- **Madan Kumar M A** - Full Stack Development
- **Guide**: Prof. Raghu Prasad K (RNS Institute of Technology)

## 🏫 Institution

**RNS Institute of Technology**  
Department of Master of Computer Applications (MCA)  
Bangalore, India

## 📞 Contact & Support

- 📧 Email: madan@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/Madan-Kumar-MA/sand_vision/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Madan-Kumar-MA/sand_vision/discussions)

## 🎯 Roadmap

### Version 1.1
- [ ] User authentication & authorization
- [ ] Advanced reporting engine
- [ ] Real-time WebSocket updates
- [ ] Batch processing

### Version 2.0
- [ ] Deep learning model (TensorFlow)
- [ ] Mobile app (React Native)
- [ ] Multi-location analysis
- [ ] Historical trends
- [ ] API rate limiting

## ⭐ Show Your Support

If you find this project helpful, please give it a star! Your support helps us improve.

---

**Status:** ✅ Production Ready  
**Last Updated:** November 17, 2025  
**Version:** 1.0.0

