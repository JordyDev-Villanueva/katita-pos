"""
Script para agregar updated_at a todas las tablas que lo necesiten
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

tables_to_fix = ['detalles_venta', 'sync_queue']

try:
    with engine.connect() as connection:
        for table in tables_to_fix:
            print(f"\n[*] Procesando tabla '{table}'...")

            # Verificar si ya tiene la columna
            result = connection.execute(text(f"""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = '{table}'
                AND column_name = 'updated_at';
            """))

            if result.fetchone():
                print(f"[!] '{table}' ya tiene 'updated_at', saltando...")
                continue

            print(f"[+] Agregando 'updated_at' a '{table}'...")

            connection.execute(text(f"""
                ALTER TABLE {table}
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
            """))

            connection.commit()
            print(f"[OK] Columna agregada a '{table}'!")

        print("\n[OK] Migracion completada!")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    exit(1)
