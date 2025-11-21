"""
Script para inactivar automáticamente lotes y productos vencidos
Ejecutar con: python fix_expired_products.py
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app import create_app, db
from app.models.product import Product
from app.models.lote import Lote
from datetime import date

def inactivar_vencidos():
    """Inactiva lotes y productos vencidos"""

    app = create_app()

    with app.app_context():
        hoy = date.today()
        print(f"\n{'='*60}")
        print(f"SCRIPT DE AUTO-INACTIVACIÓN DE PRODUCTOS VENCIDOS")
        print(f"Fecha actual del sistema: {hoy}")
        print(f"{'='*60}\n")

        # ========== PASO 1: INACTIVAR LOTES VENCIDOS ==========
        print("PASO 1: Buscando lotes vencidos...")
        lotes_vencidos = Lote.query.filter(
            Lote.fecha_vencimiento <= hoy,
            Lote.activo == True,
            Lote.cantidad_actual > 0
        ).all()

        print(f"Encontrados {len(lotes_vencidos)} lotes vencidos\n")

        productos_afectados = set()
        for lote in lotes_vencidos:
            print(f"  ❌ Inactivando lote ID {lote.id}:")
            print(f"     Producto: {lote.producto.nombre}")
            print(f"     Fecha vencimiento: {lote.fecha_vencimiento}")
            print(f"     Cantidad: {lote.cantidad_actual}")

            lote.activo = False
            productos_afectados.add(lote.producto_id)

        if lotes_vencidos:
            db.session.commit()
            print(f"\n✅ {len(lotes_vencidos)} lotes inactivados correctamente")
        else:
            print("  ℹ️  No hay lotes vencidos para inactivar")

        # ========== PASO 2: INACTIVAR PRODUCTOS SIN LOTES VÁLIDOS ==========
        print(f"\n{'='*60}")
        print("PASO 2: Verificando productos sin lotes válidos...")
        print(f"Productos afectados: {len(productos_afectados)}\n")

        productos_inactivados = 0

        if productos_afectados:
            for producto_id in productos_afectados:
                producto = Product.query.get(producto_id)

                if producto and producto.activo:
                    # Contar lotes válidos (no vencidos y con stock)
                    lotes_validos = Lote.query.filter(
                        Lote.producto_id == producto_id,
                        Lote.cantidad_actual > 0,
                        Lote.fecha_vencimiento > hoy,  # Estrictamente futuro
                        Lote.activo == True
                    ).count()

                    print(f"  📦 Producto: {producto.nombre}")
                    print(f"     ID: {producto.id}")
                    print(f"     Stock total: {producto.stock_total}")
                    print(f"     Lotes válidos: {lotes_validos}")

                    if lotes_validos == 0:
                        producto.activo = False
                        productos_inactivados += 1
                        print(f"     ❌ INACTIVADO (sin lotes válidos)")
                    else:
                        print(f"     ✅ Mantiene activo (tiene {lotes_validos} lotes válidos)")

                    print()

            db.session.commit()
            print(f"✅ {productos_inactivados} productos inactivados por falta de lotes válidos")
        else:
            print("  ℹ️  No hay productos para verificar")

        # ========== PASO 3: VERIFICACIÓN FINAL ==========
        print(f"\n{'='*60}")
        print("PASO 3: Estado final del sistema")
        print(f"{'='*60}\n")

        # Contar productos activos
        productos_activos = Product.query.filter_by(activo=True).count()
        productos_inactivos = Product.query.filter_by(activo=False).count()

        # Contar lotes activos
        lotes_activos = Lote.query.filter_by(activo=True).filter(Lote.cantidad_actual > 0).count()
        lotes_inactivos = Lote.query.filter_by(activo=False).count()
        lotes_agotados = Lote.query.filter(Lote.cantidad_actual == 0).count()

        print(f"PRODUCTOS:")
        print(f"  ✅ Activos: {productos_activos}")
        print(f"  ❌ Inactivos: {productos_inactivos}")

        print(f"\nLOTES:")
        print(f"  ✅ Activos con stock: {lotes_activos}")
        print(f"  ❌ Inactivos: {lotes_inactivos}")
        print(f"  📭 Agotados: {lotes_agotados}")

        # Listar productos activos
        print(f"\n{'='*60}")
        print("PRODUCTOS ACTIVOS EN SISTEMA:")
        print(f"{'='*60}\n")

        productos = Product.query.filter_by(activo=True).all()
        for p in productos:
            lotes_del_producto = Lote.query.filter(
                Lote.producto_id == p.id,
                Lote.cantidad_actual > 0,
                Lote.activo == True
            ).all()

            print(f"  {p.id}. {p.nombre}")
            print(f"     Stock total: {p.stock_total}")
            print(f"     Lotes activos: {len(lotes_del_producto)}")

            for lote in lotes_del_producto:
                dias = (lote.fecha_vencimiento - hoy).days
                print(f"       - Lote {lote.id}: {lote.cantidad_actual} unidades, vence en {dias} días ({lote.fecha_vencimiento})")
            print()

        print(f"\n{'='*60}")
        print("✅ SCRIPT COMPLETADO EXITOSAMENTE")
        print(f"{'='*60}\n")

if __name__ == '__main__':
    inactivar_vencidos()
