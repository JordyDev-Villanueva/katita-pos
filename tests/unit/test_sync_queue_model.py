"""
Tests para el modelo SyncQueue
"""

import pytest
import json
from datetime import datetime, timezone, timedelta
from app.models import SyncQueue


# === TESTS DE CREACIÓN ===

def test_crear_sync_insert(app):
    """Test de creación de registro de sincronización tipo insert"""
    with app.app_context():
        from app import db

        data = {'nombre': 'Producto Test', 'precio': 15.50}

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=123,
            data=json.dumps(data)
        )

        db.session.add(sync)
        db.session.commit()

        assert sync.id is not None
        assert sync.tabla == 'products'
        assert sync.operacion == 'insert'
        assert sync.registro_id == 123
        assert sync.procesado is False
        assert sync.intentos == 0
        assert sync.max_intentos == 5


def test_crear_sync_update(app):
    """Test de creación de registro tipo update"""
    with app.app_context():
        from app import db

        data = {'stock': 100}

        sync = SyncQueue(
            tabla='products',
            operacion='update',
            registro_id=456,
            data=json.dumps(data)
        )

        db.session.add(sync)
        db.session.commit()

        assert sync.id is not None
        assert sync.operacion == 'update'


def test_crear_sync_delete(app):
    """Test de creación de registro tipo delete"""
    with app.app_context():
        from app import db

        data = {'id': 789}

        sync = SyncQueue(
            tabla='ventas',
            operacion='delete',
            registro_id=789,
            data=json.dumps(data)
        )

        db.session.add(sync)
        db.session.commit()

        assert sync.id is not None
        assert sync.operacion == 'delete'


def test_valores_por_defecto(app):
    """Test de valores por defecto"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='lotes',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'})
        )

        db.session.add(sync)
        db.session.commit()

        assert sync.intentos == 0
        assert sync.max_intentos == 5
        assert sync.procesado is False
        assert sync.error_mensaje is None
        assert sync.procesado_at is None
        assert sync.created_at is not None


# === TESTS DE VALIDACIONES ===

def test_validar_tabla_vacia(app):
    """Test de validación de tabla vacía"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='La tabla no puede estar vacía'):
            sync = SyncQueue(
                tabla='',
                operacion='insert',
                registro_id=1,
                data=json.dumps({'test': 'data'})
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_operacion_invalida(app):
    """Test de validación de operación inválida"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='La operación debe ser una de'):
            sync = SyncQueue(
                tabla='products',
                operacion='invalid',
                registro_id=1,
                data=json.dumps({'test': 'data'})
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_registro_id_cero(app):
    """Test de validación de registro_id cero"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El registro_id debe ser mayor a 0'):
            sync = SyncQueue(
                tabla='products',
                operacion='insert',
                registro_id=0,
                data=json.dumps({'test': 'data'})
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_registro_id_negativo(app):
    """Test de validación de registro_id negativo"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El registro_id debe ser mayor a 0'):
            sync = SyncQueue(
                tabla='products',
                operacion='insert',
                registro_id=-5,
                data=json.dumps({'test': 'data'})
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_data_vacia(app):
    """Test de validación de data vacía"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El campo data no puede estar vacío'):
            sync = SyncQueue(
                tabla='products',
                operacion='insert',
                registro_id=1,
                data=''
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_data_json_invalido(app):
    """Test de validación de JSON inválido"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El campo data debe ser JSON válido'):
            sync = SyncQueue(
                tabla='products',
                operacion='insert',
                registro_id=1,
                data='esto no es json válido'
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_intentos_negativo(app):
    """Test de validación de intentos negativos"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='Los intentos no pueden ser negativos'):
            sync = SyncQueue(
                tabla='products',
                operacion='insert',
                registro_id=1,
                data=json.dumps({'test': 'data'}),
                intentos=-1
            )
            db.session.add(sync)
            db.session.commit()


def test_validar_max_intentos_cero(app):
    """Test de validación de max_intentos cero"""
    with app.app_context():
        from app import db

        with pytest.raises(ValueError, match='El max_intentos debe ser mayor a 0'):
            sync = SyncQueue(
                tabla='products',
                operacion='insert',
                registro_id=1,
                data=json.dumps({'test': 'data'}),
                max_intentos=0
            )
            db.session.add(sync)
            db.session.commit()


# === TESTS DE PROPIEDADES CALCULADAS ===

def test_propiedad_puede_reintentar(app):
    """Test de propiedad puede_reintentar"""
    with app.app_context():
        from app import db

        # Caso 1: Puede reintentar (0 < 5)
        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'}),
            intentos=0,
            max_intentos=5
        )

        # Caso 2: No puede reintentar (5 >= 5)
        sync2 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'test': 'data'}),
            intentos=5,
            max_intentos=5
        )

        assert sync1.puede_reintentar is True
        assert sync2.puede_reintentar is False


