"""
Modelo MovimientoStock para KATITA-POS

Define el registro de auditoría de todos los movimientos de inventario.
Proporciona trazabilidad completa de cambios de stock.
Permite reconciliación y detección de discrepancias.
"""

from datetime import datetime, timezone, date, timedelta
from sqlalchemy import (
    Index, CheckConstraint, String, Integer,
    DateTime, func
)
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app import db

# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))


class MovimientoStock(db.Model):
    """
    Modelo para movimientos de stock del sistema KATITA-POS

    Registra TODOS los cambios de inventario para auditoría.
    Permite trazabilidad completa: quién, qué, cuándo y por qué.

    Tipos de movimiento:
    - venta: Salida por venta
    - compra: Ingreso por compra
    - ajuste: Ajuste manual
    - devolucion: Devolución de cliente
    - merma: Pérdida (robo, daño, vencimiento)
    - ingreso_inicial: Carga inicial de stock

    IMPORTANTE: Este modelo NO modifica stock directamente.
    Solo REGISTRA lo que pasó.
    """

    __tablename__ = 'movimientos_stock'

    # === CAMPOS ===

    id = db.Column(Integer, primary_key=True, autoincrement=True)

    # Tipo de movimiento
    tipo = db.Column(String(20), nullable=False)

    # Relaciones
    producto_id = db.Column(Integer, db.ForeignKey('products.id'), nullable=False)
    lote_id = db.Column(Integer, db.ForeignKey('lotes.id'), nullable=True)
    usuario_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False)
    venta_id = db.Column(Integer, db.ForeignKey('ventas.id'), nullable=True)

    # Movimiento
    cantidad = db.Column(Integer, nullable=False)  # Positivo = ingreso, Negativo = salida
    stock_anterior = db.Column(Integer, nullable=False)
    stock_nuevo = db.Column(Integer, nullable=False)

    # Información adicional
    motivo = db.Column(String(100), nullable=True)
    referencia = db.Column(String(100), nullable=True)  # Número de documento, código, etc

    # Timestamps
    created_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        nullable=False
    )
    updated_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        onupdate=lambda: datetime.now(PERU_TZ),
        nullable=False
    )

    # === RELACIONES ===

    producto = relationship('Product', backref='movimientos')
    lote = relationship('Lote', backref='movimientos')
    usuario = relationship('User', backref='movimientos')
    venta = relationship('Venta', backref='movimientos')

    # === CONSTRAINTS ===

    __table_args__ = (
        # CheckConstraints para validaciones a nivel de BD
        CheckConstraint('cantidad != 0', name='check_cantidad_no_cero'),
        CheckConstraint('stock_anterior >= 0', name='check_stock_anterior_no_negativo'),
        CheckConstraint('stock_nuevo >= 0', name='check_stock_nuevo_no_negativo'),
        CheckConstraint(
            "tipo IN ('venta', 'compra', 'ajuste', 'devolucion', 'merma', 'ingreso_inicial')",
            name='check_tipo_valido'
        ),
        # Índices individuales para foreign keys y búsquedas simples
        Index('ix_movimiento_producto_id', 'producto_id'),
        Index('ix_movimiento_lote_id', 'lote_id'),
        Index('ix_movimiento_usuario_id', 'usuario_id'),
        Index('ix_movimiento_venta_id', 'venta_id'),
        Index('ix_movimiento_tipo', 'tipo'),
        Index('ix_movimiento_created_at', 'created_at'),
        # Índices compuestos para queries complejas
        Index('ix_movimiento_producto_fecha', 'producto_id', 'created_at'),
        Index('ix_movimiento_tipo_fecha', 'tipo', 'created_at'),
        Index('ix_movimiento_producto_tipo', 'producto_id', 'tipo'),
    )

    # === CONSTRUCTOR ===

    def __init__(self, **kwargs):
        """
        Constructor del modelo MovimientoStock

        Args:
            **kwargs: Argumentos del movimiento
        """
        super(MovimientoStock, self).__init__(**kwargs)

    # === VALIDACIONES AUTOMÁTICAS ===

    @validates('tipo')
    def validate_tipo(self, key, tipo):
        """Valida que el tipo sea válido"""
        tipos_validos = ['venta', 'compra', 'ajuste', 'devolucion', 'merma', 'ingreso_inicial']

        if not tipo or tipo not in tipos_validos:
            raise ValueError(f'El tipo debe ser uno de: {", ".join(tipos_validos)}')

        return tipo

    @validates('cantidad')
    def validate_cantidad(self, key, cantidad):
        """Valida que la cantidad no sea cero"""
        if cantidad is not None and cantidad == 0:
            raise ValueError('La cantidad no puede ser cero')

        return cantidad

    @validates('stock_anterior')
    def validate_stock_anterior(self, key, stock_anterior):
        """Valida que el stock anterior no sea negativo"""
        if stock_anterior is not None and stock_anterior < 0:
            raise ValueError('El stock anterior no puede ser negativo')

        return stock_anterior

    @validates('stock_nuevo')
    def validate_stock_nuevo(self, key, stock_nuevo):
        """Valida que el stock nuevo no sea negativo"""
        if stock_nuevo is not None and stock_nuevo < 0:
            raise ValueError('El stock nuevo no puede ser negativo')

        return stock_nuevo

    # === PROPIEDADES CALCULADAS ===

    @hybrid_property
    def es_ingreso(self):
        """Verifica si el movimiento es un ingreso (cantidad positiva)"""
        return self.cantidad > 0 if self.cantidad else False

    @hybrid_property
    def es_salida(self):
        """Verifica si el movimiento es una salida (cantidad negativa)"""
        return self.cantidad < 0 if self.cantidad else False

    @hybrid_property
    def cantidad_absoluta(self):
        """Retorna el valor absoluto de la cantidad"""
        return abs(self.cantidad) if self.cantidad else 0

    @hybrid_property
    def diferencia(self):
        """Retorna la diferencia entre stock nuevo y anterior"""
        if self.stock_nuevo is not None and self.stock_anterior is not None:
            return self.stock_nuevo - self.stock_anterior
        return 0

    @hybrid_property
    def dias_desde_movimiento(self):
        """Retorna los días transcurridos desde el movimiento"""
        if not self.created_at:
            return 0

        # Siempre usar UTC para consistencia (created_at se guarda en UTC)
        # SQLite no preserva timezone info, pero sabemos que created_at es UTC
        hoy = datetime.now(PERU_TZ).date()

        # Si created_at es timezone-aware, obtener la fecha directamente
        # Si es naive (SQLite), asumimos que está en UTC
        if self.created_at.tzinfo is not None:
            fecha_movimiento = self.created_at.date()
        else:
            # Tratarlo como UTC incluso si es naive
            fecha_movimiento = self.created_at.date()

        delta = hoy - fecha_movimiento
        return delta.days

    # === MÉTODOS DE VALIDACIÓN ===

    def validar(self):
        """
        Valida el movimiento completo

        Verifica:
        - Consistencia de stock (nuevo = anterior + cantidad)
        - Si tipo='venta', debe tener venta_id

        Raises:
            ValueError: Si alguna validación falla
        """
        # Validar consistencia de stock
        stock_esperado = self.stock_anterior + self.cantidad
        if self.stock_nuevo != stock_esperado:
            raise ValueError(
                f'Inconsistencia de stock: stock_nuevo ({self.stock_nuevo}) != '
                f'stock_anterior ({self.stock_anterior}) + cantidad ({self.cantidad}) = {stock_esperado}'
            )

        # Validar que ventas tengan venta_id
        if self.tipo == 'venta' and not self.venta_id:
            raise ValueError('Los movimientos de tipo "venta" deben tener venta_id')

    # === MÉTODOS DE SERIALIZACIÓN ===

    def to_dict(self, include_relations=False):
        """
        Convierte el movimiento a diccionario

        Args:
            include_relations (bool): Si True, incluye datos de relaciones

        Returns:
            dict: Diccionario con los datos del movimiento
        """
        data = {
            'id': self.id,
            'tipo': self.tipo,
            'producto_id': self.producto_id,
            'lote_id': self.lote_id,
            'usuario_id': self.usuario_id,
            'venta_id': self.venta_id,
            'cantidad': self.cantidad,
            'stock_anterior': self.stock_anterior,
            'stock_nuevo': self.stock_nuevo,
            'motivo': self.motivo,
            'referencia': self.referencia,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Propiedades calculadas
            'es_ingreso': self.es_ingreso,
            'es_salida': self.es_salida,
            'cantidad_absoluta': self.cantidad_absoluta,
            'diferencia': self.diferencia,
            'dias_desde_movimiento': self.dias_desde_movimiento,
        }

        if include_relations:
            if self.producto:
                data['producto'] = {
                    'id': self.producto.id,
                    'nombre': self.producto.nombre,
                    'codigo_barras': self.producto.codigo_barras,
                }
            if self.usuario:
                data['usuario'] = {
                    'id': self.usuario.id,
                    'username': self.usuario.username,
                    'nombre_completo': self.usuario.nombre_completo,
                }
            if self.lote:
                data['lote'] = {
                    'id': self.lote.id,
                    'codigo_lote': self.lote.codigo_lote,
                }

        return data

    # === MÉTODOS DE CLASE (QUERIES) ===

    @classmethod
    def por_producto(cls, producto_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna movimientos de un producto

        Args:
            producto_id (int): ID del producto
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de movimientos del producto
        """
        query = cls.query.filter_by(producto_id=producto_id)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at <= fin)

        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def por_lote(cls, lote_id):
        """
        Retorna movimientos de un lote específico

        Args:
            lote_id (int): ID del lote

        Returns:
            list[MovimientoStock]: Lista de movimientos del lote
        """
        return cls.query.filter_by(lote_id=lote_id).order_by(cls.created_at.desc()).all()

    @classmethod
    def por_usuario(cls, usuario_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna movimientos realizados por un usuario

        Args:
            usuario_id (int): ID del usuario
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de movimientos del usuario
        """
        query = cls.query.filter_by(usuario_id=usuario_id)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at <= fin)

        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def por_tipo(cls, tipo, fecha_inicio=None, fecha_fin=None):
        """
        Retorna movimientos por tipo

        Args:
            tipo (str): Tipo de movimiento
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de movimientos del tipo
        """
        query = cls.query.filter_by(tipo=tipo)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at <= fin)

        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def ingresos(cls, fecha_inicio=None, fecha_fin=None):
        """
        Retorna solo ingresos (cantidad positiva)

        Args:
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de ingresos
        """
        query = cls.query.filter(cls.cantidad > 0)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at <= fin)

        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def salidas(cls, fecha_inicio=None, fecha_fin=None):
        """
        Retorna solo salidas (cantidad negativa)

        Args:
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de salidas
        """
        query = cls.query.filter(cls.cantidad < 0)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at <= fin)

        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def del_dia(cls, fecha=None):
        """
        Retorna movimientos del día

        Args:
            fecha (date): Fecha a buscar (default: hoy en UTC)

        Returns:
            list[MovimientoStock]: Lista de movimientos del día
        """
        if fecha is None:
            # Usar la fecha actual en UTC para coincidir con created_at
            fecha = datetime.now(PERU_TZ).date()

        inicio = datetime.combine(fecha, datetime.min.time()).replace(tzinfo=timezone.utc)
        fin = datetime.combine(fecha, datetime.max.time()).replace(tzinfo=timezone.utc)

        return cls.query.filter(
            cls.created_at >= inicio,
            cls.created_at <= fin
        ).order_by(cls.created_at.desc()).all()

    @classmethod
    def ultimos_movimientos(cls, limite=50):
        """
        Retorna los últimos movimientos

        Args:
            limite (int): Cantidad de movimientos a retornar (default: 50)

        Returns:
            list[MovimientoStock]: Lista de últimos movimientos
        """
        return cls.query.order_by(cls.created_at.desc()).limit(limite).all()

    @classmethod
    def movimientos_por_venta(cls, venta_id):
        """
        Retorna movimientos de una venta

        Args:
            venta_id (int): ID de la venta

        Returns:
            list[MovimientoStock]: Lista de movimientos de la venta
        """
        return cls.query.filter_by(venta_id=venta_id).all()

    @classmethod
    def ventas_producto(cls, producto_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna ventas de un producto

        Args:
            producto_id (int): ID del producto
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de ventas del producto
        """
        query = cls.query.filter_by(producto_id=producto_id, tipo='venta')

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time()).replace(tzinfo=timezone.utc)
            query = query.filter(cls.created_at <= fin)

        return query.order_by(cls.created_at.desc()).all()

    @classmethod
    def ajustes_inventario(cls, fecha_inicio=None, fecha_fin=None):
        """
        Retorna solo ajustes manuales de inventario

        Args:
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[MovimientoStock]: Lista de ajustes
        """
        return cls.por_tipo('ajuste', fecha_inicio, fecha_fin)

    @classmethod
    def historial_completo_producto(cls, producto_id):
        """
        Retorna todo el historial de un producto

        Args:
            producto_id (int): ID del producto

        Returns:
            list[MovimientoStock]: Lista de todos los movimientos del producto
        """
        return cls.query.filter_by(producto_id=producto_id).order_by(cls.created_at.asc()).all()

    # === REPRESENTACIONES ===

    def __repr__(self):
        return f'<MovimientoStock {self.tipo} producto_id={self.producto_id} cantidad={self.cantidad}>'

    def __str__(self):
        producto_nombre = self.producto.nombre if self.producto else f'Producto {self.producto_id}'
        signo = '+' if self.cantidad > 0 else ''
        return f'{self.tipo.upper()}: {signo}{self.cantidad} {producto_nombre} ({self.stock_anterior} → {self.stock_nuevo})'
