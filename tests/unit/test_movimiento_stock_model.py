"""
Tests para el modelo MovimientoStock
"""

import pytest
from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from app.models import MovimientoStock, Product, Lote, User, Venta


# === FIXTURES ===

@pytest.fixture
def usuario(app):
    """Fixture de usuario para movimientos"""
    from app import db
    user = User(
        username='stock_admin',
        email='stock@katitapos.com',
        nombre_completo='Stock Administrator',
        rol='admin'
    )
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def producto(app):
    """Fixture de producto para movimientos"""
    from app import db
    prod = Product(
        codigo_barras='7501234567890',
        nombre='Producto Test Stock',
        categoria='Test',
        precio_compra=Decimal('10.00'),
        precio_venta=Decimal('15.00'),
        stock_total=100
    )
    db.session.add(prod)
    db.session.commit()
    return prod


@pytest.fixture
def lote(app, producto):
    """Fixture de lote para movimientos"""
    from app import db
    lote = Lote(
        codigo_lote='LOTE-TEST-001',
        producto_id=producto.id,
        cantidad_inicial=50,
        cantidad_actual=50,
        precio_compra_lote=Decimal('10.00'),
        fecha_vencimiento=date.today() + timedelta(days=90)
    )
    db.session.add(lote)
    db.session.commit()
    return lote


@pytest.fixture
def venta(app, usuario):
    """Fixture de venta para movimientos de venta"""
    from app import db
    venta = Venta(
        subtotal=Decimal('100.00'),
        descuento=Decimal('0.00'),
        total=Decimal('100.00'),
        metodo_pago='efectivo',
        monto_recibido=Decimal('120.00'),
        cambio=Decimal('20.00'),
        vendedor_id=usuario.id
    )
    venta.generar_numero_venta()
    db.session.add(venta)
    db.session.commit()
    return venta


# === TESTS DE CREACIÓN ===

def test_crear_movimiento_venta(app, producto, usuario, venta):
    """Test de creación de movimiento tipo venta"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=venta.id,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95,
            motivo='Venta de producto'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.tipo == 'venta'
        assert mov.cantidad == -5
        assert mov.stock_anterior == 100
        assert mov.stock_nuevo == 95


def test_crear_movimiento_compra(app, producto, usuario):
    """Test de creación de movimiento tipo compra"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150,
            motivo='Compra de mercadería',
            referencia='FACT-001'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.tipo == 'compra'
        assert mov.cantidad == 50
        assert mov.referencia == 'FACT-001'


def test_crear_movimiento_ajuste_positivo(app, producto, usuario):
    """Test de creación de ajuste positivo"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='ajuste',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=10,
            stock_anterior=100,
            stock_nuevo=110,
            motivo='Inventario encontrado'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.tipo == 'ajuste'
        assert mov.cantidad == 10


def test_crear_movimiento_ajuste_negativo(app, producto, usuario):
    """Test de creación de ajuste negativo"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='ajuste',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=-8,
            stock_anterior=100,
            stock_nuevo=92,
            motivo='Corrección por conteo físico'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.cantidad == -8


def test_crear_movimiento_devolucion(app, producto, usuario):
    """Test de creación de devolución"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='devolucion',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=3,
            stock_anterior=100,
            stock_nuevo=103,
            motivo='Devolución de cliente'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.tipo == 'devolucion'


def test_crear_movimiento_merma(app, producto, usuario):
    """Test de creación de merma"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='merma',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=-12,
            stock_anterior=100,
            stock_nuevo=88,
            motivo='Producto vencido'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.tipo == 'merma'


def test_crear_movimiento_ingreso_inicial(app, producto, usuario):
    """Test de creación de ingreso inicial"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='ingreso_inicial',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=100,
            stock_anterior=0,
            stock_nuevo=100,
            motivo='Carga inicial de inventario'
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.id is not None
        assert mov.tipo == 'ingreso_inicial'
        assert mov.stock_anterior == 0


def test_crear_movimiento_con_lote(app, producto, lote, usuario):
    """Test de creación de movimiento asociado a un lote"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            lote_id=lote.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.lote_id == lote.id
        assert mov.lote.codigo_lote == 'LOTE-TEST-001'


# === TESTS DE VALIDACIONES ===

