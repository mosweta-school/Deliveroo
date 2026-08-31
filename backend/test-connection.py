# test_connection.py
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # Test connection
    result = db.session.execute(text("SELECT 1")).scalar()
    print(f"✅ Database connected! Result: {result}")
    
    # Check tables
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"\n📊 Tables in database:")
    for table in sorted(tables):
        print(f"   - {table}")