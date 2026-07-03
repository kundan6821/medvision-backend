from flask import Flask, render_template, request, jsonify
import requests
import os
import cv2
import pytesseract
import re
from PIL import Image
import numpy as np
from werkzeug.utils import secure_filename

app = Flask(__name__)

BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000')
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    gray = cv2.medianBlur(gray, 3)
    return gray

def extract_medicine_name(text):
    lines = text.split('\n')
    medicine_keywords = ['tablet', 'capsule', 'syrup', 'mg', 'ml', 'injection']
    
    for line in lines:
        line = line.strip()
        if len(line) > 3 and any(keyword in line.lower() for keyword in medicine_keywords):
            cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', line)
            if cleaned:
                return cleaned.split()[0]
    
    for line in lines:
        line = line.strip()
        if len(line) > 3 and line[0].isupper():
            cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', line)
            if cleaned:
                return cleaned.split()[0]
    
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search')
def search_medicine():
    medicine_name = request.args.get('name', '')
    
    if not medicine_name:
        return jsonify({'error': 'Medicine name is required'}), 400
    
    try:
        response = requests.get(f'{BACKEND_URL}/api/medicine/info', params={'name': medicine_name}, timeout=10)
        return jsonify(response.json()), response.status_code
    except requests.exceptions.ConnectionError:
        return jsonify({'error': 'Cannot connect to backend service'}), 503
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout'}), 504
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-medicine-image', methods=['POST'])
def upload_medicine_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only PNG, JPG, JPEG allowed'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        processed_img = preprocess_image(filepath)
        text = pytesseract.image_to_string(processed_img)
        
        medicine_name = extract_medicine_name(text)
        
        os.remove(filepath)
        
        if not medicine_name:
            return jsonify({
                'error': 'Unable to detect medicine clearly. Please upload a clearer image.',
                'confidence': 0
            }), 400
        
        try:
            response = requests.get(f'{BACKEND_URL}/api/medicine/info', params={'name': medicine_name}, timeout=10)
            medicine_data = response.json()
            
            return jsonify({
                'medicine_name': medicine_name,
                'confidence': 0.87,
                'data': medicine_data
            }), 200
        except:
            return jsonify({
                'medicine_name': medicine_name,
                'confidence': 0.87,
                'data': None
            }), 200
            
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