def test_validar_tipo_invalido(app, producto, usuario):
    """Test de validación de tipo inválido"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El tipo debe ser uno de'):
            mov = MovimientoStock(
                tipo='tipo_invalido',
                producto_id=producto.id,
                usuario_id=usuario.id,
                cantidad=10,
                stock_anterior=100,
                stock_nuevo=110
            )
            db.session.add(mov)
            db.session.commit()


def test_validar_cantidad_cero(app, producto, usuario):
    """Test de validación de cantidad cero"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='La cantidad no puede ser cero'):
            mov = MovimientoStock(
                tipo='ajuste',
                producto_id=producto.id,
                usuario_id=usuario.id,
                cantidad=0,
                stock_anterior=100,
                stock_nuevo=100
            )
            db.session.add(mov)
            db.session.commit()


def test_validar_stock_anterior_negativo(app, producto, usuario):
    """Test de validación de stock anterior negativo"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El stock anterior no puede ser negativo'):
            mov = MovimientoStock(
                tipo='compra',
                producto_id=producto.id,
                usuario_id=usuario.id,
                cantidad=10,
                stock_anterior=-5,
                stock_nuevo=5
            )
            db.session.add(mov)
            db.session.commit()


def test_validar_stock_nuevo_negativo(app, producto, usuario):
    """Test de validación de stock nuevo negativo"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El stock nuevo no puede ser negativo'):
            mov = MovimientoStock(
                tipo='venta',
                producto_id=producto.id,
                usuario_id=usuario.id,
                cantidad=-110,
                stock_anterior=100,
                stock_nuevo=-10
            )
            db.session.add(mov)
            db.session.commit()


def test_validar_consistencia_stock(app, producto, usuario):
    """Test de validación de consistencia de stock"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=140  # Debería ser 150
        )

        with pytest.raises(ValueError, match='Inconsistencia de stock'):
            mov.validar()


def test_validar_venta_sin_venta_id(app, producto, usuario):
    """Test de validación de venta sin venta_id"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        with pytest.raises(ValueError, match='deben tener venta_id'):
            mov.validar()


def test_validar_venta_con_venta_id(app, producto, usuario, venta):
    """Test de validación exitosa de venta con venta_id"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=venta.id,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        # No debe lanzar excepción
        mov.validar()
        assert True


# === TESTS DE PROPIEDADES CALCULADAS ===

def test_propiedad_es_ingreso(app, producto, usuario):
    """Test de propiedad es_ingreso"""
    with app.app_context():
        from app import db

        mov_ingreso = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        mov_salida = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        assert mov_ingreso.es_ingreso is True
        assert mov_salida.es_ingreso is False


def test_propiedad_es_salida(app, producto, usuario):
    """Test de propiedad es_salida"""
    with app.app_context():
        from app import db

        mov_ingreso = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        mov_salida = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        assert mov_ingreso.es_salida is False
        assert mov_salida.es_salida is True


def test_propiedad_cantidad_absoluta(app, producto, usuario):
    """Test de propiedad cantidad_absoluta"""
    with app.app_context():
        from app import db

        mov_positivo = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        mov_negativo = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-25,
            stock_anterior=100,
            stock_nuevo=75
        )

        assert mov_positivo.cantidad_absoluta == 50
        assert mov_negativo.cantidad_absoluta == 25


def test_propiedad_diferencia(app, producto, usuario):
    """Test de propiedad diferencia"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        assert mov.diferencia == 50


def test_propiedad_dias_desde_movimiento(app, producto, usuario):
    """Test de propiedad dias_desde_movimiento"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        db.session.add(mov)
        db.session.commit()

        # Movimiento recién creado, debería ser 0 días
        assert mov.dias_desde_movimiento == 0


# === TESTS DE MÉTODOS DE CLASE (QUERIES) ===

def test_por_producto(app, producto, usuario):
    """Test de búsqueda por producto"""
    with app.app_context():
        from app import db

        # Crear varios movimientos del mismo producto
        mov1 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        mov2 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=50,
            stock_nuevo=45
        )

        db.session.add_all([mov1, mov2])
        db.session.commit()

        movimientos = MovimientoStock.por_producto(producto.id)

        assert len(movimientos) == 2
        # Verificar que están ordenados por fecha descendente
        assert movimientos[0].id == mov2.id


def test_por_producto_con_fechas(app, producto, usuario):
    """Test de búsqueda por producto con rango de fechas"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        db.session.add(mov)
        db.session.commit()

        # Usar fecha UTC para coincidir con created_at
        hoy = datetime.now(timezone.utc).date()
        movimientos = MovimientoStock.por_producto(producto.id, hoy, hoy)

        assert len(movimientos) == 1


