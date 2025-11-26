"""
Script para agregar las columnas faltantes a detalles_venta en Supabase
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("[*] Agregando columnas faltantes a detalles_venta...\n")

        # Agregar descuento_item
        print("[+] Agregando columna descuento_item...")
        connection.execute(text("""
            ALTER TABLE detalles_venta
            ADD COLUMN descuento_item NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
        """))
        connection.commit()
        print("    [OK] Columna descuento_item agregada")

        # Agregar subtotal_final
        print("[+] Agregando columna subtotal_final...")
        connection.execute(text("""
            ALTER TABLE detalles_venta
            ADD COLUMN subtotal_final NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
        """))
        connection.commit()
        print("    [OK] Columna subtotal_final agregada")

        # Actualizar subtotal_final para registros existentes (subtotal - descuento)
        print("\n[*] Actualizando subtotal_final para registros existentes...")
        connection.execute(text("""
            UPDATE detalles_venta
            SET subtotal_final = subtotal - descuento_item;
        """))
        connection.commit()
        print("    [OK] Datos actualizados")

        # Verificar el esquema actualizado
        print("\n[*] Verificando esquema actualizado de detalles_venta...\n")
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

print("\n[OK] Migración completada!")