def test_propiedad_esta_pendiente(app):
    """Test de propiedad esta_pendiente"""
    with app.app_context():
        from app import db

        sync_pendiente = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'}),
            procesado=False
        )

        sync_procesado = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'test': 'data'}),
            procesado=True
        )

        assert sync_pendiente.esta_pendiente is True
        assert sync_procesado.esta_pendiente is False


def test_propiedad_ha_fallado_definitivamente(app):
    """Test de propiedad ha_fallado_definitivamente"""
    with app.app_context():
        from app import db

        # Fallido definitivamente: intentos >= max_intentos y no procesado
        sync_fallido = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'}),
            intentos=5,
            max_intentos=5,
            procesado=False
        )

        # No fallido: aún puede reintentar
        sync_ok = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'test': 'data'}),
            intentos=2,
            max_intentos=5,
            procesado=False
        )

        # Procesado exitosamente (no cuenta como fallido)
        sync_procesado = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=3,
            data=json.dumps({'test': 'data'}),
            intentos=5,
            max_intentos=5,
            procesado=True
        )

        assert sync_fallido.ha_fallado_definitivamente is True
        assert sync_ok.ha_fallado_definitivamente is False
        assert sync_procesado.ha_fallado_definitivamente is False


def test_propiedad_tiempo_en_cola(app):
    """Test de propiedad tiempo_en_cola"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'})
        )

        db.session.add(sync)
        db.session.commit()

        # Recién creado, debería ser 0 minutos (o muy cercano)
        assert sync.tiempo_en_cola >= 0
        assert sync.tiempo_en_cola < 2  # Menos de 2 minutos


def test_propiedad_prioridad(app):
    """Test de propiedad prioridad"""
    with app.app_context():
        from app import db

        # Prioridad baja (recién creado)
        sync_baja = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'})
        )

        db.session.add(sync_baja)
        db.session.commit()

        assert sync_baja.prioridad == 'baja'


# === TESTS DE MÉTODOS DE INSTANCIA ===

def test_marcar_procesado(app):
    """Test de método marcar_procesado"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'})
        )

        db.session.add(sync)
        db.session.commit()

        assert sync.procesado is False
        assert sync.procesado_at is None

        sync.marcar_procesado()
        db.session.commit()

        assert sync.procesado is True
        assert sync.procesado_at is not None


def test_registrar_error(app):
    """Test de método registrar_error"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'})
        )

        db.session.add(sync)
        db.session.commit()

        assert sync.intentos == 0
        assert sync.error_mensaje is None

        sync.registrar_error('Error de conexión')
        db.session.commit()

        assert sync.intentos == 1
        assert sync.error_mensaje == 'Error de conexión'

        # Segundo error
        sync.registrar_error('Error de timeout')
        db.session.commit()

        assert sync.intentos == 2
        assert sync.error_mensaje == 'Error de timeout'


def test_puede_procesar(app):
    """Test de método puede_procesar"""
    with app.app_context():
        from app import db

        # Puede procesar: pendiente y con reintentos disponibles
        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'test': 'data'}),
            intentos=2,
            max_intentos=5,
            procesado=False
        )

        # No puede procesar: ya procesado
        sync2 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'test': 'data'}),
            intentos=2,
            max_intentos=5,
            procesado=True
        )

        # No puede procesar: sin reintentos
        sync3 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=3,
            data=json.dumps({'test': 'data'}),
            intentos=5,
            max_intentos=5,
            procesado=False
        )

        assert sync1.puede_procesar() is True
        assert sync2.puede_procesar() is False
        assert sync3.puede_procesar() is False


def test_get_data(app):
    """Test de método get_data"""
    with app.app_context():
        from app import db

        data_original = {'nombre': 'Producto Test', 'precio': 15.50, 'stock': 100}

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps(data_original)
        )

        db.session.add(sync)
        db.session.commit()

        data_parseada = sync.get_data()

        assert data_parseada == data_original
        assert isinstance(data_parseada, dict)


def test_to_dict(app):
    """Test de método to_dict"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=123,
            data=json.dumps({'nombre': 'Test'})
        )

        db.session.add(sync)
        db.session.commit()

        data = sync.to_dict()

        assert data['tabla'] == 'products'
        assert data['operacion'] == 'insert'
        assert data['registro_id'] == 123
        assert data['data'] == {'nombre': 'Test'}
        assert data['intentos'] == 0
        assert data['procesado'] is False
        assert 'puede_reintentar' in data
        assert 'prioridad' in data


