"""
Script para diagnosticar COMPLETAMENTE la base de datos de Supabase
"""
from sqlalchemy import create_engine, text
from datetime import datetime

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("="*80)
print("DIAGNOSTICO COMPLETO DE BASE DE DATOS SUPABASE")
print("="*80)

engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        # 1. Verificar todas las tablas
        print("\n[1] TABLAS EN LA BASE DE DATOS:")
        print("-"*80)
        result = connection.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))

        tables = [row[0] for row in result.fetchall()]
        for table in tables:
            print(f"  [OK] {table}")

        # 2. Verificar esquema de cada tabla importante
        print("\n[2] ESQUEMA DE TABLAS IMPORTANTES:")
        print("-"*80)

        for table in ['ventas', 'detalles_venta', 'lotes', 'products', 'movimientos_stock']:
            if table in tables:
                print(f"\n  Tabla: {table}")
                result = connection.execute(text(f"""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    ORDER BY ordinal_position;
                """))

                for row in result.fetchall():
                    nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                    print(f"    - {row[0]:<25} {row[1]:<20} {nullable}")

        # 3. Contar registros en cada tabla
        print("\n[3] CONTEO DE REGISTROS:")
        print("-"*80)

        for table in tables:
            try:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                print(f"  {table:<30} {count:>5} registros")
            except Exception as e:
                print(f"  {table:<30} ERROR: {e}")

        # 4. Verificar ventas recientes
        print("\n[4] VENTAS RECIENTES (últimas 10):")
        print("-"*80)
        try:
            result = connection.execute(text("""
                SELECT id, numero_venta, total, metodo_pago, created_at, vendedor_id
                FROM ventas
                ORDER BY created_at DESC
                LIMIT 10;
            """))

            ventas = result.fetchall()
            if ventas:
                for venta in ventas:
                    print(f"  Venta #{venta[0]}: {venta[1]} - S/ {venta[2]} ({venta[3]}) - {venta[4]} - Vendedor: {venta[5]}")
            else:
                print("  [!] NO HAY VENTAS REGISTRADAS")
        except Exception as e:
            print(f"  ERROR al consultar ventas: {e}")

        # 5. Verificar detalles de venta
        print("\n[5] DETALLES DE VENTA (últimos 10):")
        print("-"*80)
        try:
            result = connection.execute(text("""
                SELECT id, venta_id, producto_id, cantidad, precio_unitario, subtotal
                FROM detalles_venta
                ORDER BY created_at DESC
                LIMIT 10;
            """))

            detalles = result.fetchall()
            if detalles:
                for det in detalles:
                    print(f"  Detalle #{det[0]}: Venta {det[1]} - Producto {det[2]} - Cant: {det[3]} - Precio: S/ {det[4]} - Subtotal: S/ {det[5]}")
            else:
                print("  [!] NO HAY DETALLES DE VENTA")
        except Exception as e:
            print(f"  ERROR al consultar detalles: {e}")

        # 6. Verificar productos
        print("\n[6] PRODUCTOS EN STOCK:")
        print("-"*80)
        try:
            result = connection.execute(text("""
                SELECT id, nombre, codigo_barra, precio_venta, stock_total, activo
                FROM products
                ORDER BY id;
            """))

            productos = result.fetchall()
            if productos:
                for prod in productos:
                    activo = "SI" if prod[5] else "NO"
                    print(f"  [Activo:{activo}] Producto #{prod[0]}: {prod[1]} ({prod[2]}) - S/ {prod[3]} - Stock: {prod[4]}")
            else:
                print("  [!] NO HAY PRODUCTOS")
        except Exception as e:
            print(f"  ERROR al consultar productos: {e}")

        # 7. Verificar lotes
        print("\n[7] LOTES ACTIVOS:")
        print("-"*80)
        try:
            result = connection.execute(text("""
                SELECT id, codigo_lote, producto_id, cantidad_actual, fecha_vencimiento, precio_compra_lote
                FROM lotes
                WHERE cantidad_actual > 0
                ORDER BY fecha_vencimiento;
            """))

            lotes = result.fetchall()
            if lotes:
                for lote in lotes:
                    print(f"  Lote {lote[1]}: Producto {lote[2]} - Stock: {lote[3]} - Vence: {lote[4]} - Costo: S/ {lote[5]}")
            else:
                print("  [!] NO HAY LOTES CON STOCK")
        except Exception as e:
            print(f"  ERROR al consultar lotes: {e}")

        # 8. Verificar suma total de ventas
        print("\n[8] RESUMEN DE VENTAS:")
        print("-"*80)
        try:
            result = connection.execute(text("""
                SELECT
                    COUNT(*) as total_ventas,
                    COALESCE(SUM(total), 0) as monto_total,
                    COALESCE(AVG(total), 0) as promedio
                FROM ventas;
            """))

            resumen = result.fetchone()
            print(f"  Total ventas: {resumen[0]}")
            print(f"  Monto total: S/ {resumen[1]}")
            print(f"  Promedio: S/ {resumen[2]}")
        except Exception as e:
            print(f"  ERROR: {e}")

except Exception as e:
    print(f"\n[ERROR FATAL] {type(e).__name__}: {e}")
    exit(1)

print("\n" + "="*80)
print("DIAGNOSTICO COMPLETADO")
print("="*80)
