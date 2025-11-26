"""
Script para ajustar la venta a zona horaria de Perú (UTC-5)
"""
from sqlalchemy import create_engine, text

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("[*] Ajustando venta #6 a zona horaria de Peru (UTC-5)...")
        print("    Restar 5 horas para convertir de UTC a Peru")

        # Restar 5 horas para que sea hora de Peru
        connection.execute(text("""
            UPDATE ventas
            SET
                created_at = created_at - INTERVAL '5 hours',
                updated_at = updated_at - INTERVAL '5 hours',
                fecha = fecha - INTERVAL '5 hours'
            WHERE id = 6;
        """))
        connection.commit()

        print("[OK] Venta ajustada")

        # Verificar
        print("\n[*] Verificando venta ajustada:")
        result = connection.execute(text("""
            SELECT id, numero_venta, created_at, fecha
            FROM ventas
            WHERE id = 6;
        """))

        v = result.fetchone()
        print(f"\nVenta #{v[0]}: {v[1]}")
        print(f"  created_at: {v[2]}")
        print(f"  fecha: {v[3]}")

        # Mostrar que fechas deberia ver el frontend
        print("\n[*] Fecha extraida (lo que el frontend ve):")
        print(f"  Año: {v[2].year}")
        print(f"  Mes: {v[2].month}")
        print(f"  Dia: {v[2].day}")
        print(f"  Formato YYYY-MM-DD: {v[2].strftime('%Y-%m-%d')}")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
