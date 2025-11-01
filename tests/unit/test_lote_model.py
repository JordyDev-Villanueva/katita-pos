"""
KATITA-POS - Lote Model Tests
=============================
Tests unitarios para el modelo Lote
"""

import pytest
from decimal import Decimal
from datetime import date, datetime, timedelta, timezone
from app.models.lote import Lote
from app.models.product import Product
from app import db


class TestLoteModel:
    """Tests para el modelo Lote"""

    @pytest.fixture
    def producto(self, app):
        """Fixture: Crea un producto para los tests"""
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
            return product

    def test_crear_lote_basico(self, app, producto):
        """Test: Crear un lote con datos básicos"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-001',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.50')
            )

            db.session.add(lote)
            db.session.commit()

            assert lote.id is not None
            assert lote.codigo_lote == 'LT-2024-001'
            assert lote.cantidad_inicial == 50
            assert lote.cantidad_actual == 50
            assert lote.activo is True

    def test_lote_valores_por_defecto(self, app, producto):
        """Test: Verificar valores por defecto del lote"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-002',
                cantidad_inicial=30,
                fecha_vencimiento=date.today() + timedelta(days=90),
                precio_compra_lote=Decimal('8.00')
                # No especificamos cantidad_actual ni activo
            )

            assert lote.cantidad_actual == 30  # Debe igualarse a cantidad_inicial
            assert lote.activo is True

    def test_codigo_lote_unico(self, app, producto):
        """Test: El código de lote debe ser único"""
        with app.app_context():
            product = db.session.merge(producto)

            lote1 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-003',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.50')
            )
            db.session.add(lote1)
            db.session.commit()

            # Intentar crear lote con mismo código
            lote2 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-003',  # Mismo código
                cantidad_inicial=30,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=90),
                precio_compra_lote=Decimal('8.00')
            )
            db.session.add(lote2)

            with pytest.raises(Exception):  # IntegrityError
                db.session.commit()

    def test_validar_cantidades(self, app, producto):
        """Test: Validaciones de cantidades"""
        with app.app_context():
            product = db.session.merge(producto)

            # Cantidad inicial negativa - error al crear
            with pytest.raises(ValueError, match='debe ser mayor a 0'):
                lote = Lote(
                    producto_id=product.id,
                    codigo_lote='LT-2024-004',
                    cantidad_inicial=-10,
                    cantidad_actual=0,
                    fecha_vencimiento=date.today() + timedelta(days=90),
                    precio_compra_lote=Decimal('8.00')
                )

            # Cantidad actual mayor que inicial - error al crear
            with pytest.raises(ValueError, match='no puede ser mayor'):
                lote2 = Lote(
                    producto_id=product.id,
                    codigo_lote='LT-2024-005',
                    cantidad_inicial=10,
                    cantidad_actual=20,
                    fecha_vencimiento=date.today() + timedelta(days=90),
                    precio_compra_lote=Decimal('8.00')
                )

    def test_validar_precio_compra(self, app, producto):
        """Test: Validación de precio de compra"""
        with app.app_context():
            product = db.session.merge(producto)

            # Precio negativo - error al crear
            with pytest.raises(ValueError, match='debe ser mayor a 0'):
                lote = Lote(
                    producto_id=product.id,
                    codigo_lote='LT-2024-006',
                    cantidad_inicial=50,
                    cantidad_actual=50,
                    fecha_vencimiento=date.today() + timedelta(days=90),
                    precio_compra_lote=Decimal('-5.00')
                )

    def test_validar_fechas(self, app, producto):
        """Test: Validación de fechas"""
        with app.app_context():
            product = db.session.merge(producto)

            # Fecha de vencimiento en el pasado - error al crear
            with pytest.raises(ValueError, match='debe ser posterior'):
                lote = Lote(
                    producto_id=product.id,
                    codigo_lote='LT-2024-007',
                    cantidad_inicial=50,
                    cantidad_actual=50,
                    fecha_vencimiento=date.today() - timedelta(days=10),
                    precio_compra_lote=Decimal('8.00')
                )

    def test_dias_hasta_vencimiento(self, app, producto):
        """Test: Cálculo de días hasta vencimiento"""
        with app.app_context():
            product = db.session.merge(producto)

            # Lote que vence en 30 días
            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-008',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=30),
                precio_compra_lote=Decimal('8.00')
            )

            assert lote.dias_hasta_vencimiento == 30

    def test_esta_vencido(self, app, producto):
        """Test: Property esta_vencido"""
        with app.app_context():
            product = db.session.merge(producto)

            # Lote vencido (fecha_ingreso debe ser anterior a fecha_vencimiento)
            lote_vencido = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-009',
                cantidad_inicial=50,
                cantidad_actual=20,
                fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # Ingresado hace 100 días
                fecha_vencimiento=date.today() - timedelta(days=10),  # Venció hace 10 días
                precio_compra_lote=Decimal('8.00')
            )
            assert lote_vencido.esta_vencido is True

            # Lote no vencido
            lote_vigente = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-010',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=90),
                precio_compra_lote=Decimal('8.00')
            )
            assert lote_vigente.esta_vencido is False

    def test_esta_por_vencer(self, app, producto):
        """Test: Property esta_por_vencer"""
        with app.app_context():
            product = db.session.merge(producto)

            # Lote que vence en 20 días (por vencer)
            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-011',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=20),
                precio_compra_lote=Decimal('8.00')
            )
            assert lote.esta_por_vencer is True

            # Lote que vence en 90 días (no por vencer)
            lote2 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-012',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=90),
                precio_compra_lote=Decimal('8.00')
            )
            assert lote2.esta_por_vencer is False

    def test_cantidad_vendida_porcentaje(self, app, producto):
        """Test: Cálculo de cantidad vendida y porcentaje"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-013',
                cantidad_inicial=100,
                cantidad_actual=60,  # Vendido 40
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            assert lote.cantidad_vendida == 40
            assert lote.porcentaje_vendido == 40.0

    def test_descontar_stock(self, app, producto):
        """Test: Descontar stock del lote"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-014',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            lote.descontar_stock(10)
            assert lote.cantidad_actual == 40

            lote.descontar_stock(5)
            assert lote.cantidad_actual == 35

    def test_descontar_stock_insuficiente(self, app, producto):
        """Test: No permitir descontar más stock del disponible"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-015',
                cantidad_inicial=50,
                cantidad_actual=10,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            with pytest.raises(ValueError, match='Stock insuficiente'):
                lote.descontar_stock(20)

    def test_descontar_stock_agotado_desactiva(self, app, producto):
        """Test: Lote se desactiva al agotar stock"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-016',
                cantidad_inicial=10,
                cantidad_actual=10,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            assert lote.activo is True
            lote.descontar_stock(10)

            assert lote.cantidad_actual == 0
            assert lote.activo is False

    def test_aumentar_stock(self, app, producto):
        """Test: Aumentar stock del lote (devoluciones)"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-017',
                cantidad_inicial=50,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            lote.aumentar_stock(10)
            assert lote.cantidad_actual == 40

    def test_aumentar_stock_excede_inicial(self, app, producto):
        """Test: No permitir stock mayor a cantidad inicial"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-018',
                cantidad_inicial=50,
                cantidad_actual=45,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            with pytest.raises(ValueError, match='no puede exceder'):
                lote.aumentar_stock(10)

    def test_esta_disponible(self, app, producto):
        """Test: Verificar disponibilidad del lote"""
        with app.app_context():
            product = db.session.merge(producto)

            # Lote disponible
            lote_ok = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-019',
                cantidad_inicial=50,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00'),
                activo=True
            )
            assert lote_ok.esta_disponible() is True

            # Lote vencido (fecha_ingreso debe ser anterior a fecha_vencimiento)
            lote_vencido = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-020',
                cantidad_inicial=50,
                cantidad_actual=30,
                fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # Ingresado hace 100 días
                fecha_vencimiento=date.today() - timedelta(days=10),  # Venció hace 10 días
                precio_compra_lote=Decimal('8.00'),
                activo=True
            )
            assert lote_vencido.esta_disponible() is False

            # Lote sin stock
            lote_sin_stock = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-021',
                cantidad_inicial=50,
                cantidad_actual=0,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00'),
                activo=True
            )
            assert lote_sin_stock.esta_disponible() is False

    def test_dias_en_inventario(self, app, producto):
        """Test: Cálculo de días en inventario"""
        with app.app_context():
            product = db.session.merge(producto)

            # Lote ingresado hace 10 días
            fecha_ingreso_pasada = datetime.now(timezone.utc) - timedelta(days=10)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-022',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )
            lote.fecha_ingreso = fecha_ingreso_pasada

            assert lote.dias_en_inventario() == 10

    def test_buscar_por_producto(self, app, producto):
        """Test: Buscar lotes de un producto"""
        with app.app_context():
            product = db.session.merge(producto)

            lote1 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-023',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )
            lote2 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-024',
                cantidad_inicial=30,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=90),
                precio_compra_lote=Decimal('8.50')
            )
            db.session.add_all([lote1, lote2])
            db.session.commit()

            lotes = Lote.buscar_por_producto(product.id).all()
            assert len(lotes) >= 2

    def test_proximos_a_vencer(self, app, producto):
        """Test: Buscar lotes próximos a vencer"""
        with app.app_context():
            product = db.session.merge(producto)

            # Lote que vence en 15 días
            lote_proximo = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-025',
                cantidad_inicial=50,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=15),
                precio_compra_lote=Decimal('8.00')
            )
            db.session.add(lote_proximo)
            db.session.commit()

            proximos = Lote.proximos_a_vencer(dias=30)
            codigos = [l.codigo_lote for l in proximos]
            assert 'LT-2024-025' in codigos

    def test_lotes_vencidos(self, app, producto):
        """Test: Buscar lotes vencidos"""
        with app.app_context():
            product = db.session.merge(producto)

            lote_vencido = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-026',
                cantidad_inicial=50,
                cantidad_actual=20,
                fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # Ingresado hace 100 días
                fecha_vencimiento=date.today() - timedelta(days=30),  # Venció hace 30 días
                precio_compra_lote=Decimal('8.00')
            )
            db.session.add(lote_vencido)
            db.session.commit()

            vencidos = Lote.lotes_vencidos()
            codigos = [l.codigo_lote for l in vencidos]
            assert 'LT-2024-026' in codigos

    def test_lotes_fifo(self, app, producto):
        """Test: Ordenamiento FIFO de lotes"""
        with app.app_context():
            product = db.session.merge(producto)

            # Crear lotes con diferentes fechas de vencimiento
            lote1 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-027',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=90),
                precio_compra_lote=Decimal('8.00')
            )
            lote2 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-028',
                cantidad_inicial=30,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=30),  # Vence antes
                precio_compra_lote=Decimal('8.50')
            )
            lote3 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-029',
                cantidad_inicial=40,
                cantidad_actual=40,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.25')
            )
            db.session.add_all([lote1, lote2, lote3])
            db.session.commit()

            lotes_fifo = Lote.lotes_fifo(product.id).all()

            # El primer lote debe ser el que vence antes
            assert lotes_fifo[0].codigo_lote == 'LT-2024-028'

    def test_buscar_por_codigo(self, app, producto):
        """Test: Buscar lote por código"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-030',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )
            db.session.add(lote)
            db.session.commit()

            found = Lote.buscar_por_codigo('LT-2024-030')
            assert found is not None
            assert found.cantidad_inicial == 50

    def test_to_dict(self, app, producto):
        """Test: Convertir lote a diccionario"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-031',
                cantidad_inicial=100,
                cantidad_actual=60,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.50'),
                proveedor='Proveedor Test',
                ubicacion='Pasillo A, Estante 3'
            )

            data = lote.to_dict()

            assert data['codigo_lote'] == 'LT-2024-031'
            assert data['cantidad_inicial'] == 100
            assert data['cantidad_actual'] == 60
            assert data['cantidad_vendida'] == 40
            assert data['porcentaje_vendido'] == 40.0
            assert data['proveedor'] == 'Proveedor Test'

    def test_to_dict_con_producto(self, app, producto):
        """Test: Convertir lote a diccionario incluyendo producto"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-032',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )
            db.session.add(lote)
            db.session.commit()

            data = lote.to_dict(include_producto=True)

            assert 'producto' in data
            assert data['producto']['nombre'] == 'Coca Cola 2L'

    def test_relacion_con_producto(self, app, producto):
        """Test: Relación con el modelo Product"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-033',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )
            db.session.add(lote)
            db.session.commit()

            # Acceder al producto desde el lote
            assert lote.producto.nombre == 'Coca Cola 2L'

            # Acceder a lotes desde el producto
            lotes_producto = product.lotes.all()
            codigos = [l.codigo_lote for l in lotes_producto]
            assert 'LT-2024-033' in codigos

    def test_repr_str(self, app, producto):
        """Test: Representaciones del lote"""
        with app.app_context():
            product = db.session.merge(producto)

            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-034',
                cantidad_inicial=50,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=180),
                precio_compra_lote=Decimal('8.00')
            )

            repr_str = repr(lote)
            assert 'LT-2024-034' in repr_str
            assert '30/50' in repr_str

            str_repr = str(lote)
            assert 'LT-2024-034' in str_repr
            assert '30 unidades' in str_repr

    def test_estadisticas_por_producto(self, app, producto):
        """Test: Estadísticas de lotes por producto"""
        with app.app_context():
            product = db.session.merge(producto)

            # Crear varios lotes
            lote1 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-035',
                cantidad_inicial=50,
                cantidad_actual=30,
                fecha_vencimiento=date.today() + timedelta(days=20),
                precio_compra_lote=Decimal('8.00')
            )
            lote2 = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-036',
                cantidad_inicial=30,
                cantidad_actual=0,
                fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # Ingresado hace 100 días
                fecha_vencimiento=date.today() - timedelta(days=10),  # Venció hace 10 días
                precio_compra_lote=Decimal('8.50'),
                activo=False
            )
            db.session.add_all([lote1, lote2])
            db.session.commit()

            stats = Lote.estadisticas_por_producto(product.id)

            assert stats['total_lotes'] >= 2
            assert 'stock_total' in stats
            assert 'lotes_vencidos' in stats
            assert 'lotes_por_vencer' in stats
