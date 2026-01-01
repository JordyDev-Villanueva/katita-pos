"""
Test Supabase connection to verify credentials are working
"""
from sqlalchemy import create_engine, text
import os
import sys
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

SUPABASE_URL = os.getenv('POSTGRES_DATABASE_URI')

if not SUPABASE_URL:
    print("[ERROR] POSTGRES_DATABASE_URI no encontrada en variables de entorno")
    print("[ERROR] Crea un archivo .env con tu connection string")
    sys.exit(1)

# Extraer host de la URL para mostrar (sin exponer credenciales)
try:
    from urllib.parse import urlparse
    parsed = urlparse(SUPABASE_URL)
    host_info = f"{parsed.hostname}:{parsed.port}" if parsed.port else parsed.hostname
except:
    host_info = "[oculto por seguridad]"

print("[*] Testing connection to Supabase...")
print(f"[*] Host: {host_info}")

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
