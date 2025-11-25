"""
Script para verificar la columna updated_at en todas las tablas de Supabase
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        # Obtener todas las tablas
        result = connection.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))

        tables = [row[0] for row in result.fetchall()]

        print(f"\n[*] Verificando {len(tables)} tablas...\n")

        tables_sin_updated_at = []

        for table in tables:
            # Verificar si tiene updated_at
            result = connection.execute(text(f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = '{table}'
                AND column_name = 'updated_at';
            """))

            tiene_updated_at = result.fetchone() is not None

            status = "OK" if tiene_updated_at else "NO"
            print(f"[{status}] {table}")

            if not tiene_updated_at:
                tables_sin_updated_at.append(table)

        if tables_sin_updated_at:
            print(f"\n[!] Tablas SIN 'updated_at': {', '.join(tables_sin_updated_at)}")
        else:
            print("\n[OK] Todas las tablas tienen 'updated_at'")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    exit(1)
