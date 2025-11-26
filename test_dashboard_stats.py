"""
Script para verificar las estadísticas del dashboard
"""
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("="*80)
print("VERIFICACION DE ESTADISTICAS DEL DASHBOARD")
print("="*80)

engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        # Fecha de hoy
        hoy = datetime.now().date()
        print(f"\nFecha de hoy: {hoy}")

        # 1. Total de ventas de HOY
        print("\n[1] VENTAS DE HOY:")
        print("-"*80)
        result = connection.execute(text("""
            SELECT COUNT(*), COALESCE(SUM(total), 0)
            FROM ventas
            WHERE DATE(created_at) = CURRENT_DATE;
        """))
        row = result.fetchone()
        print(f"  Cantidad: {row[0]}")
        print(f"  Total vendido: S/ {row[1]}")

        # 2. Productos con stock
        print("\n[2] PRODUCTOS CON STOCK:")
        print("-"*80)
        result = connection.execute(text("""
            SELECT COUNT(*)
            FROM products
            WHERE stock_total > 0 AND activo = true;
        """))
        count = result.fetchone()[0]
        print(f"  Productos con inventario: {count}")

        # 3. Lotes próximos a vencer (7 días)
        print("\n[3] LOTES PROXIMOS A VENCER (7 DIAS):")
        print("-"*80)
        result = connection.execute(text("""
            SELECT COUNT(*)
            FROM lotes
            WHERE fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
            AND fecha_vencimiento >= CURRENT_DATE
            AND cantidad_actual > 0;
        """))
        count = result.fetchone()[0]
        print(f"  Lotes por vencer: {count}")

        # 4. Ventas de los últimos 7 días
        print("\n[4] VENTAS ULTIMOS 7 DIAS:")
        print("-"*80)
        result = connection.execute(text("""
            SELECT
                DATE(created_at) as fecha,
                COUNT(*) as cantidad,
                SUM(total) as total
            FROM ventas
            WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY fecha DESC;
        """))

        ventas_7d = result.fetchall()
        if ventas_7d:
            for v in ventas_7d:
                print(f"  {v[0]}: {v[1]} ventas - S/ {v[2]}")
        else:
            print("  No hay ventas en los ultimos 7 dias")

        # 5. Ganancia total (si existe precio_compra)
        print("\n[5] GANANCIA:")
        print("-"*80)
        result = connection.execute(text("""
            SELECT
                SUM((precio_unitario - precio_compra) * cantidad) as ganancia_total
            FROM detalles_venta;
        """))
        ganancia = result.fetchone()[0]
        if ganancia:
            print(f"  Ganancia total: S/ {ganancia}")
        else:
            print("  Sin datos de ganancia")

        # 6. Verificar todas las ventas
        print("\n[6] TODAS LAS VENTAS:")
        print("-"*80)
        result = connection.execute(text("""
            SELECT id, numero_venta, total, DATE(created_at) as fecha, vendedor_id
            FROM ventas
            ORDER BY created_at DESC;
        """))

        ventas = result.fetchall()
        for v in ventas:
            print(f"  Venta #{v[0]}: {v[1]} - S/ {v[2]} - Fecha: {v[3]} - Vendedor: {v[4]}")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n" + "="*80)
print("VERIFICACION COMPLETADA")
print("="*80)