# === TESTS DE MÉTODOS DE CLASE (QUERIES) ===

def test_pendientes(app):
    """Test de método pendientes"""
    with app.app_context():
        from app import db

        # Crear varios registros
        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1}),
            procesado=False
        )

        sync2 = SyncQueue(
            tabla='products',
            operacion='update',
            registro_id=2,
            data=json.dumps({'id': 2}),
            procesado=True
        )

        sync3 = SyncQueue(
            tabla='ventas',
            operacion='insert',
            registro_id=3,
            data=json.dumps({'id': 3}),
            procesado=False
        )

        db.session.add_all([sync1, sync2, sync3])
        db.session.commit()

        pendientes = SyncQueue.pendientes()

        assert len(pendientes) == 2
        assert all(s.procesado is False for s in pendientes)


def test_por_tabla(app):
    """Test de método por_tabla"""
    with app.app_context():
        from app import db

        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1})
        )

        sync2 = SyncQueue(
            tabla='ventas',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'id': 2})
        )

        sync3 = SyncQueue(
            tabla='products',
            operacion='update',
            registro_id=3,
            data=json.dumps({'id': 3})
        )

        db.session.add_all([sync1, sync2, sync3])
        db.session.commit()

        products = SyncQueue.por_tabla('products')
        ventas = SyncQueue.por_tabla('ventas')

        assert len(products) == 2
        assert len(ventas) == 1
        assert all(s.tabla == 'products' for s in products)


def test_por_operacion(app):
    """Test de método por_operacion"""
    with app.app_context():
        from app import db

        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1})
        )

        sync2 = SyncQueue(
            tabla='products',
            operacion='update',
            registro_id=2,
            data=json.dumps({'id': 2})
        )

        sync3 = SyncQueue(
            tabla='ventas',
            operacion='insert',
            registro_id=3,
            data=json.dumps({'id': 3})
        )

        db.session.add_all([sync1, sync2, sync3])
        db.session.commit()

        inserts = SyncQueue.por_operacion('insert')
        updates = SyncQueue.por_operacion('update')

        assert len(inserts) == 2
        assert len(updates) == 1
        assert all(s.operacion == 'insert' for s in inserts)


def test_fallidos(app):
    """Test de método fallidos"""
    with app.app_context():
        from app import db

        # Fallido definitivamente
        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1}),
            intentos=5,
            max_intentos=5,
            procesado=False
        )

        # Aún puede reintentar
        sync2 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'id': 2}),
            intentos=2,
            max_intentos=5,
            procesado=False
        )

        # Procesado exitosamente (no es fallido)
        sync3 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=3,
            data=json.dumps({'id': 3}),
            intentos=5,
            max_intentos=5,
            procesado=True
        )

        db.session.add_all([sync1, sync2, sync3])
        db.session.commit()

        fallidos = SyncQueue.fallidos()

        assert len(fallidos) == 1
        assert fallidos[0].id == sync1.id


def test_prioritarios(app):
    """Test de método prioritarios"""
    with app.app_context():
        from app import db

        # Crear registro antiguo (prioritario)
        hace_90_min = datetime.now(timezone.utc) - timedelta(minutes=90)
        sync_antiguo = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1}),
            procesado=False
        )
        db.session.add(sync_antiguo)
        db.session.flush()

        # Forzar created_at antiguo
        sync_antiguo.created_at = hace_90_min
        db.session.commit()

        # Registro reciente (no prioritario)
        sync_reciente = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'id': 2}),
            procesado=False
        )
        db.session.add(sync_reciente)
        db.session.commit()

        prioritarios = SyncQueue.prioritarios()

        assert len(prioritarios) >= 1
        assert sync_antiguo.id in [s.id for s in prioritarios]


def test_procesar_siguiente(app):
    """Test de método procesar_siguiente"""
    with app.app_context():
        from app import db

        # Crear registros en orden
        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1}),
            procesado=False,
            intentos=0
        )

        sync2 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'id': 2}),
            procesado=False,
            intentos=0
        )

        db.session.add(sync1)
        db.session.commit()

        # Pequeña pausa para asegurar orden
        import time
        time.sleep(0.01)

        db.session.add(sync2)
        db.session.commit()

        siguiente = SyncQueue.procesar_siguiente()

        # Debe retornar el más antiguo (sync1)
        assert siguiente is not None
        assert siguiente.id == sync1.id