def test_por_lote(app, producto, lote, usuario):
    """Test de búsqueda por lote"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            lote_id=lote.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        db.session.add(mov)
        db.session.commit()

        movimientos = MovimientoStock.por_lote(lote.id)

        assert len(movimientos) == 1
        assert movimientos[0].lote_id == lote.id


def test_por_usuario(app, producto, usuario):
    """Test de búsqueda por usuario"""
    with app.app_context():
        from app import db

        mov1 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        mov2 = MovimientoStock(
            tipo='ajuste',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=5,
            stock_anterior=50,
            stock_nuevo=55
        )

        db.session.add_all([mov1, mov2])
        db.session.commit()

        movimientos = MovimientoStock.por_usuario(usuario.id)

        assert len(movimientos) == 2


def test_por_tipo(app, producto, usuario):
    """Test de búsqueda por tipo de movimiento"""
    with app.app_context():
        from app import db

        mov1 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        mov2 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=30,
            stock_anterior=50,
            stock_nuevo=80
        )

        mov3 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=80,
            stock_nuevo=75
        )

        db.session.add_all([mov1, mov2, mov3])
        db.session.commit()

        compras = MovimientoStock.por_tipo('compra')
        ventas = MovimientoStock.por_tipo('venta')

        assert len(compras) == 2
        assert len(ventas) == 1


def test_ingresos(app, producto, usuario):
    """Test de búsqueda de solo ingresos"""
    with app.app_context():
        from app import db

        mov1 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        mov2 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=50,
            stock_nuevo=45
        )

        mov3 = MovimientoStock(
            tipo='devolucion',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=2,
            stock_anterior=45,
            stock_nuevo=47
        )

        db.session.add_all([mov1, mov2, mov3])
        db.session.commit()

        ingresos = MovimientoStock.ingresos()

        assert len(ingresos) == 2
        assert all(mov.es_ingreso for mov in ingresos)


def test_salidas(app, producto, usuario):
    """Test de búsqueda de solo salidas"""
    with app.app_context():
        from app import db

        mov1 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        mov2 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=50,
            stock_nuevo=45
        )

        mov3 = MovimientoStock(
            tipo='merma',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=-3,
            stock_anterior=45,
            stock_nuevo=42
        )

        db.session.add_all([mov1, mov2, mov3])
        db.session.commit()

        salidas = MovimientoStock.salidas()

        assert len(salidas) == 2
        assert all(mov.es_salida for mov in salidas)


def test_del_dia(app, producto, usuario):
    """Test de búsqueda de movimientos del día"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        db.session.add(mov)
        db.session.commit()

        movimientos_hoy = MovimientoStock.del_dia()

        assert len(movimientos_hoy) == 1
        assert movimientos_hoy[0].id == mov.id


def test_ultimos_movimientos(app, producto, usuario):
    """Test de búsqueda de últimos movimientos"""
    with app.app_context():
        from app import db

        # Crear 5 movimientos
        for i in range(5):
            mov = MovimientoStock(
                tipo='compra',
                producto_id=producto.id,
                usuario_id=usuario.id,
                cantidad=10,
                stock_anterior=i * 10,
                stock_nuevo=(i + 1) * 10
            )
            db.session.add(mov)

        db.session.commit()

        ultimos_3 = MovimientoStock.ultimos_movimientos(limite=3)

        assert len(ultimos_3) == 3


def test_movimientos_por_venta(app, producto, usuario, venta):
    """Test de búsqueda de movimientos por venta"""
    with app.app_context():
        from app import db

        mov1 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=venta.id,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        mov2 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=venta.id,
            cantidad=-3,
            stock_anterior=95,
            stock_nuevo=92
        )

        db.session.add_all([mov1, mov2])
        db.session.commit()

        movimientos = MovimientoStock.movimientos_por_venta(venta.id)

        assert len(movimientos) == 2


def test_ventas_producto(app, producto, usuario, venta):
    """Test de búsqueda de ventas de un producto"""
    with app.app_context():
        from app import db

        mov_venta = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=venta.id,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        mov_compra = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=95,
            stock_nuevo=145
        )

        db.session.add_all([mov_venta, mov_compra])
        db.session.commit()

        ventas = MovimientoStock.ventas_producto(producto.id)

        assert len(ventas) == 1
        assert ventas[0].tipo == 'venta'


