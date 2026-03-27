from flask import Flask, render_template, send_from_directory, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime

from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure
import certifi

# Load environment variables
load_dotenv()

try:
    import numpy as np
    from sklearn.linear_model import LinearRegression
    HAS_ML = True
    
    # Train a dummy model on startup to simulate a real ML model evaluating the history
    # Features: [completion_pct, total_focus_mins, total_sessions, streak_days]
    dummy_X = np.array([
        [0, 0, 0, 0],
        [30, 60, 2, 1],
        [60, 200, 8, 3],
        [85, 450, 18, 7],
        [100, 700, 30, 14]
    ])
    # Target Scores
    dummy_y = np.array([10, 40, 65, 88, 100])
    
    ml_model = LinearRegression()
    ml_model.fit(dummy_X, dummy_y)
except ImportError:
    HAS_ML = False

app = Flask(__name__, 
            static_folder='static', 
            template_folder='templets')
CORS(app)

# --- ROBUST DB FALLBACK ---
import json
import uuid

class MockCollection:
    def __init__(self, name, file_path):
        self.name = name
        self.file_path = file_path

    def _load(self):
        if not os.path.exists(self.file_path): return []
        try:
            with open(self.file_path, 'r') as f:
                data = json.load(f)
                return data.get(self.name, [])
        except: return []

    def _save(self, data_list):
        all_data = {}
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r') as f: all_data = json.load(f)
            except: pass
        all_data[self.name] = data_list
        with open(self.file_path, 'w') as f: json.dump(all_data, f, indent=4)

    def find_one(self, query, projection=None):
        data = self._load()
        for item in data:
            if all(item.get(k) == v for k, v in query.items()): return item
        return None

    def insert_one(self, doc):
        data = self._load()
        if '_id' not in doc: doc['_id'] = str(uuid.uuid4())
        data.append(doc)
        self._save(data)
        return type('result', (), {'inserted_id': doc['_id']})()

    def find(self, query):
        data = self._load()
        return [item for item in data if all(item.get(k) == v for k, v in query.items())]

    def delete_one(self, query):
        data = self._load()
        for i, item in enumerate(data):
            if all(item.get(k) == v for k, v in query.items()):
                del data[i]
                self._save(data)
                return type('result', (), {'deleted_count': 1})()
        return type('result', (), {'deleted_count': 0})()

    def delete_many(self, query):
        data = self._load()
        initial_len = len(data)
        data = [item for item in data if not all(item.get(k) == v for k, v in query.items())]
        self._save(data)
        return type('result', (), {'deleted_count': initial_len - len(data)})()

class MockDatabase:
    def __init__(self, file_path):
        self.file_path = file_path
    def __getitem__(self, coll_name):
        return MockCollection(coll_name, self.file_path)

# MongoDB Setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://infobyte:Saikiran9493@infobyte.t54p2fi.mongodb.net/?appName=Infobyte")
DB_NAME = os.getenv("DB_NAME", "Infobyte")

def get_db_safe():
    try:
        # Fast ping
        client.admin.command('ping')
        return True
    except:
        return False

# Initialize Client
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000, tlsCAFile=certifi.where(), tlsInsecure=True)

# Select DB or Mock
if get_db_safe():
    print(">>> SUCCESS: Connected to MongoDB Atlas")
    db = client[DB_NAME]
else:
    print(">>> WARNING: MongoDB Atlas unreachable. Auto-switching to /tmp/local_db.json")
    db = MockDatabase("/tmp/local_db.json")

users_col = db['users']
tasks_col = db['tasks']
sessions_col = db['sessions']
scores_col = db['scores']
badges_col = db['badges']

def db_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Even if Atlas comes back, we stick to what we initialized with for consistency during run
        return f(*args, **kwargs)
    return decorated_function

# --- API ENDPOINTS ---