def test_limpiar_procesados(app):
    """Test de método limpiar_procesados"""
    with app.app_context():
        from app import db

        # Crear registro procesado antiguo (hace 40 días)
        hace_40_dias = datetime.now(timezone.utc) - timedelta(days=40)

        sync_antiguo = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1}),
            procesado=True
        )
        db.session.add(sync_antiguo)
        db.session.flush()

        sync_antiguo.procesado_at = hace_40_dias
        db.session.commit()

        # Registro procesado reciente (hace 10 días)
        hace_10_dias = datetime.now(timezone.utc) - timedelta(days=10)

        sync_reciente = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=2,
            data=json.dumps({'id': 2}),
            procesado=True
        )
        db.session.add(sync_reciente)
        db.session.flush()

        sync_reciente.procesado_at = hace_10_dias
        db.session.commit()

        # Registro pendiente (no se elimina)
        sync_pendiente = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=3,
            data=json.dumps({'id': 3}),
            procesado=False
        )
        db.session.add(sync_pendiente)
        db.session.commit()

        # Limpiar procesados con más de 30 días
        eliminados = SyncQueue.limpiar_procesados(dias=30)

        assert eliminados == 1

        # Verificar que solo queden 2 registros
        todos = SyncQueue.query.all()
        assert len(todos) == 2


def test_estadisticas(app):
    """Test de método estadisticas"""
    with app.app_context():
        from app import db

        # Crear varios registros
        sync1 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=1,
            data=json.dumps({'id': 1}),
            procesado=False
        )

        sync2 = SyncQueue(
            tabla='products',
            operacion='update',
            registro_id=2,
            data=json.dumps({'id': 2}),
            procesado=True
        )

        sync3 = SyncQueue(
            tabla='ventas',
            operacion='delete',
            registro_id=3,
            data=json.dumps({'id': 3}),
            procesado=False
        )

        sync4 = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=4,
            data=json.dumps({'id': 4}),
            procesado=False,
            intentos=5,
            max_intentos=5
        )

        db.session.add_all([sync1, sync2, sync3, sync4])
        db.session.commit()

        stats = SyncQueue.estadisticas()

        assert stats['total'] == 4
        assert stats['pendientes'] == 3
        assert stats['procesados'] == 1
        assert stats['fallidos'] == 1
        assert stats['por_operacion']['insert'] == 2
        assert stats['por_operacion']['update'] == 0  # El update está procesado
        assert stats['por_operacion']['delete'] == 1


# === TESTS DE REPRESENTACIONES ===

def test_repr(app):
    """Test de representación __repr__"""
    with app.app_context():
        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=123,
            data=json.dumps({'test': 'data'})
        )

        repr_str = repr(sync)

        assert 'SyncQueue' in repr_str
        assert 'products' in repr_str
        assert 'insert' in repr_str
        assert '123' in repr_str


def test_str_pendiente(app):
    """Test de representación __str__ para registro pendiente"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='ventas',
            operacion='update',
            registro_id=456,
            data=json.dumps({'test': 'data'}),
            procesado=False
        )

        db.session.add(sync)
        db.session.commit()

        str_repr = str(sync)

        assert 'UPDATE' in str_repr
        assert 'ventas' in str_repr
        assert '456' in str_repr
        assert 'PENDIENTE' in str_repr


def test_str_procesado(app):
    """Test de representación __str__ para registro procesado"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='products',
            operacion='insert',
            registro_id=789,
            data=json.dumps({'test': 'data'}),
            procesado=True
        )

        db.session.add(sync)
        db.session.commit()

        str_repr = str(sync)

        assert 'INSERT' in str_repr
        assert 'products' in str_repr
        assert '789' in str_repr
        assert 'PROCESADO' in str_repr


def test_str_fallido(app):
    """Test de representación __str__ para registro fallido"""
    with app.app_context():
        from app import db

        sync = SyncQueue(
            tabla='lotes',
            operacion='delete',
            registro_id=999,
            data=json.dumps({'test': 'data'}),
            procesado=False,
            intentos=5,
            max_intentos=5
        )

        db.session.add(sync)
        db.session.commit()

        str_repr = str(sync)

        assert 'DELETE' in str_repr
        assert 'lotes' in str_repr
        assert '999' in str_repr
        assert 'FALLIDO' in str_repr
