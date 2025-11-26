"""
Script para agregar la columna subtotal_final a detalles_venta
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("[*] Verificando columna subtotal_final...")

        # Verificar si ya existe
        result = connection.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'detalles_venta'
            AND column_name = 'subtotal_final';
        """))

        if result.fetchone():
            print("[!] La columna subtotal_final ya existe")
        else:
            print("[+] Agregando columna subtotal_final...")
            connection.execute(text("""
                ALTER TABLE detalles_venta
                ADD COLUMN subtotal_final NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
            """))
            connection.commit()
            print("[OK] Columna agregada")

            # Actualizar valores existentes
            print("[*] Actualizando valores existentes...")
            connection.execute(text("""
                UPDATE detalles_venta
                SET subtotal_final = subtotal - descuento_item;
            """))
            connection.commit()
            print("[OK] Valores actualizados")

        # Mostrar esquema final
        print("\n[*] Esquema final de detalles_venta:\n")
        result = connection.execute(text("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'detalles_venta'
            ORDER BY ordinal_position;
        """))

        for row in result:
            print(f"  - {row[0]}: {row[1]}")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    exit(1)

print("\n[OK] Completado!")
