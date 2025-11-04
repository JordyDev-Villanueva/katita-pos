"""
Tests para el modelo DetalleVenta de KATITA-POS

Tests completos para verificar:
- Creación de detalles
- Cálculo de subtotales y ganancias
- Validaciones
- Relaciones con Venta, Product y Lote
- Búsquedas y reportes
"""

import pytest
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from app import create_app, db
from app.models.detalle_venta import DetalleVenta
from app.models.venta import Venta
from app.models.product import Product
from app.models.lote import Lote
from app.models.user import User


@pytest.fixture(scope='function')
def app():
    """Crea una instancia de la aplicación para testing"""
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def vendedor(app):
    """Crea un usuario vendedor para los tests"""
    with app.app_context():
        user = User(
            username='vendedor_test',
            email='vendedor@test.com',
            nombre_completo='Vendedor Test',
            rol='vendedor'
        )
        user.set_password('password123')
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def producto(app):
    """Crea un producto para los tests"""
    with app.app_context():
        prod = Product(
            codigo_barras='7501234567890',
            nombre='Producto Test',
            categoria='Test',
            precio_compra=Decimal('10.00'),
            precio_venta=Decimal('15.00'),
            stock_total=100
        )
        db.session.add(prod)
        db.session.commit()
        return prod


@pytest.fixture
def venta(app, vendedor):
    """Crea una venta para los tests"""
    with app.app_context():
        user = db.session.merge(vendedor)

        v = Venta(
            subtotal=Decimal('100.00'),
            total=Decimal('100.00'),
            metodo_pago='efectivo',
            monto_recibido=Decimal('150.00'),
            cambio=Decimal('50.00'),
            vendedor_id=user.id
        )
        v.generar_numero_venta()
        db.session.add(v)
        db.session.commit()
        return v


