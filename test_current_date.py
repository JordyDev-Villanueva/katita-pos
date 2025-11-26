"""
Script para verificar CURRENT_DATE en Supabase
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        # Ver hora actual de Supabase
        result = connection.execute(text("""
            SELECT
                NOW() as now_utc,
                CURRENT_DATE as current_date,
                CURRENT_TIMESTAMP as current_timestamp;
        """))

        row = result.fetchone()
        print(f"NOW(): {row[0]}")
        print(f"CURRENT_DATE: {row[1]}")
        print(f"CURRENT_TIMESTAMP: {row[2]}")

        print("\n[*] Ventas:")
        result = connection.execute(text("""
            SELECT id, numero_venta, created_at,
                   DATE(created_at) as fecha_date,
                   CURRENT_DATE
            FROM ventas
            ORDER BY created_at DESC;
        """))

        for v in result.fetchall():
            print(f"  Venta #{v[0]}: created_at={v[2]}, DATE(created_at)={v[3]}, CURRENT_DATE={v[4]}, MATCH={v[3] == v[4]}")

except Exception as e:
    print(f"ERROR: {e}")
