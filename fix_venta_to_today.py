"""
Script para actualizar la venta a HOY según Supabase
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("[*] Actualizando venta a HOY (segun Supabase UTC)...")

        # Actualizar: sumar 5 horas para que sea "hoy" según Supabase
        connection.execute(text("""
            UPDATE ventas
            SET
                created_at = created_at + INTERVAL '5 hours',
                updated_at = updated_at + INTERVAL '5 hours',
                fecha = fecha + INTERVAL '5 hours'
            WHERE id = 6;
        """))
        connection.commit()

        print("[OK] Venta actualizada")

        # Verificar
        result = connection.execute(text("""
            SELECT id, numero_venta, created_at, DATE(created_at), CURRENT_DATE,
                   DATE(created_at) = CURRENT_DATE as es_hoy
            FROM ventas
            WHERE id = 6;
        """))

        v = result.fetchone()
        print(f"\nVenta #{v[0]}: {v[1]}")
        print(f"  created_at: {v[2]}")
        print(f"  DATE(created_at): {v[3]}")
        print(f"  CURRENT_DATE: {v[4]}")
        print(f"  Es HOY: {v[5]}")

except Exception as e:
    print(f"ERROR: {e}")
