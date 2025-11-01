"""
KATITA-POS - Ejemplos de Uso del Modelo Lote
=============================================
Ejemplos prácticos de cómo usar el modelo Lote con FIFO
"""

from app import create_app, db
from app.models.product import Product
from app.models.lote import Lote
from decimal import Decimal
from datetime import date, timedelta


def ejemplo_crear_lote():
    """Ejemplo: Crear un lote nuevo"""
    app = create_app('development')

    with app.app_context():
        # Primero necesitamos un producto
        producto = Product.buscar_por_codigo('7501234567890')

        if not producto:
            producto = Product(
                codigo_barras='7501234567890',
                nombre='Coca Cola 2L',
                categoria='Bebidas',
                precio_compra=Decimal('8.50'),
                precio_venta=Decimal('12.00')
            )
            db.session.add(producto)
            db.session.commit()

        # Crear un lote
        lote = Lote(
            producto_id=producto.id,
            codigo_lote='LT-2024-COCA-001',
            cantidad_inicial=100,
            cantidad_actual=100,
            fecha_vencimiento=date.today() + timedelta(days=180),
            precio_compra_lote=Decimal('8.50'),
            proveedor='Proveedor ABC',
            ubicacion='Pasillo A, Estante 3',
            notas='Lote promocional'
        )

        lote.validar()
        db.session.add(lote)
        db.session.commit()

        print(f'✅ Lote creado: {lote}')
        print(f'   Vence en: {lote.dias_hasta_vencimiento} días')
        print(f'   Stock: {lote.cantidad_actual}/{lote.cantidad_inicial}')


def ejemplo_fifo_automatico():
    """Ejemplo: Sistema FIFO automático"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if not producto:
            print('❌ Primero ejecuta ejemplo_crear_lote()')
            return

        # Crear varios lotes con diferentes fechas de vencimiento
        lotes_nuevos = [
            {
                'codigo_lote': 'LT-2024-001',
                'cantidad': 50,
                'dias_vencimiento': 90,
                'precio': Decimal('8.50')
            },
            {
                'codigo_lote': 'LT-2024-002',
                'cantidad': 30,
                'dias_vencimiento': 30,  # Vence antes
                'precio': Decimal('8.50')
            },
            {
                'codigo_lote': 'LT-2024-003',
                'cantidad': 40,
                'dias_vencimiento': 180,  # Vence después
                'precio': Decimal('8.50')
            },
        ]

        for data in lotes_nuevos:
            if not Lote.buscar_por_codigo(data['codigo_lote']):
                lote = Lote(
                    producto_id=producto.id,
                    codigo_lote=data['codigo_lote'],
                    cantidad_inicial=data['cantidad'],
                    cantidad_actual=data['cantidad'],
                    fecha_vencimiento=date.today() + timedelta(days=data['dias_vencimiento']),
                    precio_compra_lote=data['precio']
                )
                db.session.add(lote)

        db.session.commit()

        # Obtener lotes ordenados por FIFO
        print('\n📦 Lotes ordenados por FIFO (primero en vencer, primero en salir):')
        print('-' * 80)

        lotes_fifo = Lote.lotes_fifo(producto.id).all()

        for i, lote in enumerate(lotes_fifo, 1):
            print(f'{i}. {lote.codigo_lote:20} | '
                  f'Stock: {lote.cantidad_actual:3} | '
                  f'Vence en: {lote.dias_hasta_vencimiento:3} días | '
                  f'Fecha: {lote.fecha_vencimiento}')

        print('\n✅ Al vender, se debe usar SIEMPRE el primer lote de esta lista')


def ejemplo_vender_con_fifo():
    """Ejemplo: Venta usando FIFO"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if not producto:
            print('❌ Primero ejecuta ejemplo_fifo_automatico()')
            return

        cantidad_a_vender = 15

        print(f'\n🛒 Vendiendo {cantidad_a_vender} unidades con FIFO')
        print('=' * 80)

        # Obtener lotes FIFO
        lotes_fifo = Lote.lotes_fifo(producto.id).all()

        cantidad_restante = cantidad_a_vender

        for lote in lotes_fifo:
            if cantidad_restante <= 0:
                break

            if lote.cantidad_actual >= cantidad_restante:
                # Este lote tiene suficiente stock
                print(f'\n📦 Lote: {lote.codigo_lote}')
                print(f'   Stock antes: {lote.cantidad_actual}')
                lote.descontar_stock(cantidad_restante)
                print(f'   Descontado: {cantidad_restante}')
                print(f'   Stock después: {lote.cantidad_actual}')
                cantidad_restante = 0
            else:
                # Agotar este lote y continuar con el siguiente
                cantidad_descontada = lote.cantidad_actual
                print(f'\n📦 Lote: {lote.codigo_lote}')
                print(f'   Stock antes: {lote.cantidad_actual}')
                lote.descontar_stock(cantidad_descontada)
                print(f'   Descontado: {cantidad_descontada} (AGOTADO)')
                print(f'   Stock después: {lote.cantidad_actual}')
                cantidad_restante -= cantidad_descontada

        db.session.commit()

        if cantidad_restante > 0:
            print(f'\n⚠️  Stock insuficiente. Faltan {cantidad_restante} unidades')
        else:
            print(f'\n✅ Venta completada usando FIFO')


