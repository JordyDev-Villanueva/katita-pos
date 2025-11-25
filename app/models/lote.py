"""
KATITA-POS - Lote Model
=======================
Modelo de Lote para gestión de inventario por lotes
Controla fechas de vencimiento y trazabilidad FIFO
"""

from app import db
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import CheckConstraint, Index, ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import validates
from decimal import Decimal

# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))


class Lote(db.Model):
    """
    Modelo de Lote

    Representa un lote de productos en el inventario.
    Cada lote tiene su propia fecha de vencimiento, precio de compra
    y trazabilidad completa (FIFO - First In, First Out).

    Attributes:
        id (int): Identificador único del lote
        producto_id (int): ID del producto asociado
        codigo_lote (str): Código único del lote
        cantidad_inicial (int): Cantidad al ingresar el lote
        cantidad_actual (int): Cantidad disponible actualmente
        fecha_ingreso (datetime): Fecha de ingreso al inventario
        fecha_vencimiento (date): Fecha de vencimiento del lote
        precio_compra_lote (Decimal): Precio de compra de este lote
        proveedor (str): Nombre del proveedor
        ubicacion (str): Ubicación física (pasillo/estante)
        notas (str): Notas adicionales del lote
        activo (bool): Indica si el lote está activo

    Relationships:
        producto: Producto al que pertenece este lote
        movimientos: Movimientos de stock del lote

    Example:
        >>> lote = Lote(
        ...     producto_id=1,
        ...     codigo_lote='LT-2024-001',
        ...     cantidad_inicial=50,
        ...     cantidad_actual=50,
        ...     fecha_vencimiento=date(2024, 12, 31),
        ...     precio_compra_lote=Decimal('8.50')
        ... )
        >>> db.session.add(lote)
        >>> db.session.commit()
    """

    __tablename__ = 'lotes'

    # ==================== Campos ====================

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    producto_id = db.Column(
        db.Integer,
        ForeignKey('products.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment='ID del producto asociado'
    )

    codigo_lote = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True,
        comment='Código único del lote'
    )

    cantidad_inicial = db.Column(
        db.Integer,
        nullable=False,
        comment='Cantidad al ingresar el lote'
    )

    cantidad_actual = db.Column(
        db.Integer,
        nullable=False,
        comment='Cantidad disponible actualmente'
    )

    fecha_ingreso = db.Column(
        db.DateTime,
        default=lambda: datetime.now(PERU_TZ),
        nullable=False,
        comment='Fecha de ingreso al inventario'
    )

    fecha_vencimiento = db.Column(
        db.Date,
        nullable=False,
        index=True,
        comment='Fecha de vencimiento del lote'
    )

    precio_compra_lote = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        comment='Precio de compra de este lote específico'
    )

    proveedor = db.Column(
        db.String(200),
        nullable=True,
        comment='Nombre del proveedor'
    )

    ubicacion = db.Column(
        db.String(100),
        nullable=True,
        comment='Ubicación física (pasillo/estante)'
    )

    notas = db.Column(
        db.Text,
        nullable=True,
        comment='Notas adicionales del lote'
    )

    activo = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
        index=True,
        comment='Indica si el lote está activo'
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(PERU_TZ),
        nullable=False,
        comment='Fecha de creación'
    )

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(PERU_TZ),
        onupdate=lambda: datetime.now(PERU_TZ),
        nullable=False,
        comment='Fecha de última actualización'
    )

    # ==================== Constraints ====================

    __table_args__ = (
        # Constraint: cantidad_actual no puede ser negativa
        CheckConstraint(
            'cantidad_actual >= 0',
            name='check_cantidad_actual_positiva'
        ),
        # Constraint: cantidad_actual no puede ser mayor que cantidad_inicial
        CheckConstraint(
            'cantidad_actual <= cantidad_inicial',
            name='check_cantidad_actual_menor_inicial'
        ),
        # Constraint: precio_compra_lote debe ser positivo
        CheckConstraint(
            'precio_compra_lote > 0',
            name='check_precio_compra_lote_positivo'
        ),
        # Constraint: cantidad_inicial debe ser positiva
        CheckConstraint(
            'cantidad_inicial > 0',
            name='check_cantidad_inicial_positiva'
        ),
        # Índice compuesto para búsquedas por producto y vencimiento (FIFO)
        Index('idx_producto_vencimiento', 'producto_id', 'fecha_vencimiento'),
        # Índice compuesto para búsquedas por producto y estado
        Index('idx_producto_activo', 'producto_id', 'activo'),
    )

    # ==================== Relaciones ====================

    producto = db.relationship(
        'Product',
        backref=db.backref('lotes', lazy='dynamic', cascade='all, delete-orphan'),
        foreign_keys=[producto_id]
    )

    # movimientos = db.relationship(
    #     'MovimientoStock',
    #     backref='lote',
    #     lazy='dynamic',
    #     cascade='all, delete-orphan'
    # )

    # ==================== Constructor ====================

    def __init__(self, **kwargs):
        """
        Constructor del modelo Lote

        Inicializa los valores por defecto explícitamente para asegurar
        que se establezcan antes de guardar en la base de datos.

        Args:
            **kwargs: Argumentos del lote
        """
        super(Lote, self).__init__(**kwargs)

        # Establecer valores por defecto explícitamente si no se proporcionan
        if self.activo is None:
            self.activo = True

        # Si cantidad_actual no se proporciona, usar cantidad_inicial
        if self.cantidad_actual is None and self.cantidad_inicial is not None:
            self.cantidad_actual = self.cantidad_inicial

        # Si fecha_ingreso no se proporciona, usar la fecha actual
        if self.fecha_ingreso is None:
            self.fecha_ingreso = datetime.now(PERU_TZ)

        # Validar fechas DESPUÉS de que todos los campos estén inicializados
        if self.fecha_vencimiento and self.fecha_ingreso:
            fecha_ingreso_date = self.fecha_ingreso.date() if isinstance(self.fecha_ingreso, datetime) else self.fecha_ingreso
            if self.fecha_vencimiento <= fecha_ingreso_date:
                raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')

    # ==================== Validadores Automáticos ====================

    @validates('codigo_lote')
    def validate_codigo_lote(self, key, codigo_lote):
        """Valida que el código de lote no esté vacío"""
        if not codigo_lote or len(codigo_lote.strip()) == 0:
            raise ValueError('El código de lote es requerido')
        return codigo_lote

    @validates('cantidad_inicial')
    def validate_cantidad_inicial(self, key, cantidad_inicial):
        """Valida que la cantidad inicial sea positiva"""
        if cantidad_inicial is not None and cantidad_inicial <= 0:
            raise ValueError('La cantidad inicial debe ser mayor a 0')
        return cantidad_inicial

    @validates('cantidad_actual')
    def validate_cantidad_actual(self, key, cantidad_actual):
        """Valida que la cantidad actual sea válida"""
        if cantidad_actual is not None:
            if cantidad_actual < 0:
                raise ValueError('La cantidad actual no puede ser negativa')
            if self.cantidad_inicial is not None and cantidad_actual > self.cantidad_inicial:
                raise ValueError('La cantidad actual no puede ser mayor a la cantidad inicial')
        return cantidad_actual

    @validates('precio_compra_lote')
    def validate_precio_compra_lote(self, key, precio_compra_lote):
        """Valida que el precio de compra sea positivo"""
        if precio_compra_lote is not None and precio_compra_lote <= 0:
            raise ValueError('El precio de compra del lote debe ser mayor a 0')
        return precio_compra_lote

    # Nota: La validación de fecha_vencimiento se hace en __init__
    # porque necesita que fecha_ingreso ya esté inicializado

    # ==================== Propiedades Calculadas ====================

    @hybrid_property
    def dias_hasta_vencimiento(self):
        """
        Calcula los días restantes hasta el vencimiento

        Returns:
            int: Días hasta vencimiento (negativo si ya venció)
        """
        if self.fecha_vencimiento:
            hoy = date.today()
            delta = self.fecha_vencimiento - hoy
            return delta.days
        return None

    @hybrid_property
    def esta_vencido(self):
        """
        Indica si el lote está vencido

        Returns:
            bool: True si la fecha de vencimiento ya pasó
        """
        if self.fecha_vencimiento:
            return self.fecha_vencimiento < date.today()
        return False

    @hybrid_property
    def esta_por_vencer(self):
        """
        Indica si el lote está por vencer (30 días o menos)

        Returns:
            bool: True si vence en 30 días o menos
        """
        if self.dias_hasta_vencimiento is not None:
            return 0 <= self.dias_hasta_vencimiento <= 30
        return False

    @hybrid_property
    def cantidad_vendida(self):
        """
        Calcula la cantidad vendida del lote

        Returns:
            int: Cantidad vendida (inicial - actual)
        """
        return self.cantidad_inicial - self.cantidad_actual

    @hybrid_property
    def porcentaje_vendido(self):
        """
        Calcula el porcentaje vendido del lote

        Returns:
            float: Porcentaje vendido sobre la cantidad inicial
        """
        if self.cantidad_inicial > 0:
            return (self.cantidad_vendida / self.cantidad_inicial) * 100
        return 0.0

    @hybrid_property
    def tiene_stock(self):
        """
        Indica si el lote tiene stock disponible

        Returns:
            bool: True si tiene stock disponible
        """
        return self.cantidad_actual > 0

    # ==================== Métodos de Instancia ====================

    def validar(self):
        """
        Valida todos los campos del lote antes de guardar

        Raises:
            ValueError: Si algún campo no es válido
        """
        # Validar código de lote
        if not self.codigo_lote or len(self.codigo_lote.strip()) == 0:
            raise ValueError('El código de lote es requerido')

        # Validar producto_id
        if not self.producto_id:
            raise ValueError('El producto_id es requerido')

        # Validar cantidades
        if self.cantidad_inicial <= 0:
            raise ValueError('La cantidad inicial debe ser mayor a 0')

        if self.cantidad_actual < 0:
            raise ValueError('La cantidad actual no puede ser negativa')

        if self.cantidad_actual > self.cantidad_inicial:
            raise ValueError('La cantidad actual no puede ser mayor a la cantidad inicial')

        # Validar precio
        if self.precio_compra_lote <= 0:
            raise ValueError('El precio de compra del lote debe ser mayor a 0')

        # Validar fechas
        if not self.fecha_vencimiento:
            raise ValueError('La fecha de vencimiento es requerida')

        if self.fecha_ingreso and self.fecha_vencimiento:
            # Convertir fecha_ingreso a date para comparar
            fecha_ingreso_date = self.fecha_ingreso.date() if isinstance(self.fecha_ingreso, datetime) else self.fecha_ingreso
            if self.fecha_vencimiento <= fecha_ingreso_date:
                raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')

    def to_dict(self, include_producto=False):
        """
        Convierte el lote a diccionario para JSON

        Args:
            include_producto (bool): Incluir información del producto

        Returns:
            dict: Representación del lote en formato diccionario
        """
        data = {
            'id': self.id,
            'producto_id': self.producto_id,
            'codigo_lote': self.codigo_lote,
            'cantidad_inicial': self.cantidad_inicial,
            'cantidad_actual': self.cantidad_actual,
            'cantidad_vendida': self.cantidad_vendida,
            'porcentaje_vendido': round(self.porcentaje_vendido, 2),
            'fecha_ingreso': self.fecha_ingreso.isoformat() if self.fecha_ingreso else None,
            'fecha_vencimiento': self.fecha_vencimiento.isoformat() if self.fecha_vencimiento else None,
            'dias_hasta_vencimiento': self.dias_hasta_vencimiento,
            'esta_vencido': self.esta_vencido,
            'esta_por_vencer': self.esta_por_vencer,
            'tiene_stock': self.tiene_stock,
            'precio_compra_lote': float(self.precio_compra_lote),
            'proveedor': self.proveedor,
            'ubicacion': self.ubicacion,
            'notas': self.notas,
            'activo': self.activo,
            'dias_en_inventario': self.dias_en_inventario(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_producto and self.producto:
            data['producto'] = {
                'id': self.producto.id,
                'codigo_barras': self.producto.codigo_barras,
                'nombre': self.producto.nombre,
                'categoria': self.producto.categoria,
            }

        return data

    def descontar_stock(self, cantidad):
        """
        Descuenta stock del lote

        Args:
            cantidad (int): Cantidad a descontar

        Raises:
            ValueError: Si no hay stock suficiente o cantidad inválida
        """
        if cantidad <= 0:
            raise ValueError('La cantidad a descontar debe ser mayor a 0')

        if cantidad > self.cantidad_actual:
            raise ValueError(f'Stock insuficiente. Disponible: {self.cantidad_actual}, solicitado: {cantidad}')

        self.cantidad_actual -= cantidad
        self.updated_at = datetime.now(PERU_TZ)

        # Si se agota el stock, marcar como inactivo
        if self.cantidad_actual == 0:
            self.activo = False

    def aumentar_stock(self, cantidad):
        """
        Aumenta el stock del lote (devoluciones, ajustes)

        Args:
            cantidad (int): Cantidad a aumentar

        Raises:
            ValueError: Si la cantidad inválida o excede la inicial
        """
        if cantidad <= 0:
            raise ValueError('La cantidad a aumentar debe ser mayor a 0')

        nueva_cantidad = self.cantidad_actual + cantidad

        if nueva_cantidad > self.cantidad_inicial:
            raise ValueError(
                f'La cantidad total ({nueva_cantidad}) no puede exceder '
                f'la cantidad inicial ({self.cantidad_inicial})'
            )

        self.cantidad_actual = nueva_cantidad
        self.updated_at = datetime.now(PERU_TZ)

        # Reactivar si estaba inactivo por falta de stock
        if self.cantidad_actual > 0 and not self.activo:
            self.activo = True

    def esta_disponible(self):
        """
        Verifica si el lote está disponible para venta

        Returns:
            bool: True si tiene stock, está activo y no está vencido
        """
        return self.tiene_stock and self.activo and not self.esta_vencido

    def dias_en_inventario(self):
        """
        Calcula los días que el lote lleva en el inventario

        Returns:
            int: Días desde el ingreso
        """
        if self.fecha_ingreso:
            # Manejar timezone-aware y timezone-naive datetimes
            if self.fecha_ingreso.tzinfo is not None:
                # fecha_ingreso tiene timezone (aware)
                hoy = datetime.now(PERU_TZ)
            else:
                # fecha_ingreso no tiene timezone (naive)
                hoy = datetime.now()

            delta = hoy - self.fecha_ingreso
            return delta.days
        return 0

    def activar(self):
        """Activa el lote"""
        self.activo = True
        self.updated_at = datetime.now(PERU_TZ)

    def desactivar(self):
        """Desactiva el lote"""
        self.activo = False
        self.updated_at = datetime.now(PERU_TZ)

    # ==================== Métodos de Clase (Queries) ====================

    @classmethod
    def buscar_por_producto(cls, producto_id, solo_activos=True):
        """
        Busca todos los lotes de un producto

        Args:
            producto_id (int): ID del producto
            solo_activos (bool): Filtrar solo lotes activos

        Returns:
            Query: Query de lotes del producto
        """
        query = cls.query.filter_by(producto_id=producto_id)
        if solo_activos:
            query = query.filter_by(activo=True)
        return query

    @classmethod
    def proximos_a_vencer(cls, dias=30, solo_activos=True):
        """
        Retorna lotes que están próximos a vencer

        Args:
            dias (int): Días de anticipación (default 30)
            solo_activos (bool): Solo lotes activos con stock

        Returns:
            list: Lista de lotes próximos a vencer
        """
        from datetime import timedelta
        hoy = date.today()
        fecha_limite = hoy + timedelta(days=dias)

        query = cls.query.filter(
            cls.fecha_vencimiento >= hoy,
            cls.fecha_vencimiento <= fecha_limite
        )

        if solo_activos:
            query = query.filter(cls.activo == True, cls.cantidad_actual > 0)

        return query.order_by(cls.fecha_vencimiento.asc()).all()

    @classmethod
    def lotes_vencidos(cls, solo_con_stock=True):
        """
        Retorna lotes que ya están vencidos

        Args:
            solo_con_stock (bool): Solo lotes que aún tienen stock

        Returns:
            list: Lista de lotes vencidos
        """
        hoy = date.today()
        query = cls.query.filter(cls.fecha_vencimiento < hoy)

        if solo_con_stock:
            query = query.filter(cls.cantidad_actual > 0)

        return query.order_by(cls.fecha_vencimiento.asc()).all()

    @classmethod
    def lotes_activos(cls, con_stock=True):
        """
        Retorna todos los lotes activos

        Args:
            con_stock (bool): Solo lotes con stock disponible

        Returns:
            Query: Query de lotes activos
        """
        query = cls.query.filter_by(activo=True)

        if con_stock:
            query = query.filter(cls.cantidad_actual > 0)

        return query

    @classmethod
    def lotes_fifo(cls, producto_id):
        """
        Retorna lotes de un producto ordenados por FIFO
        (First In, First Out - primero en vencer, primero en salir)

        Args:
            producto_id (int): ID del producto

        Returns:
            Query: Query de lotes ordenados por fecha de vencimiento
        """
        return cls.query.filter_by(
            producto_id=producto_id,
            activo=True
        ).filter(
            cls.cantidad_actual > 0,
            cls.fecha_vencimiento >= date.today()  # Solo no vencidos
        ).order_by(
            cls.fecha_vencimiento.asc()  # Primero los que vencen antes
        )

    @classmethod
    def buscar_por_codigo(cls, codigo_lote):
        """
        Busca un lote por su código

        Args:
            codigo_lote (str): Código del lote

        Returns:
            Lote: Lote encontrado o None
        """
        return cls.query.filter_by(codigo_lote=codigo_lote).first()

    @classmethod
    def buscar_por_proveedor(cls, proveedor, solo_activos=True):
        """
        Busca lotes por proveedor

        Args:
            proveedor (str): Nombre del proveedor
            solo_activos (bool): Solo lotes activos

        Returns:
            Query: Query de lotes del proveedor
        """
        query = cls.query.filter(cls.proveedor.ilike(f'%{proveedor}%'))
        if solo_activos:
            query = query.filter_by(activo=True)
        return query

    @classmethod
    def lotes_por_ubicacion(cls, ubicacion):
        """
        Busca lotes por ubicación física

        Args:
            ubicacion (str): Ubicación (pasillo/estante)

        Returns:
            Query: Query de lotes en la ubicación
        """
        return cls.query.filter(cls.ubicacion.ilike(f'%{ubicacion}%'))

    @classmethod
    def estadisticas_por_producto(cls, producto_id):
        """
        Obtiene estadísticas de lotes de un producto

        Args:
            producto_id (int): ID del producto

        Returns:
            dict: Estadísticas de lotes
        """
        lotes = cls.buscar_por_producto(producto_id, solo_activos=False).all()

        total_lotes = len(lotes)
        lotes_activos = sum(1 for l in lotes if l.activo)
        stock_total = sum(l.cantidad_actual for l in lotes)
        lotes_vencidos = sum(1 for l in lotes if l.esta_vencido)
        lotes_por_vencer = sum(1 for l in lotes if l.esta_por_vencer)

        return {
            'total_lotes': total_lotes,
            'lotes_activos': lotes_activos,
            'lotes_inactivos': total_lotes - lotes_activos,
            'stock_total': stock_total,
            'lotes_vencidos': lotes_vencidos,
            'lotes_por_vencer': lotes_por_vencer,
        }

    # ==================== Métodos Especiales ====================

    def __repr__(self):
        """Representación legible del lote"""
        return (f'<Lote {self.codigo_lote}: '
                f'{self.cantidad_actual}/{self.cantidad_inicial} unidades, '
                f'vence: {self.fecha_vencimiento}>')

    def __str__(self):
        """Representación en string del lote"""
        return f'Lote {self.codigo_lote} ({self.cantidad_actual} unidades)'
