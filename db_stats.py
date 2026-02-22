import os
from pymongo import MongoClient
from dotenv import load_dotenv
import json
import certifi
import ssl

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://abbusaikiran53:Saikiran9493@cluster0.6iuyadj.mongodb.net/skilltrack_db?retryWrites=true&w=majority")
DB_NAME = os.getenv("DB_NAME", "skilltrack_db")

# Test direct connection to a shard
DIRECT_URI = "mongodb://abbusaikiran53:Saikiran9493@ac-pepcel6-shard-00-00.6iuyadj.mongodb.net:27017/skilltrack_db?ssl=true&directConnection=true"

client = MongoClient(DIRECT_URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
db = client[DB_NAME]

def get_db_details():
    details = {
        "database_name": DB_NAME,
        "collections": {}
    }
    
    for coll_name in db.list_collection_names():
        coll = db[coll_name]
        count = coll.count_documents({})
        sample = coll.find_one({}, {"_id": 0, "password": 0}) # Don't show password
        
        details["collections"][coll_name] = {
            "document_count": count,
            "sample_schema": list(sample.keys()) if sample else "Empty"
        }
    
    return details

if __name__ == "__main__":
    try:
        print(f"Connecting to: {MONGO_URI}")
        data = get_db_details()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        import ssl
        print(f"Python SSL Version: {ssl.OPENSSL_VERSION}")
