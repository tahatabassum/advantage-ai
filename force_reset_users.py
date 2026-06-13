import sys
import os

# Add the current directory to sys.path so we can import backend
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend.models import User

def reset_db():
    db = SessionLocal()
    try:
        num_deleted = db.query(User).delete()
        db.commit()
        print(f"SUCCESS: Deleted {num_deleted} users directly via SQLAlchemy.")
    except Exception as e:
        print(f"ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
