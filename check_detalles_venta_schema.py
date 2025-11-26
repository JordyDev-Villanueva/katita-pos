"""
Script para verificar el esquema de detalles_venta en Supabase
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("\n[*] Verificando esquema de detalles_venta...\n")

        result = connection.execute(text("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'detalles_venta'
            ORDER BY ordinal_position;
        """))

        print("Columnas en detalles_venta:")
        print("-" * 80)
        for row in result:
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            default = f"DEFAULT {row[3]}" if row[3] else ""
            print(f"  {row[0]:<30} {row[1]:<20} {nullable:<10} {default}")
        print("-" * 80)

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    exit(1)