class TestDetalleVentaModel:
    """Tests para el modelo DetalleVenta"""

    # === TESTS DE CREACIÓN ===

    def test_crear_detalle_basico(self, app, venta, producto):
        """Test: Crear un detalle de venta básico"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            db.session.add(detalle)
            db.session.commit()

            assert detalle.id is not None
            assert detalle.cantidad == 2
            assert detalle.precio_unitario == Decimal('15.00')

    def test_detalle_valores_por_defecto(self, app, venta, producto):
        """Test: Verificar valores por defecto del detalle"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00')
            )

            assert detalle.descuento_item == Decimal('0.00')
            assert detalle.subtotal == Decimal('30.00')  # Auto-calculado
            assert detalle.subtotal_final == Decimal('30.00')  # Auto-calculado

    # === TESTS DE VALIDACIONES ===

    def test_validar_cantidad_positiva(self, app, venta, producto):
        """Test: Cantidad debe ser positiva"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            with pytest.raises(ValueError, match='cantidad debe ser mayor a 0'):
                detalle = DetalleVenta(
                    venta_id=v.id,
                    producto_id=p.id,
                    cantidad=0,
                    precio_unitario=Decimal('15.00'),
                    precio_compra_unitario=Decimal('10.00')
                )

    def test_validar_precio_unitario_positivo(self, app, venta, producto):
        """Test: Precio unitario debe ser positivo"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            with pytest.raises(ValueError, match='precio unitario debe ser mayor a 0'):
                detalle = DetalleVenta(
                    venta_id=v.id,
                    producto_id=p.id,
                    cantidad=2,
                    precio_unitario=Decimal('0.00'),
                    precio_compra_unitario=Decimal('10.00')
                )

    def test_validar_precio_compra_no_negativo(self, app, venta, producto):
        """Test: Precio de compra no puede ser negativo"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            with pytest.raises(ValueError, match='precio de compra no puede ser negativo'):
                detalle = DetalleVenta(
                    venta_id=v.id,
                    producto_id=p.id,
                    cantidad=2,
                    precio_unitario=Decimal('15.00'),
                    precio_compra_unitario=Decimal('-5.00')
                )

    def test_validar_descuento_no_negativo(self, app, venta, producto):
        """Test: Descuento no puede ser negativo"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            with pytest.raises(ValueError, match='descuento del item no puede ser negativo'):
                detalle = DetalleVenta(
                    venta_id=v.id,
                    producto_id=p.id,
                    cantidad=2,
                    precio_unitario=Decimal('15.00'),
                    precio_compra_unitario=Decimal('10.00'),
                    subtotal=Decimal('30.00'),
                    descuento_item=Decimal('-5.00'),
                    subtotal_final=Decimal('35.00')
                )

    # === TESTS DE CÁLCULO DE SUBTOTALES ===

    def test_calcular_subtotales(self, app, venta, producto):
        """Test: Calcular subtotales correctamente"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=3,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('45.00'),
                descuento_item=Decimal('5.00'),
                subtotal_final=Decimal('40.00')
            )

            detalle.calcular_subtotales()

            assert detalle.subtotal == Decimal('45.00')  # 3 × 15
            assert detalle.subtotal_final == Decimal('40.00')  # 45 - 5

    # === TESTS DE PROPIEDADES CALCULADAS ===

    def test_ganancia_unitaria(self, app, venta, producto):
        """Test: Property ganancia_unitaria"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            assert detalle.ganancia_unitaria == Decimal('5.00')  # 15 - 10

    def test_ganancia_total(self, app, venta, producto):
        """Test: Property ganancia_total"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            assert detalle.ganancia_total == Decimal('10.00')  # 5 × 2

    def test_porcentaje_ganancia(self, app, venta, producto):
        """Test: Property porcentaje_ganancia"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            # (5 / 10) × 100 = 50%
            assert detalle.porcentaje_ganancia == 50.0

    def test_margen_bruto(self, app, venta, producto):
        """Test: Property margen_bruto"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            # (5 / 15) × 100 = 33.33%
            assert abs(detalle.margen_bruto - 33.33) < 0.01

    # === TESTS DE RELACIONES ===

    def test_relacion_con_venta(self, app, venta, producto):
        """Test: Relación con Venta"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            db.session.add(detalle)
            db.session.commit()

            assert detalle.venta is not None
            assert detalle.venta.id == v.id

    def test_relacion_con_producto(self, app, venta, producto):
        """Test: Relación con Product"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            db.session.add(detalle)
            db.session.commit()

            assert detalle.producto is not None
            assert detalle.producto.nombre == 'Producto Test'

    # === TESTS DE SERIALIZACIÓN ===

    def test_to_dict_basico(self, app, venta, producto):
        """Test: Convertir detalle a diccionario"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                descuento_item=Decimal('2.00'),
                subtotal_final=Decimal('28.00')
            )

            data = detalle.to_dict()

            assert data['cantidad'] == 2
            assert data['precio_unitario'] == 15.0
            assert data['precio_compra_unitario'] == 10.0
            assert data['subtotal'] == 30.0
            assert data['descuento_item'] == 2.0
            assert data['subtotal_final'] == 28.0
            assert data['ganancia_unitaria'] == 5.0
            assert data['ganancia_total'] == 10.0

    def test_to_dict_con_relaciones(self, app, venta, producto):
        """Test: Convertir detalle a diccionario con relaciones"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            db.session.add(detalle)
            db.session.commit()

            data = detalle.to_dict(include_relations=True)

            assert 'producto' in data
            assert data['producto']['nombre'] == 'Producto Test'

    # === TESTS DE BÚSQUEDA ===

    def test_por_venta(self, app, venta, producto):
        """Test: Buscar detalles por venta"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle1 = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            detalle2 = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=1,
                precio_unitario=Decimal('20.00'),
                precio_compra_unitario=Decimal('15.00'),
                subtotal=Decimal('20.00'),
                subtotal_final=Decimal('20.00')
            )

            db.session.add_all([detalle1, detalle2])
            db.session.commit()

            detalles = DetalleVenta.por_venta(v.id)

            assert len(detalles) == 2
            assert all(d.venta_id == v.id for d in detalles)

    def test_por_producto(self, app, venta, producto):
        """Test: Buscar detalles por producto"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            db.session.add(detalle)
            db.session.commit()

            detalles = DetalleVenta.por_producto(p.id)

            assert len(detalles) >= 1
            assert all(d.producto_id == p.id for d in detalles)

    def test_total_vendido_producto(self, app, venta, producto):
        """Test: Total vendido de un producto"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle1 = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            detalle2 = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=3,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('45.00'),
                subtotal_final=Decimal('45.00')
            )

            db.session.add_all([detalle1, detalle2])
            db.session.commit()

            total = DetalleVenta.total_vendido_producto(p.id)

            assert total == 5  # 2 + 3

    # === TESTS DE REPRESENTACIÓN ===

    def test_repr(self, app, venta, producto):
        """Test: Representación __repr__"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            repr_str = repr(detalle)

            assert 'DetalleVenta' in repr_str
            assert 'cantidad=2' in repr_str

    def test_str(self, app, venta, producto):
        """Test: Representación __str__"""
        with app.app_context():
            v = db.session.merge(venta)
            p = db.session.merge(producto)

            detalle = DetalleVenta(
                venta_id=v.id,
                producto_id=p.id,
                cantidad=2,
                precio_unitario=Decimal('15.00'),
                precio_compra_unitario=Decimal('10.00'),
                subtotal=Decimal('30.00'),
                subtotal_final=Decimal('30.00')
            )

            db.session.add(detalle)
            db.session.commit()

            str_val = str(detalle)

            assert '2x' in str_val
            assert 'Producto Test' in str_val