def test_ajustes_inventario(app, producto, usuario):
    """Test de búsqueda de ajustes de inventario"""
    with app.app_context():
        from app import db

        mov_ajuste1 = MovimientoStock(
            tipo='ajuste',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=5,
            stock_anterior=100,
            stock_nuevo=105,
            motivo='Corrección de inventario'
        )

        mov_ajuste2 = MovimientoStock(
            tipo='ajuste',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=-3,
            stock_anterior=105,
            stock_nuevo=102,
            motivo='Ajuste por diferencia'
        )

        mov_compra = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=102,
            stock_nuevo=152
        )

        db.session.add_all([mov_ajuste1, mov_ajuste2, mov_compra])
        db.session.commit()

        ajustes = MovimientoStock.ajustes_inventario()

        assert len(ajustes) == 2
        assert all(mov.tipo == 'ajuste' for mov in ajustes)


def test_historial_completo_producto(app, producto, usuario):
    """Test de búsqueda de historial completo de un producto"""
    with app.app_context():
        from app import db

        mov1 = MovimientoStock(
            tipo='ingreso_inicial',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=100,
            stock_anterior=0,
            stock_nuevo=100
        )

        mov2 = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        mov3 = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=95,
            stock_nuevo=145
        )

        db.session.add_all([mov1, mov2, mov3])
        db.session.commit()

        historial = MovimientoStock.historial_completo_producto(producto.id)

        assert len(historial) == 3
        # Verificar que están ordenados por fecha ascendente (primero el más antiguo)
        assert historial[0].id == mov1.id
        assert historial[1].id == mov2.id
        assert historial[2].id == mov3.id


# === TESTS DE RELACIONES ===

def test_relacion_producto(app, producto, usuario):
    """Test de relación con producto"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.producto is not None
        assert mov.producto.nombre == 'Producto Test Stock'


def test_relacion_usuario(app, producto, usuario):
    """Test de relación con usuario"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.usuario is not None
        assert mov.usuario.username == 'stock_admin'


def test_relacion_lote(app, producto, lote, usuario):
    """Test de relación con lote"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            lote_id=lote.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=0,
            stock_nuevo=50
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.lote is not None
        assert mov.lote.codigo_lote == 'LOTE-TEST-001'


def test_relacion_venta(app, producto, usuario, venta):
    """Test de relación con venta"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=venta.id,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        db.session.add(mov)
        db.session.commit()

        assert mov.venta is not None
        assert mov.venta.metodo_pago == 'efectivo'


# === TESTS DE SERIALIZACIÓN ===

def test_to_dict_basico(app, producto, usuario):
    """Test de serialización to_dict básica"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150,
            motivo='Compra de mercadería',
            referencia='FACT-001'
        )

        db.session.add(mov)
        db.session.commit()

        data = mov.to_dict()

        assert data['tipo'] == 'compra'
        assert data['cantidad'] == 50
        assert data['stock_anterior'] == 100
        assert data['stock_nuevo'] == 150
        assert data['motivo'] == 'Compra de mercadería'
        assert data['referencia'] == 'FACT-001'
        assert data['es_ingreso'] is True
        assert data['es_salida'] is False
        assert data['cantidad_absoluta'] == 50
        assert data['diferencia'] == 50


def test_to_dict_con_relaciones(app, producto, usuario):
    """Test de serialización to_dict con relaciones"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        db.session.add(mov)
        db.session.commit()

        data = mov.to_dict(include_relations=True)

        assert 'producto' in data
        assert data['producto']['nombre'] == 'Producto Test Stock'
        assert 'usuario' in data
        assert data['usuario']['username'] == 'stock_admin'


# === TESTS DE REPRESENTACIONES ===

def test_repr(app, producto, usuario):
    """Test de representación __repr__"""
    with app.app_context():
        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        repr_str = repr(mov)

        assert 'MovimientoStock' in repr_str
        assert 'compra' in repr_str
        assert str(producto.id) in repr_str
        assert '50' in repr_str


def test_str_ingreso(app, producto, usuario):
    """Test de representación __str__ para ingreso"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='compra',
            producto_id=producto.id,
            usuario_id=usuario.id,
            cantidad=50,
            stock_anterior=100,
            stock_nuevo=150
        )

        db.session.add(mov)
        db.session.commit()

        str_repr = str(mov)

        assert 'COMPRA' in str_repr
        assert '+50' in str_repr
        assert '100 → 150' in str_repr


def test_str_salida(app, producto, usuario):
    """Test de representación __str__ para salida"""
    with app.app_context():
        from app import db

        mov = MovimientoStock(
            tipo='venta',
            producto_id=producto.id,
            usuario_id=usuario.id,
            venta_id=1,
            cantidad=-5,
            stock_anterior=100,
            stock_nuevo=95
        )

        db.session.add(mov)
        db.session.commit()

        str_repr = str(mov)

        assert 'VENTA' in str_repr
        assert '-5' in str_repr
        assert '100 → 95' in str_repr
