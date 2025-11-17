"""
SandVision Backend - Main Flask Application
Handles image processing, ML analysis, and API endpoints
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
from datetime import datetime
import traceback

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///sandvision.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Database
db = SQLAlchemy(app)

# Import models
from models import SandAnalysis, User
from image_processor import analyze_sand_image
from ml_model import classify_sand_grains

# Create tables
with app.app_context():
    db.create_all()


# ==================== API ROUTES ====================

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({'status': 'SandVision Backend is running', 'version': '1.0'}), 200


@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    """
    Analyze sand image and classify grain sizes
    Expects: image file in multipart form data
    Returns: Analysis results with grain size distribution
    """
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save image temporarily
        filename = f"temp_{datetime.now().timestamp()}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image_file.save(filepath)

        # Process image
        image_features = analyze_sand_image(filepath)
        
        # Classify using ML model
        classification = classify_sand_grains(image_features)

        # Save to database
        analysis = SandAnalysis(
            filename=filename,
            original_filename=image_file.filename,
            fine_percentage=classification['fine'],
            medium_percentage=classification['medium'],
            coarse_percentage=classification['coarse'],
            analysis_date=datetime.now()
        )
        db.session.add(analysis)
        db.session.commit()

        return jsonify({
            'success': True,
            'analysis_id': analysis.id,
            'results': {
                'fine_grains': round(classification['fine'], 2),
                'medium_grains': round(classification['medium'], 2),
                'coarse_grains': round(classification['coarse'], 2),
                'confidence': round(classification['confidence'], 2),
                'total_particles': classification['total_particles'],
                'average_size': round(classification['avg_size'], 2)
            },
            'timestamp': analysis.analysis_date.isoformat()
        }), 200

    except Exception as e:
        print(f"Error in analyze_image: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Get analysis history
    Returns: List of all previous analyses
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        analyses = SandAnalysis.query.order_by(
            SandAnalysis.analysis_date.desc()
        ).paginate(page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'total': analyses.total,
            'pages': analyses.pages,
            'current_page': page,
            'results': [
                {
                    'id': a.id,
                    'filename': a.original_filename,
                    'fine': a.fine_percentage,
                    'medium': a.medium_percentage,
                    'coarse': a.coarse_percentage,
                    'date': a.analysis_date.isoformat()
                }
                for a in analyses.items
            ]
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to retrieve history: {str(e)}'}), 500


@app.route('/api/analysis/<int:analysis_id>', methods=['GET'])
def get_analysis(analysis_id):
    """
    Get detailed analysis results
    Returns: Detailed information about a specific analysis
    """
    try:
        analysis = SandAnalysis.query.get(analysis_id)
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404

        return jsonify({
            'success': True,
            'analysis': {
                'id': analysis.id,
                'filename': analysis.original_filename,
                'fine_grains': analysis.fine_percentage,
                'medium_grains': analysis.medium_percentage,
                'coarse_grains': analysis.coarse_percentage,
                'date': analysis.analysis_date.isoformat(),
                'notes': analysis.notes
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to retrieve analysis: {str(e)}'}), 500


@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """
    Get statistical summary of all analyses
    Returns: Average grain distributions and trends
    """
    try:
        analyses = SandAnalysis.query.all()
        
        if not analyses:
            return jsonify({
                'success': True,
                'statistics': {
                    'total_analyses': 0,
                    'average_fine': 0,
                    'average_medium': 0,
                    'average_coarse': 0
                }
            }), 200

        total = len(analyses)
        avg_fine = sum(a.fine_percentage for a in analyses) / total
        avg_medium = sum(a.medium_percentage for a in analyses) / total
        avg_coarse = sum(a.coarse_percentage for a in analyses) / total

        return jsonify({
            'success': True,
            'statistics': {
                'total_analyses': total,
                'average_fine': round(avg_fine, 2),
                'average_medium': round(avg_medium, 2),
                'average_coarse': round(avg_coarse, 2)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to retrieve statistics: {str(e)}'}), 500


@app.route('/api/export/<format>', methods=['GET'])
def export_data(format):
    """
    Export analysis data in CSV or JSON format
    Returns: Formatted export of all analyses
    """
    try:
        analyses = SandAnalysis.query.all()

        if format.lower() == 'json':
            data = [{
                'id': a.id,
                'filename': a.original_filename,
                'fine_grains': a.fine_percentage,
                'medium_grains': a.medium_percentage,
                'coarse_grains': a.coarse_percentage,
                'date': a.analysis_date.isoformat()
            } for a in analyses]
            return jsonify({'data': data}), 200

        elif format.lower() == 'csv':
            import csv
            from io import StringIO
            
            output = StringIO()
            writer = csv.writer(output)
            writer.writerow(['ID', 'Filename', 'Fine (%)', 'Medium (%)', 'Coarse (%)', 'Date'])
            
            for a in analyses:
                writer.writerow([
                    a.id,
                    a.original_filename,
                    a.fine_percentage,
                    a.medium_percentage,
                    a.coarse_percentage,
                    a.analysis_date
                ])
            
            return output.getvalue(), 200, {
                'Content-Disposition': 'attachment; filename=sandvision_data.csv',
                'Content-Type': 'text/csv'
            }

        else:
            return jsonify({'error': 'Unsupported format. Use "json" or "csv"'}), 400

    except Exception as e:
        return jsonify({'error': f'Export failed: {str(e)}'}), 500


@app.route('/api/delete/<int:analysis_id>', methods=['DELETE'])
def delete_analysis(analysis_id):
    """
    Delete a specific analysis record
    """
    try:
        analysis = SandAnalysis.query.get(analysis_id)
        if not analysis:
            return jsonify({'error': 'Analysis not found'}), 404

        # Delete associated file
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], analysis.filename)
        if os.path.exists(filepath):
            os.remove(filepath)

        db.session.delete(analysis)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Analysis deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to delete analysis: {str(e)}'}), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


# ==================== MAIN ====================

if __name__ == '__main__':
    print("Starting SandVision Backend...")
    app.run(debug=True, host='0.0.0.0', port=5000)
