"""
SandVision Backend - Simplified Flask Application
No SQLAlchemy for Python 3.13 compatibility
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sqlite3
import json
from datetime import datetime
from werkzeug.utils import secure_filename
import traceback

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'bmp'}

# Create folders
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('models', exist_ok=True)

DATABASE = 'sandvision.db'

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS analyses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_filename TEXT,
        fine_percentage REAL,
        medium_percentage REAL,
        coarse_percentage REAL,
        total_grains INTEGER,
        analysis_date TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database
init_db()

# ==================== API ROUTES ====================

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'SandVision Backend is running',
        'version': '1.0.0',
        'endpoints': [
            '/api/analyze',
            '/api/history',
            '/api/analysis/<id>',
            '/api/statistics',
            '/api/export/<format>',
            '/api/delete/<id>'
        ]
    }), 200


@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """Analyze sand image"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{datetime.now().timestamp()}_{filename}")
        file.save(filepath)
        
        # Mock analysis (replace with actual processing)
        import random
        fine = round(random.uniform(20, 40), 2)
        medium = round(random.uniform(30, 50), 2)
        coarse = round(100 - fine - medium, 2)
        
        # Save to database
        conn = get_db()
        c = conn.cursor()
        c.execute('''INSERT INTO analyses 
            (filename, original_filename, fine_percentage, medium_percentage, coarse_percentage, 
             total_grains, analysis_date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (filepath, file.filename, fine, medium, coarse, random.randint(500, 2000),
             datetime.now().isoformat(), datetime.now().isoformat(), datetime.now().isoformat())
        )
        conn.commit()
        analysis_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'id': analysis_id,
            'filename': file.filename,
            'results': {
                'fine_grains': fine,
                'medium_grains': medium,
                'coarse_grains': coarse,
                'total_grains': random.randint(500, 2000),
                'confidence': 0.95
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """Get analysis history"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        conn = get_db()
        c = conn.cursor()
        
        c.execute('SELECT * FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?', (limit, offset))
        analyses = c.fetchall()
        
        c.execute('SELECT COUNT(*) as count FROM analyses')
        total = c.fetchone()['count']
        
        conn.close()
        
        results = []
        for row in analyses:
            results.append({
                'id': row['id'],
                'filename': row['original_filename'],
                'fine_grains': row['fine_percentage'],
                'medium_grains': row['medium_percentage'],
                'coarse_grains': row['coarse_percentage'],
                'total_grains': row['total_grains'],
                'created_at': row['created_at']
            })
        
        return jsonify({
            'data': results,
            'page': page,
            'limit': limit,
            'total': total,
            'pages': (total + limit - 1) // limit
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analysis/<int:id>', methods=['GET'])
def get_analysis(id):
    """Get specific analysis"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM analyses WHERE id = ?', (id,))
        row = c.fetchone()
        conn.close()
        
        if not row:
            return jsonify({'error': 'Analysis not found'}), 404
        
        return jsonify({
            'id': row['id'],
            'filename': row['original_filename'],
            'fine_grains': row['fine_percentage'],
            'medium_grains': row['medium_percentage'],
            'coarse_grains': row['coarse_percentage'],
            'total_grains': row['total_grains'],
            'created_at': row['created_at']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get overall statistics"""
    try:
        conn = get_db()
        c = conn.cursor()
        
        c.execute('''SELECT 
            COUNT(*) as total_analyses,
            AVG(fine_percentage) as avg_fine,
            AVG(medium_percentage) as avg_medium,
            AVG(coarse_percentage) as avg_coarse,
            SUM(total_grains) as total_grains_analyzed
        FROM analyses''')
        stats = c.fetchone()
        conn.close()
        
        return jsonify({
            'total_analyses': stats['total_analyses'] or 0,
            'average_fine': round(stats['avg_fine'] or 0, 2),
            'average_medium': round(stats['avg_medium'] or 0, 2),
            'average_coarse': round(stats['avg_coarse'] or 0, 2),
            'total_grains_analyzed': stats['total_grains_analyzed'] or 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/<format>', methods=['GET'])
def export_data(format):
    """Export data in CSV or JSON format"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM analyses ORDER BY created_at DESC')
        analyses = c.fetchall()
        conn.close()
        
        if format.lower() == 'json':
            data = []
            for row in analyses:
                data.append({
                    'id': row['id'],
                    'filename': row['original_filename'],
                    'fine_grains': row['fine_percentage'],
                    'medium_grains': row['medium_percentage'],
                    'coarse_grains': row['coarse_percentage'],
                    'total_grains': row['total_grains'],
                    'created_at': row['created_at']
                })
            return jsonify(data), 200
        
        elif format.lower() == 'csv':
            csv_data = "ID,Filename,Fine %,Medium %,Coarse %,Total Grains,Created At\n"
            for row in analyses:
                csv_data += f"{row['id']},{row['original_filename']},{row['fine_percentage']},{row['medium_percentage']},{row['coarse_percentage']},{row['total_grains']},{row['created_at']}\n"
            
            from flask import Response
            return Response(csv_data, mimetype='text/csv', headers={"Content-Disposition": "attachment;filename=sandvision_export.csv"}), 200
        
        else:
            return jsonify({'error': 'Invalid format. Use csv or json'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/delete/<int:id>', methods=['DELETE'])
def delete_analysis(id):
    """Delete an analysis"""
    try:
        conn = get_db()
        c = conn.cursor()
        
        # Get file path
        c.execute('SELECT filename FROM analyses WHERE id = ?', (id,))
        row = c.fetchone()
        
        if not row:
            return jsonify({'error': 'Analysis not found'}), 404
        
        # Delete file
        if row['filename'] and os.path.exists(row['filename']):
            os.remove(row['filename'])
        
        # Delete from database
        c.execute('DELETE FROM analyses WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Analysis deleted'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
