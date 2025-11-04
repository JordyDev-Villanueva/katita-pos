"""
Tests para el modelo Venta de KATITA-POS

Tests completos para verificar:
- Creación de ventas con diferentes métodos de pago
- Cálculo de totales (subtotal, descuento, total)
- Cálculo de cambio solo para efectivo
- Validación de pagos digitales sin cambio
- Generación de número de venta único
- Cancelación de ventas
- Búsquedas y estadísticas
- Propiedades calculadas

NOTA: Los precios YA INCLUYEN IGV - no se calcula por separado
"""

import pytest
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from app import create_app, db
from app.models.venta import Venta
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


class TestVentaModel:
    """Tests para el modelo Venta"""

    # === TESTS DE CREACIÓN ===

    def test_crear_venta_efectivo(self, app, vendedor):
        """Test: Crear una venta en efectivo"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('150.00'),
                cambio=Decimal('50.00'),
                vendedor_id=user.id
            )

            db.session.add(venta)
            db.session.commit()

            assert venta.id is not None
            assert venta.metodo_pago == 'efectivo'
            assert venta.monto_recibido == Decimal('150.00')
            assert venta.cambio == Decimal('50.00')

    def test_crear_venta_yape(self, app, vendedor):
        """Test: Crear una venta con Yape"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )

            db.session.add(venta)
            db.session.commit()

            assert venta.id is not None
            assert venta.metodo_pago == 'yape'
            assert venta.monto_recibido is None
            assert venta.cambio == Decimal('0.00') or venta.cambio is None

    def test_crear_venta_plin(self, app, vendedor):
        """Test: Crear una venta con Plin"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='plin',
                vendedor_id=user.id
            )

            db.session.add(venta)
            db.session.commit()

            assert venta.id is not None
            assert venta.metodo_pago == 'plin'

    def test_crear_venta_transferencia(self, app, vendedor):
        """Test: Crear una venta con transferencia"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='transferencia',
                vendedor_id=user.id
            )

            db.session.add(venta)
            db.session.commit()

            assert venta.id is not None
            assert venta.metodo_pago == 'transferencia'

    def test_venta_valores_por_defecto(self, app, vendedor):
        """Test: Verificar valores por defecto de la venta"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id
            )

            assert venta.descuento == Decimal('0.00')
            assert venta.estado == 'completada'
            assert venta.created_offline is False
            assert venta.synced is True

    # === TESTS DE VALIDACIONES ===

    def test_validar_metodo_pago_invalido(self, app, vendedor):
        """Test: Método de pago inválido debe fallar"""
        with app.app_context():
            user = db.session.merge(vendedor)

            with pytest.raises(ValueError, match='método de pago debe ser uno de'):
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    total=Decimal('100.00'),
                    metodo_pago='tarjeta',  # NO es válido
                    vendedor_id=user.id
                )

    def test_validar_metodo_pago_sin_tarjeta(self, app, vendedor):
        """Test: Verificar que 'tarjeta' NO es un método de pago válido"""
        with app.app_context():
            user = db.session.merge(vendedor)

            # Tarjeta NO debe ser aceptada
            with pytest.raises(ValueError):
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    total=Decimal('100.00'),
                    metodo_pago='tarjeta',
                    vendedor_id=user.id
                )

    def test_validar_estado_invalido(self, app, vendedor):
        """Test: Estado inválido debe fallar"""
        with app.app_context():
            user = db.session.merge(vendedor)

            with pytest.raises(ValueError, match='estado debe ser uno de'):
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    total=Decimal('100.00'),
                    metodo_pago='efectivo',
                    monto_recibido=Decimal('120.00'),
                    vendedor_id=user.id,
                    estado='procesando'  # NO es válido
                )

    def test_validar_total_negativo(self, app, vendedor):
        """Test: Total negativo o cero debe fallar"""
        with app.app_context():
            user = db.session.merge(vendedor)

            with pytest.raises(ValueError, match='total debe ser mayor a 0'):
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    total=Decimal('0.00'),  # Total cero no es válido
                    metodo_pago='efectivo',
                    vendedor_id=user.id
                )

    def test_validar_subtotal_negativo(self, app, vendedor):
        """Test: Subtotal negativo debe fallar"""
        with app.app_context():
            user = db.session.merge(vendedor)

            with pytest.raises(ValueError, match='subtotal no puede ser negativo'):
                venta = Venta(
                    subtotal=Decimal('-100.00'),  # Subtotal negativo
                    total=Decimal('100.00'),
                    metodo_pago='efectivo',
                    vendedor_id=user.id
                )

    def test_validar_descuento_negativo(self, app, vendedor):
        """Test: Descuento negativo debe fallar"""
        with app.app_context():
            user = db.session.merge(vendedor)

            with pytest.raises(ValueError, match='descuento no puede ser negativo'):
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    descuento=Decimal('-10.00'),  # Descuento negativo
                    total=Decimal('100.00'),
                    metodo_pago='efectivo',
                    vendedor_id=user.id
                )

    # === TESTS DE CÁLCULO DE TOTALES ===

    def test_calcular_totales_sin_descuento(self, app, vendedor):
        """Test: Calcular totales sin descuento"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),  # Valor inicial temporal
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id
            )

            venta.calcular_totales()

            # Total = 100 - 0 = 100 (sin IGV por separado)
            assert venta.total == Decimal('100.00')

    def test_calcular_totales_con_descuento(self, app, vendedor):
        """Test: Calcular totales con descuento"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('10.00'),
                total=Decimal('90.00'),  # Valor inicial temporal
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id
            )

            venta.calcular_totales()

            # Total = 100 - 10 = 90 (sin IGV por separado)
            assert venta.total == Decimal('90.00')

    def test_validar_total_correcto(self, app, vendedor):
        """Test: Validar que el total sea correcto"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )

            venta.validar()  # No debe lanzar error

    def test_validar_total_incorrecto(self, app, vendedor):
        """Test: Validar que total incorrecto falle"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('120.00'),  # Incorrecto (debería ser 100)
                metodo_pago='efectivo',
                monto_recibido=Decimal('150.00'),
                cambio=Decimal('30.00'),
                vendedor_id=user.id
            )

            with pytest.raises(ValueError, match='total calculado'):
                venta.validar()

    # === TESTS DE CÁLCULO DE CAMBIO ===

    def test_calcular_cambio_efectivo(self, app, vendedor):
        """Test: Calcular cambio para pago en efectivo"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('150.00'),
                vendedor_id=user.id
            )

            venta.calcular_cambio()

            assert venta.cambio == Decimal('50.00')

    def test_calcular_cambio_efectivo_exacto(self, app, vendedor):
        """Test: Pago exacto en efectivo (sin cambio)"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('100.00'),
                vendedor_id=user.id
            )

            venta.calcular_cambio()

            assert venta.cambio == Decimal('0.00')

    def test_calcular_cambio_efectivo_insuficiente(self, app, vendedor):
        """Test: Monto insuficiente en efectivo debe fallar"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('90.00'),  # Insuficiente
                vendedor_id=user.id
            )

            with pytest.raises(ValueError, match='monto recibido.*es menor que el total'):
                venta.calcular_cambio()

    def test_calcular_cambio_digital_sin_cambio(self, app, vendedor):
        """Test: Pagos digitales no generan cambio"""
        with app.app_context():
            user = db.session.merge(vendedor)

            for metodo in ['yape', 'plin', 'transferencia']:
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    descuento=Decimal('0.00'),
                    total=Decimal('100.00'),
                    metodo_pago=metodo,
                    vendedor_id=user.id
                )

                venta.calcular_cambio()

                assert venta.monto_recibido is None
                assert venta.cambio == Decimal('0.00')

    def test_validar_pago_digital_sin_monto_recibido(self, app, vendedor):
        """Test: Pagos digitales no deben tener monto_recibido"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                monto_recibido=Decimal('100.00'),  # NO debe tener
                cambio=Decimal('0.00'),
                vendedor_id=user.id
            )

            with pytest.raises(ValueError, match='pagos digitales no requieren monto recibido'):
                venta.validar()

    def test_validar_pago_digital_sin_cambio(self, app, vendedor):
        """Test: Pagos digitales no deben generar cambio"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('0.00'),
                total=Decimal('100.00'),
                metodo_pago='plin',
                monto_recibido=None,
                cambio=Decimal('10.00'),  # NO debe tener cambio
                vendedor_id=user.id
            )

            with pytest.raises(ValueError, match='pagos digitales no generan cambio'):
                venta.validar()

    # === TESTS DE PROPIEDADES CALCULADAS ===

    def test_es_pago_digital(self, app, vendedor):
        """Test: Property es_pago_digital"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta_yape = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            assert venta_yape.es_pago_digital is True
            assert venta_yape.es_pago_efectivo is False

            venta_plin = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='plin',
                vendedor_id=user.id
            )
            assert venta_plin.es_pago_digital is True

            venta_transferencia = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='transferencia',
                vendedor_id=user.id
            )
            assert venta_transferencia.es_pago_digital is True

    def test_es_pago_efectivo(self, app, vendedor):
        """Test: Property es_pago_efectivo"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta_efectivo = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id
            )
            assert venta_efectivo.es_pago_efectivo is True
            assert venta_efectivo.es_pago_digital is False

    def test_fue_creada_hoy(self, app, vendedor):
        """Test: Property fue_creada_hoy"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )
            venta.generar_numero_venta()  # Generar número único
            db.session.add(venta)
            db.session.flush()  # Asegurar que fecha se asigne

            assert venta.fue_creada_hoy is True

    def test_dias_desde_venta(self, app, vendedor):
        """Test: Property dias_desde_venta"""
        with app.app_context():
            user = db.session.merge(vendedor)

            # Venta de hoy
            venta_hoy = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id
            )
            assert venta_hoy.dias_desde_venta == 0

            # Venta de hace 5 días
            venta_antigua = Venta(
                fecha=datetime.now(timezone.utc) - timedelta(days=5),
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id
            )
            assert venta_antigua.dias_desde_venta == 5

    def test_esta_pendiente_sync(self, app, vendedor):
        """Test: Property esta_pendiente_sync"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta_pendiente = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id,
                created_offline=True,
                synced=False
            )
            assert venta_pendiente.esta_pendiente_sync is True

            venta_sincronizada = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                vendedor_id=user.id,
                created_offline=False,
                synced=True
            )
            assert venta_sincronizada.esta_pendiente_sync is False

    # === TESTS DE GENERACIÓN DE NÚMERO ===

    def test_generar_numero_venta(self, app, vendedor):
        """Test: Generar número de venta único"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )

            numero = venta.generar_numero_venta()

            # Debe tener formato V-YYYYMMDD-XXXX
            assert numero.startswith('V-')
            assert len(numero) >= 15  # V-20251101-0001 (mínimo)
            assert '-' in numero[10:]  # Debe haber un guión después de la fecha

    def test_generar_numero_venta_secuencial(self, app, vendedor):
        """Test: Números de venta secuenciales en el mismo día"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta1 = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )
            venta1.generar_numero_venta()
            db.session.add(venta1)
            db.session.commit()

            venta2 = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            venta2.generar_numero_venta()
            db.session.add(venta2)
            db.session.commit()

            # Extraer números secuenciales
            num1 = int(venta1.numero_venta.split('-')[-1])
            num2 = int(venta2.numero_venta.split('-')[-1])

            assert num2 == num1 + 1

    # === TESTS DE MÉTODOS DE GESTIÓN ===

    def test_cancelar_venta(self, app, vendedor):
        """Test: Cancelar una venta"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )

            venta.cancelar(motivo='Cliente solicitó cancelación')

            assert venta.estado == 'cancelada'
            assert 'CANCELADA' in venta.notas
            assert 'Cliente solicitó cancelación' in venta.notas

    def test_marcar_como_sincronizada(self, app, vendedor):
        """Test: Marcar venta como sincronizada"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id,
                created_offline=True,
                synced=False
            )

            assert venta.synced is False

            venta.marcar_como_sincronizada()

            assert venta.synced is True

    # === TESTS DE SERIALIZACIÓN ===

    def test_to_dict_basico(self, app, vendedor):
        """Test: Convertir venta a diccionario"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                descuento=Decimal('10.00'),
                total=Decimal('90.00'),
                metodo_pago='yape',
                cliente_nombre='Juan Pérez',
                cliente_dni='12345678',
                vendedor_id=user.id
            )

            data = venta.to_dict()

            assert data['subtotal'] == 100.0
            assert data['descuento'] == 10.0
            assert data['total'] == 90.0
            assert data['metodo_pago'] == 'yape'
            assert data['cliente_nombre'] == 'Juan Pérez'
            assert data['cliente_dni'] == '12345678'
            assert data['es_pago_digital'] is True

    # === TESTS DE BÚSQUEDA ===

    def test_ventas_del_dia(self, app, vendedor):
        """Test: Buscar ventas del día"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta_hoy = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )
            venta_hoy.generar_numero_venta()

            db.session.add(venta_hoy)
            db.session.commit()

            ventas = Venta.ventas_del_dia()

            assert len(ventas) >= 1
            assert any(v.id == venta_hoy.id for v in ventas)

    def test_ventas_por_vendedor(self, app, vendedor):
        """Test: Buscar ventas por vendedor"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            venta.generar_numero_venta()

            db.session.add(venta)
            db.session.commit()

            ventas = Venta.ventas_por_vendedor(user.id)

            assert len(ventas) >= 1
            assert all(v.vendedor_id == user.id for v in ventas)

    def test_ventas_por_metodo_pago(self, app, vendedor):
        """Test: Buscar ventas por método de pago"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta_yape = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            venta_yape.generar_numero_venta()

            db.session.add(venta_yape)
            db.session.commit()

            ventas = Venta.ventas_por_metodo_pago('yape')

            assert len(ventas) >= 1
            assert all(v.metodo_pago == 'yape' for v in ventas)

    def test_ventas_digitales(self, app, vendedor):
        """Test: Buscar ventas con métodos digitales"""
        with app.app_context():
            user = db.session.merge(vendedor)

            for metodo in ['yape', 'plin', 'transferencia']:
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    total=Decimal('100.00'),
                    metodo_pago=metodo,
                    vendedor_id=user.id
                )
                venta.generar_numero_venta()
                db.session.add(venta)

            db.session.commit()

            ventas_digitales = Venta.ventas_digitales()

            assert len(ventas_digitales) >= 3
            assert all(v.es_pago_digital for v in ventas_digitales)

    def test_ventas_efectivo(self, app, vendedor):
        """Test: Buscar ventas en efectivo"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )
            venta.generar_numero_venta()

            db.session.add(venta)
            db.session.commit()

            ventas_efectivo = Venta.ventas_efectivo()

            assert len(ventas_efectivo) >= 1
            assert all(v.es_pago_efectivo for v in ventas_efectivo)

    def test_ventas_pendientes_sync(self, app, vendedor):
        """Test: Buscar ventas pendientes de sincronización"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta_pendiente = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id,
                created_offline=True,
                synced=False
            )
            venta_pendiente.generar_numero_venta()

            db.session.add(venta_pendiente)
            db.session.commit()

            pendientes = Venta.ventas_pendientes_sync()

            assert len(pendientes) >= 1
            assert all(v.esta_pendiente_sync for v in pendientes)

    def test_total_ventas_dia(self, app, vendedor):
        """Test: Total de ventas del día"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta1 = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )
            venta1.generar_numero_venta()
            db.session.add(venta1)

            venta2 = Venta(
                subtotal=Decimal('50.00'),
                total=Decimal('50.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            venta2.generar_numero_venta()
            db.session.add(venta2)

            db.session.commit()

            total = Venta.total_ventas_dia()

            assert total >= Decimal('150.00')  # 100 + 50

    def test_cantidad_ventas_dia(self, app, vendedor):
        """Test: Cantidad de ventas del día"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta1 = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='efectivo',
                monto_recibido=Decimal('120.00'),
                cambio=Decimal('20.00'),
                vendedor_id=user.id
            )
            venta1.generar_numero_venta()
            db.session.add(venta1)

            venta2 = Venta(
                subtotal=Decimal('50.00'),
                total=Decimal('50.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            venta2.generar_numero_venta()
            db.session.add(venta2)

            db.session.commit()

            cantidad = Venta.cantidad_ventas_dia()

            assert cantidad >= 2

    def test_buscar_por_numero(self, app, vendedor):
        """Test: Buscar venta por número"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )
            numero = venta.generar_numero_venta()

            db.session.add(venta)
            db.session.commit()

            encontrada = Venta.buscar_por_numero(numero)

            assert encontrada is not None
            assert encontrada.numero_venta == numero

    def test_ultimas_ventas(self, app, vendedor):
        """Test: Obtener últimas ventas"""
        with app.app_context():
            user = db.session.merge(vendedor)

            for i in range(5):
                venta = Venta(
                    subtotal=Decimal('100.00'),
                    total=Decimal('100.00'),
                    metodo_pago='yape',
                    vendedor_id=user.id
                )
                venta.generar_numero_venta()
                db.session.add(venta)

            db.session.commit()

            ultimas = Venta.ultimas_ventas(limit=3)

            assert len(ultimas) == 3

    # === TESTS DE REPRESENTACIÓN ===

    def test_repr(self, app, vendedor):
        """Test: Representación __repr__"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                numero_venta='V-20251101-0001',
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                vendedor_id=user.id
            )

            assert 'V-20251101-0001' in repr(venta)
            assert '100' in repr(venta)
            assert 'yape' in repr(venta)

    def test_str(self, app, vendedor):
        """Test: Representación __str__"""
        with app.app_context():
            user = db.session.merge(vendedor)

            venta = Venta(
                numero_venta='V-20251101-0001',
                subtotal=Decimal('100.00'),
                total=Decimal('100.00'),
                metodo_pago='yape',
                estado='completada',
                vendedor_id=user.id
            )

            assert 'V-20251101-0001' in str(venta)
            assert 'yape' in str(venta)
            assert 'completada' in str(venta)
