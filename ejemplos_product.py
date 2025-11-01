"""
KATITA-POS - Ejemplos de Uso del Modelo Product
===============================================
Ejemplos prácticos de cómo usar el modelo Product
"""

from app import create_app, db
from app.models.product import Product
from decimal import Decimal


def ejemplo_crear_producto():
    """Ejemplo: Crear un producto nuevo"""
    app = create_app('development')

    with app.app_context():
        # Crear un producto
        producto = Product(
            codigo_barras='7501234567890',
            nombre='Coca Cola 2L',
            descripcion='Bebida gaseosa sabor cola',
            categoria='Bebidas',
            precio_compra=Decimal('8.50'),
            precio_venta=Decimal('12.00'),
            stock_total=50,
            stock_minimo=10,
            imagen_url='https://example.com/coca-cola.jpg'
        )

        # Validar antes de guardar
        producto.validar()

        # Guardar en la base de datos
        db.session.add(producto)
        db.session.commit()

        print(f'Producto creado: {producto}')
        print(f'ID: {producto.id}')
        print(f'Margen de ganancia: S/ {producto.margen_ganancia}')
        print(f'Porcentaje de ganancia: {producto.porcentaje_ganancia}%')


def ejemplo_buscar_producto():
    """Ejemplo: Buscar productos"""
    app = create_app('development')

    with app.app_context():
        # Buscar por código de barras
        producto = Product.buscar_por_codigo('7501234567890')
        if producto:
            print(f'Producto encontrado: {producto.nombre}')
            print(f'Stock disponible: {producto.stock_disponible}')

        # Buscar por nombre
        productos = Product.buscar_por_nombre('Coca').all()
        print(f'\nProductos que contienen "Coca": {len(productos)}')
        for p in productos:
            print(f'  - {p.nombre}')

        # Buscar por categoría
        bebidas = Product.buscar_por_categoria('Bebidas').all()
        print(f'\nProductos en categoría Bebidas: {len(bebidas)}')


def ejemplo_actualizar_stock():
    """Ejemplo: Actualizar stock de un producto"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if producto:
            print(f'Stock inicial: {producto.stock_total}')

            # Agregar stock (compra)
            producto.actualizar_stock(20, 'suma')
            print(f'Stock después de compra (+20): {producto.stock_total}')

            # Restar stock (venta)
            producto.actualizar_stock(5, 'resta')
            print(f'Stock después de venta (-5): {producto.stock_total}')

            db.session.commit()


def ejemplo_productos_bajo_stock():
    """Ejemplo: Obtener productos que necesitan reabastecimiento"""
    app = create_app('development')

    with app.app_context():
        productos_bajo_stock = Product.productos_bajo_stock()

        print('Productos que necesitan reabastecimiento:')
        print('-' * 60)
        for p in productos_bajo_stock:
            print(f'{p.nombre:30} | Stock: {p.stock_total:3} | Mínimo: {p.stock_minimo}')


def ejemplo_convertir_a_json():
    """Ejemplo: Convertir producto a JSON"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if producto:
            # Convertir a diccionario (para enviar como JSON en API)
            data = producto.to_dict()

            print('Datos del producto (JSON):')
            print('-' * 60)
            for key, value in data.items():
                print(f'{key:25}: {value}')


def ejemplo_validaciones():
    """Ejemplo: Validaciones del modelo"""
    app = create_app('development')

    with app.app_context():
        try:
            # Intentar crear producto con código de barras inválido
            producto = Product(
                codigo_barras='ABC123',  # No numérico
                nombre='Producto Test',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )
            producto.validar()
        except ValueError as e:
            print(f'Error de validación: {e}')

        try:
            # Intentar crear producto con precio de venta menor a compra
            producto = Product(
                codigo_barras='1234567890123',
                nombre='Producto Test',
                categoria='Test',
                precio_compra=Decimal('20.00'),
                precio_venta=Decimal('15.00')  # Menor que compra
            )
            producto.validar()
        except ValueError as e:
            print(f'Error de validación: {e}')


