"""
Script para actualizar la fecha de las ventas a la zona horaria de Perú
"""
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("\n[*] Consultando ventas con fecha futura...")

        # Ver ventas con fecha futura (UTC adelantado)
        result = connection.execute(text("""
            SELECT id, numero_venta, total, created_at, fecha
            FROM ventas
            WHERE DATE(created_at) > CURRENT_DATE - INTERVAL '1 day'
            ORDER BY created_at DESC;
        """))

        ventas = result.fetchall()
        print(f"\n[*] Encontradas {len(ventas)} ventas recientes:")
        for v in ventas:
            print(f"  Venta #{v[0]}: {v[1]} - S/ {v[2]}")
            print(f"    created_at: {v[3]}")
            print(f"    fecha:      {v[4]}")

        # Actualizar: restar 5 horas para ajustar a Peru (UTC-5)
        print("\n[*] Ajustando fechas a zona horaria de Peru (UTC-5)...")

        connection.execute(text("""
            UPDATE ventas
            SET
                created_at = created_at - INTERVAL '5 hours',
                updated_at = updated_at - INTERVAL '5 hours',
                fecha = fecha - INTERVAL '5 hours'
            WHERE id IN (
                SELECT id FROM ventas
                WHERE DATE(created_at) > CURRENT_DATE - INTERVAL '1 day'
            );
        """))
        connection.commit()

        print("[OK] Fechas actualizadas")

        # Verificar
        print("\n[*] Verificando fechas actualizadas...")
        result = connection.execute(text("""
            SELECT id, numero_venta, total, created_at, fecha
            FROM ventas
            ORDER BY created_at DESC
            LIMIT 10;
        """))

        ventas = result.fetchall()
        for v in ventas:
            print(f"  Venta #{v[0]}: {v[1]} - created_at: {v[3]}, fecha: {v[4]}")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    exit(1)

print("\n[OK] Completado!")
