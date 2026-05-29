import os
import json
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def load_cv_data():
    data_path = os.path.join(app.root_path, 'cv_data.json')
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading CV data: {e}")
        return {}

STATS_FILE = 'stats.json'

def get_stats():
    if not os.path.exists(STATS_FILE):
        return {"phone_clicks": 0}
    try:
        with open(STATS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"phone_clicks": 0}

def increment_phone_clicks():
    stats = get_stats()
    stats["phone_clicks"] = stats.get("phone_clicks", 0) + 1
    try:
        with open(STATS_FILE, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        print(f"Error saving stats: {e}")
    return stats["phone_clicks"]

@app.route('/')
def index():
    cv_data = load_cv_data()
    return render_template('index.html', cv=cv_data)

@app.route('/api/reveal-phone', methods=['POST'])
def reveal_phone():
    cv_data = load_cv_data()
    phone_number = cv_data.get('personal_info', {}).get('phone', 'N/A')
    
    clicks = increment_phone_clicks()
    
    return jsonify({
        "status": "success",
        "phone": phone_number,
        "clicks": clicks
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