def ejemplo_activar_desactivar():
    """Ejemplo: Activar/Desactivar productos"""
    app = create_app('development')

    with app.app_context():
        producto = Product.buscar_por_codigo('7501234567890')

        if producto:
            print(f'Estado inicial: {"Activo" if producto.activo else "Inactivo"}')

            # Desactivar producto
            producto.desactivar()
            db.session.commit()
            print(f'Estado después de desactivar: {"Activo" if producto.activo else "Inactivo"}')

            # Activar producto
            producto.activar()
            db.session.commit()
            print(f'Estado después de activar: {"Activo" if producto.activo else "Inactivo"}')


def ejemplo_crear_multiples_productos():
    """Ejemplo: Crear múltiples productos de ejemplo"""
    app = create_app('development')

    with app.app_context():
        productos_ejemplo = [
            {
                'codigo_barras': '7501234567891',
                'nombre': 'Sprite 2L',
                'categoria': 'Bebidas',
                'precio_compra': Decimal('8.00'),
                'precio_venta': Decimal('11.50'),
                'stock_total': 30,
                'stock_minimo': 10
            },
            {
                'codigo_barras': '7501234567892',
                'nombre': 'Inca Kola 2L',
                'categoria': 'Bebidas',
                'precio_compra': Decimal('8.50'),
                'precio_venta': Decimal('12.00'),
                'stock_total': 25,
                'stock_minimo': 10
            },
            {
                'codigo_barras': '7501234567893',
                'nombre': 'Pan Integral',
                'categoria': 'Panadería',
                'precio_compra': Decimal('2.50'),
                'precio_venta': Decimal('4.00'),
                'stock_total': 15,
                'stock_minimo': 20
            },
            {
                'codigo_barras': '7501234567894',
                'nombre': 'Leche Gloria 1L',
                'categoria': 'Lácteos',
                'precio_compra': Decimal('4.00'),
                'precio_venta': Decimal('6.50'),
                'stock_total': 40,
                'stock_minimo': 15
            },
        ]

        for data in productos_ejemplo:
            # Verificar si ya existe
            if not Product.buscar_por_codigo(data['codigo_barras']):
                producto = Product(**data)
                db.session.add(producto)
                print(f'Creado: {producto.nombre}')
            else:
                print(f'Ya existe: {data["nombre"]}')

        db.session.commit()
        print(f'\nTotal de productos en BD: {Product.query.count()}')


def ejemplo_estadisticas():
    """Ejemplo: Obtener estadísticas de productos"""
    app = create_app('development')

    with app.app_context():
        total_productos = Product.query.count()
        productos_activos = Product.buscar_activos().count()
        productos_bajo_stock = len(Product.productos_bajo_stock())

        print('Estadísticas de Inventario')
        print('=' * 60)
        print(f'Total de productos: {total_productos}')
        print(f'Productos activos: {productos_activos}')
        print(f'Productos bajo stock mínimo: {productos_bajo_stock}')

        # Productos por categoría
        from sqlalchemy import func
        categorias = db.session.query(
            Product.categoria,
            func.count(Product.id)
        ).group_by(Product.categoria).all()

        print('\nProductos por categoría:')
        for categoria, count in categorias:
            print(f'  {categoria:20}: {count}')


if __name__ == '__main__':
    print('KATITA-POS - Ejemplos de Uso del Modelo Product')
    print('=' * 60)

    # Descomentar el ejemplo que quieras ejecutar:

    # ejemplo_crear_producto()
    # ejemplo_buscar_producto()
    # ejemplo_actualizar_stock()
    # ejemplo_productos_bajo_stock()
    # ejemplo_convertir_a_json()
    # ejemplo_validaciones()
    # ejemplo_activar_desactivar()
    # ejemplo_crear_multiples_productos()
    # ejemplo_estadisticas()

    print('\n✅ Ejemplos disponibles. Descomenta el que quieras ejecutar.')
