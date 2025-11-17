"""
Utility functions for SandVision Backend
"""

import os
from datetime import datetime
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'bmp'}


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_secure_filename(filename):
    """Get secure filename"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
    return timestamp + secure_filename(filename)


def cleanup_old_files(directory, max_age_hours=24):
    """Remove old uploaded files"""
    if not os.path.exists(directory):
        return 0

    import time
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    deleted_count = 0

    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            file_age = current_time - os.path.getmtime(filepath)
            if file_age > max_age_seconds:
                try:
                    os.remove(filepath)
                    deleted_count += 1
                except Exception as e:
                    print(f"Error deleting {filename}: {e}")

    return deleted_count


def format_error_response(message, status_code=500):
    """Format error response"""
    return {
        'success': False,
        'error': message,
        'timestamp': datetime.now().isoformat()
    }, status_code


def format_success_response(data, message=None):
    """Format success response"""
    response = {
        'success': True,
        'data': data,
        'timestamp': datetime.now().isoformat()
    }
    if message:
        response['message'] = message
    return response


class ImageValidator:
    """Validate uploaded images"""

    MIN_WIDTH = 200
    MAX_WIDTH = 5000
    MIN_HEIGHT = 200
    MAX_HEIGHT = 5000
    MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

    @staticmethod
    def validate(file_obj):
        """Validate image file"""
        errors = []

        # Check file exists
        if not file_obj:
            errors.append("No file provided")
            return False, errors

        # Check file size
        file_obj.seek(0, os.SEEK_END)
        file_size = file_obj.tell()
        file_obj.seek(0)

        if file_size > ImageValidator.MAX_FILE_SIZE:
            errors.append(f"File size exceeds {ImageValidator.MAX_FILE_SIZE / 1024 / 1024}MB")

        # Check file extension
        if not allowed_file(file_obj.filename):
            errors.append("Invalid file type. Allowed: JPG, PNG, GIF, BMP")

        return len(errors) == 0, errors


class DatabaseHelper:
    """Helper functions for database operations"""

    @staticmethod
    def get_paginated_results(query, page=1, per_page=10):
        """Get paginated results from query"""
        pagination = query.paginate(page=page, per_page=per_page)
        return {
            'items': [item.to_dict() if hasattr(item, 'to_dict') else item for item in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }

    @staticmethod
    def bulk_delete(model, ids):
        """Delete multiple records"""
        from app import db
        try:
            deleted = 0
            for id in ids:
                item = model.query.get(id)
                if item:
                    db.session.delete(item)
                    deleted += 1
            db.session.commit()
            return deleted
        except Exception as e:
            db.session.rollback()
            raise e
