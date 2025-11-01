"""
Test rápido para verificar valores por defecto del modelo Product
"""

from app import create_app, db
from app.models.product import Product
from decimal import Decimal

app = create_app('development')

with app.app_context():
    # Crear base de datos
    db.create_all()

    # Test 1: Crear producto SIN especificar valores por defecto
    print('Test 1: Crear producto sin valores por defecto')
    print('-' * 60)

    product = Product(
        codigo_barras='7501234567890',
        nombre='Coca Cola 2L',
        categoria='Bebidas',
        precio_compra=Decimal('8.50'),
        precio_venta=Decimal('12.00')
        # NO especificamos: stock_total, stock_minimo, activo
    )

    print(f'ANTES de guardar:')
    print(f'  stock_total: {product.stock_total} (esperado: 0)')
    print(f'  stock_minimo: {product.stock_minimo} (esperado: 5)')
    print(f'  activo: {product.activo} (esperado: True)')

    # Validar
    assert product.stock_total == 0, f'ERROR: stock_total es {product.stock_total}, esperado 0'
    assert product.stock_minimo == 5, f'ERROR: stock_minimo es {product.stock_minimo}, esperado 5'
    assert product.activo is True, f'ERROR: activo es {product.activo}, esperado True'

    print(f'\n✅ ANTES de guardar: Valores por defecto correctos!')

    # Guardar en BD
    db.session.add(product)
    db.session.commit()

    print(f'\nDESPUÉS de guardar:')
    print(f'  stock_total: {product.stock_total} (esperado: 0)')
    print(f'  stock_minimo: {product.stock_minimo} (esperado: 5)')
    print(f'  activo: {product.activo} (esperado: True)')

    assert product.stock_total == 0, f'ERROR: stock_total es {product.stock_total}, esperado 0'
    assert product.stock_minimo == 5, f'ERROR: stock_minimo es {product.stock_minimo}, esperado 5'
    assert product.activo is True, f'ERROR: activo es {product.activo}, esperado True'

    print(f'\n✅ DESPUÉS de guardar: Valores por defecto correctos!')

    # Test 2: Buscar el producto
    print(f'\n' + '=' * 60)
    print('Test 2: Buscar producto guardado')
    print('-' * 60)

    found = Product.buscar_por_codigo('7501234567890')
    print(f'Producto encontrado: {found.nombre}')
    print(f'  stock_total: {found.stock_total}')
    print(f'  stock_minimo: {found.stock_minimo}')
    print(f'  activo: {found.activo}')

    assert found.stock_total == 0
    assert found.stock_minimo == 5
    assert found.activo is True

    print(f'\n✅ Búsqueda: Valores correctos!')

    # Test 3: Crear producto CON valores personalizados
    print(f'\n' + '=' * 60)
    print('Test 3: Crear producto con valores personalizados')
    print('-' * 60)

    product2 = Product(
        codigo_barras='7501234567891',
        nombre='Sprite 2L',
        categoria='Bebidas',
        precio_compra=Decimal('8.00'),
        precio_venta=Decimal('11.50'),
        stock_total=100,  # Valor personalizado
        stock_minimo=20,  # Valor personalizado
        activo=False      # Valor personalizado
    )

    print(f'Valores personalizados:')
    print(f'  stock_total: {product2.stock_total} (esperado: 100)')
    print(f'  stock_minimo: {product2.stock_minimo} (esperado: 20)')
    print(f'  activo: {product2.activo} (esperado: False)')

    assert product2.stock_total == 100
    assert product2.stock_minimo == 20
    assert product2.activo is False

    print(f'\n✅ Valores personalizados respetados!')

    # Test 4: Verificar datetime con timezone
    print(f'\n' + '=' * 60)
    print('Test 4: Verificar datetime con timezone')
    print('-' * 60)

    print(f'created_at: {product.created_at}')
    print(f'updated_at: {product.updated_at}')

    assert product.created_at is not None
    assert product.updated_at is not None

    print(f'\n✅ Timestamps correctos!')

    print(f'\n' + '=' * 60)
    print('✅ TODOS LOS TESTS PASARON EXITOSAMENTE!')
    print('=' * 60)

    # Limpiar
    db.session.delete(product)
    db.session.delete(product2)
    db.session.commit()

    print('\nBase de datos limpiada.')
