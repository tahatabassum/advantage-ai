
from backend.database import SessionLocal
from backend.models import User

def reset():
    db = SessionLocal()
    try:
        num_deleted = db.query(User).delete()
        db.commit()
        print(f"SUCCESS: Deleted {num_deleted} users.")
    except Exception as e:
        print(f"ERROR: {str(e)}")
    finally:
        db.close()

if __name__ == '__main__':
    reset()