@app.route('/api/signup', methods=['POST'])
@db_required
def api_signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        if users_col.find_one({"email": email}):
            return jsonify({"success": False, "message": "User already exists"}), 400

        users_col.insert_one({
            "name": name,
            "email": email,
            "password": password
        })
        return jsonify({"success": True, "message": "Account created successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

@app.route('/api/signin', methods=['POST'])
@db_required
def api_signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        user = users_col.find_one({"email": email, "password": password})
        if user:
            # Don't send password back
            user_data = {
                "name": user['name'],
                "email": user['email']
            }
            return jsonify({"success": True, "message": "Login successful", "user": user_data})
        else:
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

# --- TASK API ---
tasks_col = db['tasks']

@app.route('/api/tasks', methods=['GET'])
@db_required
def get_user_tasks():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    
    try:
        tasks = list(tasks_col.find({"email": email}))
        for t in tasks:
            t['_id'] = str(t['_id']) # Convert ObjectId to string
        return jsonify(tasks)
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

@app.route('/api/tasks', methods=['POST'])
@db_required
def add_task():
    data = request.json
    if not data.get('email') or not data.get('title'):
        return jsonify({"success": False, "message": "Missing fields"}), 400
    
    try:
        data['created_at'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        result = tasks_col.insert_one(data)
        data['_id'] = str(result.inserted_id)
        return jsonify({"success": True, "message": "Task saved!", "task": data})
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
@db_required
def delete_task(task_id):
    from bson.objectid import ObjectId
    try:
        result = tasks_col.delete_one({"_id": ObjectId(task_id)})
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "Task deleted"})
        return jsonify({"success": False, "message": "Task not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": "Invalid ID or database error"}), 400

@app.route('/api/tasks', methods=['DELETE'])
@db_required
def clear_all_tasks():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    try:
        result = tasks_col.delete_many({"email": email})
        return jsonify({"success": True, "message": f"Cleared {result.deleted_count} tasks"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# --- SESSION API ---
sessions_col = db['sessions']

@app.route('/api/sessions', methods=['GET'])
@db_required
def get_user_sessions():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    
    try:
        sessions = list(sessions_col.find({"email": email}))
        for s in sessions:
            s['_id'] = str(s['_id'])
        return jsonify(sessions)
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

@app.route('/api/sessions', methods=['POST'])
@db_required
def add_session():
    data = request.json
    if not data.get('email') or not data.get('task'):
        return jsonify({"success": False, "message": "Missing fields"}), 400
    
    try:
        sessions_col.insert_one(data)
        return jsonify({"success": True, "message": "Session saved!"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

@app.route('/api/sessions', methods=['DELETE'])
@db_required
def clear_user_sessions():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    
    try:
        sessions_col.delete_many({"email": email})
        return jsonify({"success": True, "message": "Sessions cleared"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Database error: {str(e)}"}), 500

# --- SCORE API ---
scores_col = db['scores']

@app.route('/api/scores', methods=['GET'])
@db_required
def get_user_score():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    try:
        score_doc = scores_col.find_one({"email": email})
        if score_doc:
            return jsonify({"success": True, "score": score_doc.get('score', 0)})
        return jsonify({"success": True, "score": 0})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/scores', methods=['POST'])
@db_required
def save_user_score():
    data = request.json
    email = data.get('email')
    score = data.get('score')
    if not email or score is None:
        return jsonify({"success": False, "message": "Missing fields"}), 400
    try:
        # Use simple logic for Mock/Real compatibility
        existing = scores_col.find_one({"email": email})
        if existing:
            scores_col.delete_one({"email": email})
        scores_col.insert_one({"email": email, "score": score})
        return jsonify({"success": True, "message": "Score saved!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/db-status')
def get_db_status():
    is_atlas = not isinstance(db, MockDatabase)
    return jsonify({
        "status": "Online" if is_atlas else "Offline (Local Sync Active)",
        "type": "MongoDB Atlas" if is_atlas else "Local JSON Fallback"
    })

@app.route('/api/predict', methods=['GET'])
@db_required
def predict_score():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
        
    try:
        # Fetch actual DB statistics for the user
        user_tasks = list(tasks_col.find({"email": email}))
        user_sessions = list(sessions_col.find({"email": email}))
        
        # Calculate features
        total_tasks = len(user_tasks)
        completed_tasks = sum(1 for t in user_tasks if t.get('status') == 'Completed')
        completion_pct = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        
        total_focus_mins = sum(s.get('minutes', 0) for s in user_sessions)
        total_sessions = len(user_sessions)
        
        # Mock streak calculation based on sessions
        streak_days = min(total_sessions // 2, 10)
        
        if not HAS_ML:
            # Fallback heuristic if scikit-learn isn't installed
            predicted_score = (completion_pct * 0.4) + min(total_focus_mins / 10, 30) + min(total_sessions * 2, 20) + min(streak_days * 2, 10)
        else:
            # Prepare data for ML Model
            features = np.array([[completion_pct, total_focus_mins, total_sessions, streak_days]])
            predicted_score = ml_model.predict(features)[0]
            
        # Bound score between 0 and 100
        final_score = int(max(0, min(100, predicted_score)))
        
        return jsonify({
            "success": True, 
            "score": final_score,
            "features_used": {
                "completion_pct": completion_pct,
                "total_focus_mins": total_focus_mins,
                "total_sessions": total_sessions,
                "streak_days": streak_days
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# --- BADGES API ---
badges_col = db['badges']

@app.route('/api/badges', methods=['GET'])
@db_required
def get_user_badges():
    email = request.args.get('email')
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400
    try:
        user_badges = badges_col.find_one({"email": email})
        if user_badges:
            return jsonify({"success": True, "badges": user_badges.get('unlocked', [])})
        return jsonify({"success": True, "badges": []})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/badges', methods=['POST'])
@db_required
def save_user_badges():
    data = request.json
    email = data.get('email')
    unlocked = data.get('unlocked', []) # List of badge names
    if not email:
        return jsonify({"success": False, "message": "Missing email"}), 400
    try:
        existing = badges_col.find_one({"email": email})
        if existing:
            badges_col.delete_one({"email": email})
        badges_col.insert_one({"email": email, "unlocked": unlocked})
        return jsonify({"success": True, "message": "Badges synced!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# --- CHAT / BOT API ---

@app.route('/api/chat', methods=['POST'])
@db_required
def api_chat():
    data = request.json
    email = data.get('email')
    message = data.get('message')

    if not email or not message:
        return jsonify({"success": False, "message": "Missing email or message"}), 400

    try:
        # Simple bot response logic for now
        bot_response = f"I received your message: '{message}'. How can I help you improve your skills today?"

        return jsonify({
            "success": True, 
            "response": bot_response,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# --- PAGE ROUTES ---

# Route for Landing Page
@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

# Route for Dashboard
@app.route('/dashboard')
@app.route('/dashboard.html')
def dashboard():
    return render_template('dashboard.html')

# Route for Sign In
@app.route('/signin')
@app.route('/signin.html')
def signin():
    return render_template('signin.html')

# Route for Sign Up
@app.route('/signup')
@app.route('/signup.html')
def signup():
    return render_template('signup.html')

# Route for Add Task
@app.route('/addtask')
@app.route('/addtask.html')
def addtask():
    return render_template('addtask.html')

# Route for Badges
@app.route('/badges')
@app.route('/badges.html')
def badges():
    return render_template('badges.html')

# Route for Prediction
@app.route('/prediction')
@app.route('/prediction.html')
def prediction():
    return render_template('prediction.html')

# Route for Report
@app.route('/report')
@app.route('/report.html')
def report():
    return render_template('report.html')

# Route for Timer
@app.route('/timer')
@app.route('/timer.html')
def timer():
    return render_template('timer.html')

# Serve static files explicitly if needed (Flask usually handles this automatically if folder is 'static')
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    # Using default port 5000
    print("SkillTrackAI Backend starting...")
    app.run(debug=True, port=5000)