def ejemplo_lotes_proximos_a_vencer():
    """Ejemplo: Detectar lotes próximos a vencer"""
    app = create_app('development')

    with app.app_context():
        print('⚠️  Lotes próximos a vencer (30 días):')
        print('=' * 80)

        lotes_proximos = Lote.proximos_a_vencer(dias=30)

        if not lotes_proximos:
            print('✅ No hay lotes próximos a vencer')
            return

        for lote in lotes_proximos:
            producto = lote.producto
            print(f'\n📦 Lote: {lote.codigo_lote}')
            print(f'   Producto: {producto.nombre}')
            print(f'   Stock: {lote.cantidad_actual} unidades')
            print(f'   Vence en: {lote.dias_hasta_vencimiento} días')
            print(f'   Fecha vencimiento: {lote.fecha_vencimiento}')

            if lote.dias_hasta_vencimiento <= 7:
                print('   🚨 URGENTE: Vence en menos de 7 días')
            elif lote.dias_hasta_vencimiento <= 15:
                print('   ⚠️  ATENCIÓN: Vence en menos de 15 días')


def ejemplo_lotes_vencidos():
    """Ejemplo: Detectar lotes vencidos"""
    app = create_app('development')

    with app.app_context():
        print('❌ Lotes vencidos con stock:')
        print('=' * 80)

        lotes_vencidos = Lote.lotes_vencidos(solo_con_stock=True)

        if not lotes_vencidos:
            print('✅ No hay lotes vencidos con stock')
            return

        for lote in lotes_vencidos:
            producto = lote.producto
            print(f'\n📦 Lote: {lote.codigo_lote}')
            print(f'   Producto: {producto.nombre}')
            print(f'   Stock: {lote.cantidad_actual} unidades')
            print(f'   Venció hace: {abs(lote.dias_hasta_vencimiento)} días')
            print(f'   Fecha vencimiento: {lote.fecha_vencimiento}')
            print(f'   ⚠️  ACCIÓN REQUERIDA: Retirar del inventario')


