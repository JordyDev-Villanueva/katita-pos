"""
Script to verify configuration and database connection for deployment
"""
import os
from config import get_config

print("=" * 60)
print("KATITA-POS Configuration Verification")
print("=" * 60)

# Check environment variables
print("\n[1] Environment Variables:")
print(f"    FLASK_ENV: {os.environ.get('FLASK_ENV', 'NOT SET')}")
print(f"    DATABASE_MODE: {os.environ.get('DATABASE_MODE', 'NOT SET')}")
print(f"    POSTGRES_DATABASE_URI: {'SET' if os.environ.get('POSTGRES_DATABASE_URI') else 'NOT SET'}")

# Get configuration
config_class = get_config()
print(f"\n[2] Active Configuration Class: {config_class.__name__}")
print(f"    DEBUG: {config_class.DEBUG}")
print(f"    TESTING: {config_class.TESTING}")
print(f"    DATABASE_MODE: {config_class.DATABASE_MODE}")

# Show database URI (masked)
db_uri = config_class.SQLALCHEMY_DATABASE_URI
if 'postgresql' in db_uri:
    # Mask password
    parts = db_uri.split('@')
    if len(parts) == 2:
        masked_uri = f"{parts[0].split(':')[0]}:***@{parts[1]}"
    else:
        masked_uri = "postgresql://***"
    print(f"    SQLALCHEMY_DATABASE_URI: {masked_uri}")
else:
    print(f"    SQLALCHEMY_DATABASE_URI: {db_uri}")

# Test database connection
print("\n[3] Testing Database Connection...")
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(config_class.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)

    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"    ✓ Connection successful!")
        print(f"    ✓ PostgreSQL: {version.split(',')[0]}")

        # Check tables
        result = connection.execute(text("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public';
        """))
        table_count = result.fetchone()[0]
        print(f"    ✓ Tables found: {table_count}")

except Exception as e:
    print(f"    ✗ Connection failed: {type(e).__name__}")
    print(f"    ✗ Error: {str(e)[:100]}")

print("\n" + "=" * 60)
print("Verification complete")
print("=" * 60)
