import os
from flask import Flask, request, jsonify, send_from_directory # Added send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

# Import your RAG logic
from rag_pipeline import process_website, get_answer

load_dotenv()

# ✅ Updated: Added static_folder and static_url_path
app = Flask(__name__, static_folder='dist', static_url_path='/')

# 🚀 COMPLETE CORS FIX
CORS(app, resources={r"/*": {"origins": "*"}})

# 🌐 MONGO SETUP
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.neural_nexus_db
history_collection = db.user_history

current_vectordb = None

# ✅ Added: Route to serve the React Frontend
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

# ✅ Added: Fix for React Router refresh errors (404 handler)
@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/index', methods=['POST'])
def index_website_route():
    global current_vectordb
    data = request.json
    url = data.get('url')
    try:
        current_vectordb = process_website([url], [{}])
        return jsonify({"status": "success", "message": "Indexed"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask_question_route():
    global current_vectordb
    query = request.json.get('query')
    if current_vectordb is None:
        return jsonify({"answer": "Please index a website first."}), 400
    answer = get_answer(query, current_vectordb)
    return jsonify({"answer": answer})

@app.route('/api/save-history', methods=['POST', 'OPTIONS'])
def save_to_cloud():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.json
        user_email = data.get('email')
        session = data.get('session')
        sid = str(session.get('id'))

        history_collection.update_one(
            {"user_email": user_email, "session_id": sid},
            {"$set": {
                "user_email": user_email,
                "session_id": sid,
                "url": session['url'],
                "date": session['date'],
                "messages": session['messages']
            }},
            upsert=True
        )
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/get-history/<email>', methods=['GET', 'OPTIONS'])
def get_from_cloud(email):
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200
        
    logs = list(history_collection.find({"user_email": email}, {"_id": 0}).sort("date", -1))
    return jsonify(logs), 200

@app.route('/api/delete-history', methods=['DELETE', 'OPTIONS'])
def delete_from_cloud():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json()
        user_email = data.get('email')
        sid = data.get('id')
        
        history_collection.delete_one({
            "user_email": user_email,
            "session_id": str(sid)
        })
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # ✅ Updated: Use environment port for Render
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)