def ejemplo_estadisticas_lotes():
    """Ejemplo: Estadísticas de lotes por producto"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if not producto:
            print('❌ Producto no encontrado')
            return

        print(f'📊 Estadísticas de Lotes: {producto.nombre}')
        print('=' * 80)

        stats = Lote.estadisticas_por_producto(producto.id)

        print(f'\nTotal de lotes: {stats["total_lotes"]}')
        print(f'Lotes activos: {stats["lotes_activos"]}')
        print(f'Lotes inactivos: {stats["lotes_inactivos"]}')
        print(f'Stock total: {stats["stock_total"]} unidades')
        print(f'Lotes vencidos: {stats["lotes_vencidos"]}')
        print(f'Lotes por vencer (30 días): {stats["lotes_por_vencer"]}')

        # Detalle de lotes
        print(f'\n📦 Detalle de lotes:')
        print('-' * 80)

        lotes = Lote.buscar_por_producto(producto.id, solo_activos=False).all()

        for lote in lotes:
            estado = '✅' if lote.activo else '❌'
            vencimiento = '🚨 VENCIDO' if lote.esta_vencido else f'⏰ {lote.dias_hasta_vencimiento} días'

            print(f'{estado} {lote.codigo_lote:20} | '
                  f'Stock: {lote.cantidad_actual:3}/{lote.cantidad_inicial:3} | '
                  f'{vencimiento}')


def ejemplo_buscar_por_proveedor():
    """Ejemplo: Buscar lotes por proveedor"""
    app = create_app('development')

    with app.app_context():
        proveedor_nombre = 'ABC'

        print(f'🔍 Lotes del proveedor "{proveedor_nombre}":')
        print('=' * 80)

        lotes = Lote.buscar_por_proveedor(proveedor_nombre).all()

        if not lotes:
            print(f'No se encontraron lotes del proveedor {proveedor_nombre}')
            return

        for lote in lotes:
            producto = lote.producto
            print(f'\n📦 Lote: {lote.codigo_lote}')
            print(f'   Producto: {producto.nombre}')
            print(f'   Proveedor: {lote.proveedor}')
            print(f'   Stock: {lote.cantidad_actual} unidades')
            print(f'   Precio compra: S/ {lote.precio_compra_lote}')


def ejemplo_ajuste_inventario():
    """Ejemplo: Ajuste de inventario (devolución)"""
    app = create_app('development')

    with app.app_context():
        codigo_lote = 'LT-2024-001'

        lote = Lote.buscar_por_codigo(codigo_lote)

        if not lote:
            print(f'❌ Lote {codigo_lote} no encontrado')
            return

        print(f'📋 Ajuste de Inventario: {codigo_lote}')
        print('=' * 80)

        print(f'\nEstado antes del ajuste:')
        print(f'  Stock: {lote.cantidad_actual}/{lote.cantidad_inicial}')
        print(f'  Activo: {lote.activo}')

        # Simular devolución de 5 unidades
        cantidad_devuelta = 5

        try:
            lote.aumentar_stock(cantidad_devuelta)
            db.session.commit()

            print(f'\n✅ Devolución registrada: +{cantidad_devuelta} unidades')
            print(f'\nEstado después del ajuste:')
            print(f'  Stock: {lote.cantidad_actual}/{lote.cantidad_inicial}')
            print(f'  Activo: {lote.activo}')

        except ValueError as e:
            print(f'\n❌ Error: {e}')


def ejemplo_trazabilidad_completa():
    """Ejemplo: Trazabilidad completa de un producto"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if not producto:
            print('❌ Producto no encontrado')
            return

        print(f'📋 Trazabilidad Completa: {producto.nombre}')
        print('=' * 80)

        lotes = Lote.buscar_por_producto(producto.id, solo_activos=False).all()

        if not lotes:
            print('No hay lotes registrados')
            return

        print(f'\nTotal de lotes históricos: {len(lotes)}')

        for lote in lotes:
            print(f'\n{"=" * 80}')
            print(f'📦 Lote: {lote.codigo_lote}')
            print(f'   Producto: {producto.nombre}')
            print(f'   Estado: {"✅ Activo" if lote.activo else "❌ Inactivo"}')
            print(f'\n   📊 Cantidades:')
            print(f'      Inicial: {lote.cantidad_inicial}')
            print(f'      Actual: {lote.cantidad_actual}')
            print(f'      Vendido: {lote.cantidad_vendida} ({lote.porcentaje_vendido:.1f}%)')
            print(f'\n   📅 Fechas:')
            print(f'      Ingreso: {lote.fecha_ingreso.strftime("%Y-%m-%d")}')
            print(f'      Vencimiento: {lote.fecha_vencimiento}')
            print(f'      Días en inventario: {lote.dias_en_inventario()}')

            if lote.esta_vencido:
                print(f'      ❌ Venció hace {abs(lote.dias_hasta_vencimiento)} días')
            else:
                print(f'      ⏰ Vence en {lote.dias_hasta_vencimiento} días')

            print(f'\n   💰 Precio:')
            print(f'      Compra lote: S/ {lote.precio_compra_lote}')

            if lote.proveedor:
                print(f'\n   📦 Logística:')
                print(f'      Proveedor: {lote.proveedor}')

            if lote.ubicacion:
                print(f'      Ubicación: {lote.ubicacion}')

            if lote.notas:
                print(f'\n   📝 Notas: {lote.notas}')


if __name__ == '__main__':
    print('KATITA-POS - Ejemplos de Uso del Modelo Lote')
    print('=' * 80)

    # Descomentar el ejemplo que quieras ejecutar:

    # ejemplo_crear_lote()
    # ejemplo_fifo_automatico()
    # ejemplo_vender_con_fifo()
    # ejemplo_lotes_proximos_a_vencer()
    # ejemplo_lotes_vencidos()
    # ejemplo_estadisticas_lotes()
    # ejemplo_buscar_por_proveedor()
    # ejemplo_ajuste_inventario()
    # ejemplo_trazabilidad_completa()

    print('\n✅ Ejemplos disponibles. Descomenta el que quieras ejecutar.')
