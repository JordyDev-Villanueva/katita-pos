"""
Test Supabase connection to verify credentials are working
"""
from sqlalchemy import create_engine, text

SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Testing connection to Supabase...")
print(f"[*] Host: aws-1-sa-east-1.pooler.supabase.com:6543")

try:
    engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

    # Test connection with a simple query
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"[OK] Connection successful!")
        print(f"[OK] PostgreSQL version: {version}")

        # Check if tables exist
        result = connection.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))

        tables = [row[0] for row in result.fetchall()]
        print(f"\n[OK] Found {len(tables)} tables in database:")
        for table in tables:
            print(f"     - {table}")

except Exception as e:
    print(f"[ERROR] Connection failed!")
    print(f"[ERROR] {type(e).__name__}: {e}")
