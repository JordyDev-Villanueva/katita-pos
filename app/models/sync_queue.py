"""
Modelo SyncQueue para KATITA-POS

Define la cola de sincronización para operaciones offline-first.
Gestiona la cola de cambios pendientes de sincronizar con el servidor.
Permite reintentos automáticos y limpieza de registros antiguos.
"""

import json
from datetime import datetime, timezone, timedelta
from sqlalchemy import (
    Index, CheckConstraint, String, Integer,
    Text, Boolean, DateTime
)
from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property
from app import db

# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))


class SyncQueue(db.Model):
    """
    Modelo para cola de sincronización del sistema KATITA-POS

    Gestiona la cola de cambios pendientes cuando se trabaja offline.
    Permite reintentos automáticos y tracking de errores.

    Operaciones:
    - insert: Inserción de nuevo registro
    - update: Actualización de registro existente
    - delete: Eliminación de registro

    IMPORTANTE: Este modelo NO sincroniza datos (eso lo hace un servicio).
    Solo GESTIONA LA COLA de sincronización.
    """

    __tablename__ = 'sync_queue'

    # === CAMPOS ===

    id = db.Column(Integer, primary_key=True, autoincrement=True)

    # Información del registro
    tabla = db.Column(String(50), nullable=False)
    operacion = db.Column(String(20), nullable=False)
    registro_id = db.Column(Integer, nullable=False)

    # Datos
    data = db.Column(Text, nullable=False)  # JSON con los datos del registro

    # Control de sincronización
    intentos = db.Column(Integer, default=0, nullable=False)
    max_intentos = db.Column(Integer, default=5, nullable=False)
    procesado = db.Column(Boolean, default=False, nullable=False)
    error_mensaje = db.Column(Text, nullable=True)

    # Timestamps
    created_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        nullable=False
    )
    procesado_at = db.Column(DateTime, nullable=True)
    updated_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        onupdate=lambda: datetime.now(PERU_TZ),
        nullable=False
    )

    # === CONSTRAINTS ===

    __table_args__ = (
        # CheckConstraints para validaciones a nivel de BD
        CheckConstraint(
            "operacion IN ('insert', 'update', 'delete')",
            name='check_operacion_valida'
        ),
        CheckConstraint('intentos >= 0', name='check_intentos_no_negativo'),
        CheckConstraint('max_intentos > 0', name='check_max_intentos_positivo'),
        CheckConstraint('registro_id > 0', name='check_registro_id_positivo'),
        # Índices individuales para búsquedas simples
        Index('ix_sync_tabla', 'tabla'),
        Index('ix_sync_operacion', 'operacion'),
        Index('ix_sync_registro_id', 'registro_id'),
        Index('ix_sync_procesado', 'procesado'),
        Index('ix_sync_created_at', 'created_at'),
        # Índices compuestos para queries complejas
        Index('ix_sync_tabla_registro', 'tabla', 'registro_id'),
        Index('ix_sync_procesado_created', 'procesado', 'created_at'),
        Index('ix_sync_tabla_operacion', 'tabla', 'operacion'),
    )

    # === CONSTRUCTOR ===

    def __init__(self, **kwargs):
        """
        Constructor del modelo SyncQueue

        Args:
            **kwargs: Argumentos del registro de sincronización
        """
        super(SyncQueue, self).__init__(**kwargs)

    # === VALIDACIONES AUTOMÁTICAS ===

    @validates('tabla')
    def validate_tabla(self, key, tabla):
        """Valida que la tabla no esté vacía"""
        if not tabla or not tabla.strip():
            raise ValueError('La tabla no puede estar vacía')

        return tabla.strip()

    @validates('operacion')
    def validate_operacion(self, key, operacion):
        """Valida que la operación sea válida"""
        operaciones_validas = ['insert', 'update', 'delete']

        if not operacion or operacion not in operaciones_validas:
            raise ValueError(f'La operación debe ser una de: {", ".join(operaciones_validas)}')

        return operacion

    @validates('registro_id')
    def validate_registro_id(self, key, registro_id):
        """Valida que el registro_id sea positivo"""
        if registro_id is not None and registro_id <= 0:
            raise ValueError('El registro_id debe ser mayor a 0')

        return registro_id

    @validates('data')
    def validate_data(self, key, data):
        """Valida que data sea JSON válido"""
        if not data:
            raise ValueError('El campo data no puede estar vacío')

        # Intentar parsear el JSON para validar
        try:
            json.loads(data)
        except (json.JSONDecodeError, TypeError):
            raise ValueError('El campo data debe ser JSON válido')

        return data

    @validates('intentos')
    def validate_intentos(self, key, intentos):
        """Valida que los intentos sean no negativos"""
        if intentos is not None and intentos < 0:
            raise ValueError('Los intentos no pueden ser negativos')

        return intentos

    @validates('max_intentos')
    def validate_max_intentos(self, key, max_intentos):
        """Valida que max_intentos sea positivo"""
        if max_intentos is not None and max_intentos <= 0:
            raise ValueError('El max_intentos debe ser mayor a 0')

        return max_intentos

    # === PROPIEDADES CALCULADAS ===

    @hybrid_property
    def puede_reintentar(self):
        """Verifica si aún puede reintentar la sincronización"""
        if self.intentos is None or self.max_intentos is None:
            return False
        return self.intentos < self.max_intentos

    @hybrid_property
    def esta_pendiente(self):
        """Verifica si el registro está pendiente de sincronización"""
        return not self.procesado

    @hybrid_property
    def ha_fallado_definitivamente(self):
        """Verifica si ha fallado definitivamente (sin más reintentos)"""
        if self.intentos is None or self.max_intentos is None:
            return False
        return self.intentos >= self.max_intentos and not self.procesado

    @hybrid_property
    def tiempo_en_cola(self):
        """Retorna el tiempo en cola en minutos"""
        if not self.created_at:
            return 0

        # Siempre usar UTC para consistencia
        hoy = datetime.now(PERU_TZ)

        # Si created_at es timezone-aware, usar directamente
        # Si es naive (SQLite), asumir que está en UTC
        if self.created_at.tzinfo is not None:
            delta = hoy - self.created_at
        else:
            # SQLite guarda sin timezone, pero sabemos que es UTC
            created_utc = self.created_at.replace(tzinfo=timezone.utc)
            delta = hoy - created_utc

        return int(delta.total_seconds() / 60)

    @hybrid_property
    def prioridad(self):
        """Retorna la prioridad basada en el tiempo en cola"""
        minutos = self.tiempo_en_cola

        if minutos > 120:  # Más de 2 horas
            return 'alta'
        elif minutos > 60:  # Más de 1 hora
            return 'media'
        else:
            return 'baja'

    # === MÉTODOS DE INSTANCIA ===

    def marcar_procesado(self):
        """
        Marca el registro como procesado

        Sets:
            procesado = True
            procesado_at = now (UTC)
        """
        self.procesado = True
        self.procesado_at = datetime.now(PERU_TZ)

    def registrar_error(self, mensaje):
        """
        Registra un error de sincronización

        Args:
            mensaje (str): Mensaje de error

        Updates:
            error_mensaje: Guarda el mensaje de error
            intentos: Incrementa en 1
        """
        self.error_mensaje = mensaje
        self.intentos = (self.intentos or 0) + 1

    def puede_procesar(self):
        """
        Verifica si el registro puede ser procesado

        Returns:
            bool: True si puede reintentar y está pendiente
        """
        return self.puede_reintentar and self.esta_pendiente

    def get_data(self):
        """
        Parsea el JSON del campo data

        Returns:
            dict: Datos del registro parseados

        Raises:
            ValueError: Si el JSON no es válido
        """
        try:
            return json.loads(self.data)
        except (json.JSONDecodeError, TypeError) as e:
            raise ValueError(f'Error al parsear data: {str(e)}')

    def to_dict(self):
        """
        Convierte el registro a diccionario

        Returns:
            dict: Diccionario con los datos del registro
        """
        return {
            'id': self.id,
            'tabla': self.tabla,
            'operacion': self.operacion,
            'registro_id': self.registro_id,
            'data': self.get_data(),  # Ya parseado como dict
            'intentos': self.intentos,
            'max_intentos': self.max_intentos,
            'procesado': self.procesado,
            'error_mensaje': self.error_mensaje,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'procesado_at': self.procesado_at.isoformat() if self.procesado_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Propiedades calculadas
            'puede_reintentar': self.puede_reintentar,
            'esta_pendiente': self.esta_pendiente,
            'ha_fallado_definitivamente': self.ha_fallado_definitivamente,
            'tiempo_en_cola': self.tiempo_en_cola,
            'prioridad': self.prioridad,
        }

    # === MÉTODOS DE CLASE (QUERIES) ===

    @classmethod
    def pendientes(cls):
        """
        Retorna registros pendientes de sincronización

        Returns:
            list[SyncQueue]: Lista de registros pendientes ordenados por antigüedad
        """
        return cls.query.filter_by(procesado=False).order_by(cls.created_at.asc()).all()

    @classmethod
    def por_tabla(cls, tabla):
        """
        Retorna registros de una tabla específica

        Args:
            tabla (str): Nombre de la tabla

        Returns:
            list[SyncQueue]: Lista de registros de la tabla
        """
        return cls.query.filter_by(tabla=tabla).order_by(cls.created_at.desc()).all()

    @classmethod
    def por_operacion(cls, operacion):
        """
        Retorna registros por operación

        Args:
            operacion (str): Tipo de operación (insert, update, delete)

        Returns:
            list[SyncQueue]: Lista de registros de la operación
        """
        return cls.query.filter_by(operacion=operacion).order_by(cls.created_at.desc()).all()

    @classmethod
    def fallidos(cls):
        """
        Retorna registros que han fallado definitivamente

        Returns:
            list[SyncQueue]: Lista de registros fallidos sin reintentos disponibles
        """
        return cls.query.filter(
            cls.intentos >= cls.max_intentos,
            cls.procesado == False
        ).order_by(cls.created_at.desc()).all()

    @classmethod
    def prioritarios(cls):
        """
        Retorna registros prioritarios (más de 60 minutos en cola)

        Returns:
            list[SyncQueue]: Lista de registros prioritarios pendientes
        """
        # Calcular el timestamp de hace 60 minutos en UTC
        hace_60_min = datetime.now(PERU_TZ) - timedelta(minutes=60)

        return cls.query.filter(
            cls.procesado == False,
            cls.created_at <= hace_60_min
        ).order_by(cls.created_at.asc()).all()

    @classmethod
    def procesar_siguiente(cls):
        """
        Obtiene el siguiente registro pendiente para procesar

        Prioriza por:
        1. Registros más antiguos primero
        2. Que aún puedan reintentar

        Returns:
            SyncQueue|None: Siguiente registro a procesar o None si no hay pendientes
        """
        return cls.query.filter(
            cls.procesado == False,
            cls.intentos < cls.max_intentos
        ).order_by(cls.created_at.asc()).first()

    @classmethod
    def limpiar_procesados(cls, dias=30):
        """
        Elimina registros procesados antiguos

        Args:
            dias (int): Eliminar procesados con más de N días

        Returns:
            int: Cantidad de registros eliminados
        """
        # Calcular fecha límite en UTC
        fecha_limite = datetime.now(PERU_TZ) - timedelta(days=dias)

        # Buscar registros a eliminar
        registros = cls.query.filter(
            cls.procesado == True,
            cls.procesado_at <= fecha_limite
        ).all()

        cantidad = len(registros)

        # Eliminar registros
        for registro in registros:
            db.session.delete(registro)

        db.session.commit()

        return cantidad

    @classmethod
    def estadisticas(cls):
        """
        Retorna estadísticas de la cola de sincronización

        Returns:
            dict: Diccionario con estadísticas
        """
        total = cls.query.count()
        pendientes = cls.query.filter_by(procesado=False).count()
        procesados = cls.query.filter_by(procesado=True).count()
        fallidos = cls.query.filter(
            cls.intentos >= cls.max_intentos,
            cls.procesado == False
        ).count()

        # Estadísticas por operación
        inserts = cls.query.filter_by(operacion='insert', procesado=False).count()
        updates = cls.query.filter_by(operacion='update', procesado=False).count()
        deletes = cls.query.filter_by(operacion='delete', procesado=False).count()

        # Registros prioritarios
        hace_60_min = datetime.now(PERU_TZ) - timedelta(minutes=60)
        prioritarios = cls.query.filter(
            cls.procesado == False,
            cls.created_at <= hace_60_min
        ).count()

        return {
            'total': total,
            'pendientes': pendientes,
            'procesados': procesados,
            'fallidos': fallidos,
            'prioritarios': prioritarios,
            'por_operacion': {
                'insert': inserts,
                'update': updates,
                'delete': deletes,
            }
        }

    # === REPRESENTACIONES ===

    def __repr__(self):
        return f'<SyncQueue {self.tabla}.{self.operacion} registro_id={self.registro_id}>'

    def __str__(self):
        estado = 'PROCESADO' if self.procesado else 'PENDIENTE'
        if self.ha_fallado_definitivamente:
            estado = 'FALLIDO'
        return f'{self.operacion.upper()} en {self.tabla} (ID {self.registro_id}) - {estado}'
