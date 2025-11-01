"""
KATITA-POS - Product Model Tests
================================
Tests unitarios para el modelo Product
"""

import pytest
from decimal import Decimal
from app.models.product import Product
from app import db


class TestProductModel:
    """Tests para el modelo Product"""

    def test_crear_producto_basico(self, app):
        """Test: Crear un producto con datos básicos"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567890',
                nombre='Coca Cola 2L',
                categoria='Bebidas',
                precio_compra=Decimal('8.50'),
                precio_venta=Decimal('12.00')
            )

            db.session.add(product)
            db.session.commit()

            assert product.id is not None
            assert product.codigo_barras == '7501234567890'
            assert product.nombre == 'Coca Cola 2L'
            assert product.categoria == 'Bebidas'
            assert product.stock_total == 0
            assert product.stock_minimo == 5
            assert product.activo is True

    def test_producto_valores_por_defecto(self, app):
        """Test: Verificar valores por defecto del producto"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567891',
                nombre='Sprite 2L',
                categoria='Bebidas',
                precio_compra=Decimal('8.00'),
                precio_venta=Decimal('11.50')
            )

            assert product.stock_total == 0
            assert product.stock_minimo == 5
            assert product.activo is True
            assert product.imagen_url is None
            assert product.descripcion is None

    def test_codigo_barras_unico(self, app):
        """Test: El código de barras debe ser único"""
        with app.app_context():
            product1 = Product(
                codigo_barras='7501234567892',
                nombre='Producto 1',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )
            db.session.add(product1)
            db.session.commit()

            # Intentar crear producto con mismo código
            product2 = Product(
                codigo_barras='7501234567892',  # Mismo código
                nombre='Producto 2',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )
            db.session.add(product2)

            with pytest.raises(Exception):  # IntegrityError
                db.session.commit()

    def test_validar_codigo_barras_numerico(self):
        """Test: Validación de código de barras numérico"""
        # Código válido
        assert Product.validar_codigo_barras('7501234567893') is True

        # Código con letras
        with pytest.raises(ValueError, match='debe ser numérico'):
            Product.validar_codigo_barras('750ABC4567893')

    def test_validar_codigo_barras_longitud(self):
        """Test: Validación de longitud del código de barras"""
        # Código muy corto
        with pytest.raises(ValueError, match='debe tener exactamente 13 dígitos'):
            Product.validar_codigo_barras('123456')

        # Código muy largo
        with pytest.raises(ValueError, match='debe tener exactamente 13 dígitos'):
            Product.validar_codigo_barras('12345678901234')

        # Código correcto
        assert Product.validar_codigo_barras('1234567890123') is True

    def test_validar_codigo_barras_vacio(self):
        """Test: Validación de código de barras vacío"""
        with pytest.raises(ValueError, match='es requerido'):
            Product.validar_codigo_barras('')

        with pytest.raises(ValueError, match='es requerido'):
            Product.validar_codigo_barras(None)

    def test_validar_precios(self):
        """Test: Validación de precios"""
        # Precios válidos
        assert Product.validar_precios(Decimal('10.00'), Decimal('15.00')) is True

        # Precio de compra negativo
        with pytest.raises(ValueError, match='precio de compra debe ser mayor a 0'):
            Product.validar_precios(Decimal('-5.00'), Decimal('15.00'))

        # Precio de venta menor o igual a compra
        with pytest.raises(ValueError, match='precio de venta debe ser mayor al precio de compra'):
            Product.validar_precios(Decimal('15.00'), Decimal('15.00'))

        with pytest.raises(ValueError, match='precio de venta debe ser mayor al precio de compra'):
            Product.validar_precios(Decimal('15.00'), Decimal('10.00'))

    def test_validar_stock_minimo(self):
        """Test: Validación de stock mínimo"""
        # Stock mínimo válido
        assert Product.validar_stock_minimo(5) is True
        assert Product.validar_stock_minimo(0) is True

        # Stock mínimo negativo
        with pytest.raises(ValueError, match='no puede ser negativo'):
            Product.validar_stock_minimo(-1)

    def test_stock_disponible_property(self, app):
        """Test: Property stock_disponible"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567894',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=50
            )

            assert product.stock_disponible == 50

    def test_necesita_reabastecimiento_property(self, app):
        """Test: Property necesita_reabastecimiento"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567895',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=3,  # Menor al mínimo (5)
                stock_minimo=5
            )

            assert product.necesita_reabastecimiento is True

            # Aumentar stock por encima del mínimo
            product.stock_total = 10
            assert product.necesita_reabastecimiento is False

    def test_margen_ganancia_property(self, app):
        """Test: Property margen_ganancia"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567896',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )

            assert product.margen_ganancia == Decimal('5.00')

    def test_porcentaje_ganancia_property(self, app):
        """Test: Property porcentaje_ganancia"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567897',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )

            # Ganancia del 50%
            assert product.porcentaje_ganancia == 50.0

    def test_actualizar_stock_suma(self, app):
        """Test: Actualizar stock (suma)"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567898',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=10
            )

            product.actualizar_stock(5, 'suma')
            assert product.stock_total == 15

    def test_actualizar_stock_resta(self, app):
        """Test: Actualizar stock (resta)"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567899',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=10
            )

            product.actualizar_stock(3, 'resta')
            assert product.stock_total == 7

    def test_actualizar_stock_insuficiente(self, app):
        """Test: No permitir stock negativo"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567800',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=5
            )

            with pytest.raises(ValueError, match='Stock insuficiente'):
                product.actualizar_stock(10, 'resta')

    def test_activar_desactivar_producto(self, app):
        """Test: Activar y desactivar producto"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567801',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )

            assert product.activo is True

            product.desactivar()
            assert product.activo is False

            product.activar()
            assert product.activo is True

    def test_to_dict(self, app):
        """Test: Convertir producto a diccionario"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567802',
                nombre='Coca Cola 2L',
                descripcion='Bebida gaseosa',
                categoria='Bebidas',
                precio_compra=Decimal('8.50'),
                precio_venta=Decimal('12.00'),
                stock_total=20,
                stock_minimo=5,
                imagen_url='https://example.com/coca.jpg'
            )

            data = product.to_dict()

            assert data['codigo_barras'] == '7501234567802'
            assert data['nombre'] == 'Coca Cola 2L'
            assert data['categoria'] == 'Bebidas'
            assert data['precio_compra'] == 8.50
            assert data['precio_venta'] == 12.00
            assert data['stock_total'] == 20
            assert data['margen_ganancia'] == 3.50
            assert data['porcentaje_ganancia'] == 41.18
            assert data['necesita_reabastecimiento'] is False

    def test_buscar_por_codigo(self, app):
        """Test: Buscar producto por código de barras"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567803',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )
            db.session.add(product)
            db.session.commit()

            found = Product.buscar_por_codigo('7501234567803')
            assert found is not None
            assert found.nombre == 'Test Product'

            not_found = Product.buscar_por_codigo('0000000000000')
            assert not_found is None

    def test_buscar_activos(self, app):
        """Test: Buscar solo productos activos"""
        with app.app_context():
            product1 = Product(
                codigo_barras='7501234567804',
                nombre='Producto Activo',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                activo=True
            )
            product2 = Product(
                codigo_barras='7501234567805',
                nombre='Producto Inactivo',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                activo=False
            )
            db.session.add_all([product1, product2])
            db.session.commit()

            activos = Product.buscar_activos().all()
            assert len(activos) >= 1
            assert all(p.activo for p in activos)

    def test_buscar_por_categoria(self, app):
        """Test: Buscar productos por categoría"""
        with app.app_context():
            product1 = Product(
                codigo_barras='7501234567806',
                nombre='Coca Cola',
                categoria='Bebidas',
                precio_compra=Decimal('8.00'),
                precio_venta=Decimal('12.00')
            )
            product2 = Product(
                codigo_barras='7501234567807',
                nombre='Pan',
                categoria='Panadería',
                precio_compra=Decimal('2.00'),
                precio_venta=Decimal('3.50')
            )
            db.session.add_all([product1, product2])
            db.session.commit()

            bebidas = Product.buscar_por_categoria('Bebidas').all()
            assert len(bebidas) >= 1
            assert all(p.categoria == 'Bebidas' for p in bebidas)

    def test_productos_bajo_stock(self, app):
        """Test: Buscar productos con stock bajo"""
        with app.app_context():
            product1 = Product(
                codigo_barras='7501234567808',
                nombre='Producto Bajo Stock',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=2,  # Menor al mínimo
                stock_minimo=5
            )
            product2 = Product(
                codigo_barras='7501234567809',
                nombre='Producto Stock OK',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=20,
                stock_minimo=5
            )
            db.session.add_all([product1, product2])
            db.session.commit()

            bajo_stock = Product.productos_bajo_stock()
            codigos_bajo_stock = [p.codigo_barras for p in bajo_stock]

            assert '7501234567808' in codigos_bajo_stock
            assert '7501234567809' not in codigos_bajo_stock

    def test_buscar_por_nombre(self, app):
        """Test: Buscar productos por nombre (búsqueda parcial)"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567810',
                nombre='Coca Cola 2L',
                categoria='Bebidas',
                precio_compra=Decimal('8.00'),
                precio_venta=Decimal('12.00')
            )
            db.session.add(product)
            db.session.commit()

            # Búsqueda parcial
            resultados = Product.buscar_por_nombre('Coca').all()
            assert len(resultados) >= 1
            assert any('Coca' in p.nombre for p in resultados)

            # Búsqueda case-insensitive
            resultados = Product.buscar_por_nombre('coca').all()
            assert len(resultados) >= 1

    def test_repr(self, app):
        """Test: Representación del producto"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567811',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00'),
                stock_total=25
            )

            repr_str = repr(product)
            assert '7501234567811' in repr_str
            assert 'Test Product' in repr_str
            assert '25' in repr_str

    def test_str(self, app):
        """Test: String del producto"""
        with app.app_context():
            product = Product(
                codigo_barras='7501234567812',
                nombre='Test Product',
                categoria='Test',
                precio_compra=Decimal('10.00'),
                precio_venta=Decimal('15.00')
            )

            str_repr = str(product)
            assert 'Test Product' in str_repr
            assert '7501234567812' in str_repr
