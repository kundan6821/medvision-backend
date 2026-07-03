# Flask Frontend - Medicine Information Finder

Flask-based frontend for the Medicine Information Engine.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure your Node.js backend is running on port 3000

3. Run the Flask app:
```bash
python app.py
```

4. Open browser at: http://localhost:5000

## Features

- Search medicine by name
- View medicine information (brand, composition, strength, uses)
- Safety information with side effects
- Price alternatives sorted by cost
- Responsive mobile-first design
- Medical blue theme

## Architecture

```
flask-frontend/
├── app.py                 # Flask backend
├── templates/
│   └── index.html        # Frontend UI
├── static/
│   ├── css/
│   │   └── style.css     # Styling
│   └── js/
│       └── app.js        # JavaScript logic
├── requirements.txt      # Python dependencies
└── .env                  # Configuration
```
