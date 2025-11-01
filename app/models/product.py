"""
KATITA-POS - Product Model
==========================
Modelo de Producto para el sistema POS
Gestiona el inventario de productos del minimarket
"""

from app import db
from datetime import datetime, timezone
from sqlalchemy import CheckConstraint, Index
from sqlalchemy.ext.hybrid import hybrid_property
from decimal import Decimal


class Product(db.Model):
    """
    Modelo de Producto

    Representa un producto en el inventario del minimarket.
    Incluye información de precios, stock, categoría e imagen.

    Attributes:
        id (int): Identificador único del producto
        codigo_barras (str): Código de barras EAN-13 (único)
        nombre (str): Nombre del producto
        descripcion (str): Descripción detallada del producto
        categoria (str): Categoría del producto
        precio_compra (Decimal): Precio de compra del producto
        precio_venta (Decimal): Precio de venta al público
        stock_total (int): Stock total actual (calculado de lotes)
        stock_minimo (int): Stock mínimo para alerta de reabastecimiento
        imagen_url (str): URL de la imagen del producto
        activo (bool): Indica si el producto está activo
        created_at (datetime): Fecha de creación del registro
        updated_at (datetime): Fecha de última actualización

    Relationships:
        lotes: Lista de lotes de inventario del producto (One-to-Many)
        movimientos: Lista de movimientos de stock del producto (One-to-Many)

    Example:
        >>> product = Product(
        ...     codigo_barras='7501234567890',
        ...     nombre='Coca Cola 2L',
        ...     categoria='Bebidas',
        ...     precio_compra=8.50,
        ...     precio_venta=12.00
        ... )
        >>> db.session.add(product)
        >>> db.session.commit()
    """

    __tablename__ = 'products'

    # ==================== Campos ====================

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    codigo_barras = db.Column(
        db.String(13),
        unique=True,
        nullable=False,
        index=True,
        comment='Código de barras EAN-13'
    )

    nombre = db.Column(
        db.String(200),
        nullable=False,
        index=True,
        comment='Nombre del producto'
    )

    descripcion = db.Column(
        db.Text,
        nullable=True,
        comment='Descripción detallada del producto'
    )

    categoria = db.Column(
        db.String(50),
        nullable=False,
        index=True,
        comment='Categoría del producto'
    )

    precio_compra = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        comment='Precio de compra'
    )

    precio_venta = db.Column(
        db.Numeric(10, 2),
        nullable=False,
        comment='Precio de venta al público'
    )

    stock_total = db.Column(
        db.Integer,
        default=0,
        nullable=False,
        comment='Stock total actual (calculado de lotes)'
    )

    stock_minimo = db.Column(
        db.Integer,
        default=5,
        nullable=False,
        comment='Stock mínimo para alerta'
    )

    imagen_url = db.Column(
        db.String(500),
        nullable=True,
        comment='URL de la imagen del producto'
    )

    activo = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
        index=True,
        comment='Indica si el producto está activo'
    )

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment='Fecha de creación'
    )

    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        comment='Fecha de última actualización'
    )

    # ==================== Constraints ====================

    __table_args__ = (
        # Constraint: precio_venta debe ser mayor que precio_compra
        CheckConstraint(
            'precio_venta > precio_compra',
            name='check_precio_venta_mayor_compra'
        ),
        # Constraint: stock_minimo debe ser positivo
        CheckConstraint(
            'stock_minimo >= 0',
            name='check_stock_minimo_positivo'
        ),
        # Constraint: stock_total no puede ser negativo
        CheckConstraint(
            'stock_total >= 0',
            name='check_stock_total_positivo'
        ),
        # Índice compuesto para búsquedas por categoría y estado
        Index('idx_categoria_activo', 'categoria', 'activo'),
    )

    # ==================== Relaciones ====================
    # Nota: Se definirán cuando se creen los modelos Lote y MovimientoStock

    # lotes = db.relationship(
    #     'Lote',
    #     backref='producto',
    #     lazy='dynamic',
    #     cascade='all, delete-orphan'
    # )

    # movimientos = db.relationship(
    #     'MovimientoStock',
    #     backref='producto',
    #     lazy='dynamic',
    #     cascade='all, delete-orphan'
    # )

    # ==================== Constructor ====================

    def __init__(self, **kwargs):
        """
        Constructor del modelo Product

        Inicializa los valores por defecto explícitamente para asegurar
        que se establezcan antes de guardar en la base de datos.

        Args:
            **kwargs: Argumentos del producto
        """
        super(Product, self).__init__(**kwargs)

        # Establecer valores por defecto explícitamente si no se proporcionan
        if self.stock_total is None:
            self.stock_total = 0

        if self.stock_minimo is None:
            self.stock_minimo = 5

        if self.activo is None:
            self.activo = True

    # ==================== Propiedades ====================

    @hybrid_property
    def stock_disponible(self):
        """
        Retorna el stock disponible del producto

        Returns:
            int: Stock total actual del producto
        """
        return self.stock_total

    @hybrid_property
    def necesita_reabastecimiento(self):
        """
        Indica si el producto necesita ser reabastecido

        Returns:
            bool: True si el stock está por debajo del mínimo
        """
        return self.stock_total < self.stock_minimo

    @hybrid_property
    def margen_ganancia(self):
        """
        Calcula el margen de ganancia del producto

        Returns:
            Decimal: Diferencia entre precio de venta y compra
        """
        return self.precio_venta - self.precio_compra

    @hybrid_property
    def porcentaje_ganancia(self):
        """
        Calcula el porcentaje de ganancia del producto

        Returns:
            float: Porcentaje de ganancia sobre el precio de compra
        """
        if self.precio_compra > 0:
            return float((self.margen_ganancia / self.precio_compra) * 100)
        return 0.0

    # ==================== Métodos de Instancia ====================

    def calcular_stock_total(self):
        """
        Calcula el stock total sumando todos los lotes activos

        Este método será implementado cuando se cree el modelo Lote.
        Por ahora retorna el stock_total actual.

        Returns:
            int: Stock total calculado
        """
        # TODO: Implementar cuando se cree el modelo Lote
        # total = sum(lote.cantidad for lote in self.lotes if lote.activo)
        # self.stock_total = total
        # return total
        return self.stock_total

    def to_dict(self, include_relationships=False):
        """
        Convierte el producto a diccionario para JSON

        Args:
            include_relationships (bool): Incluir relaciones (lotes, movimientos)

        Returns:
            dict: Representación del producto en formato diccionario
        """
        data = {
            'id': self.id,
            'codigo_barras': self.codigo_barras,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'categoria': self.categoria,
            'precio_compra': float(self.precio_compra),
            'precio_venta': float(self.precio_venta),
            'stock_total': self.stock_total,
            'stock_minimo': self.stock_minimo,
            'stock_disponible': self.stock_disponible,
            'necesita_reabastecimiento': self.necesita_reabastecimiento,
            'margen_ganancia': float(self.margen_ganancia),
            'porcentaje_ganancia': round(self.porcentaje_ganancia, 2),
            'imagen_url': self.imagen_url,
            'activo': self.activo,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

        # TODO: Incluir relaciones cuando se implementen
        # if include_relationships:
        #     data['lotes'] = [lote.to_dict() for lote in self.lotes]
        #     data['movimientos_recientes'] = [
        #         mov.to_dict() for mov in self.movimientos.limit(10)
        #     ]

        return data

    def actualizar_stock(self, cantidad, operacion='suma'):
        """
        Actualiza el stock del producto

        Args:
            cantidad (int): Cantidad a sumar o restar
            operacion (str): 'suma' o 'resta'

        Raises:
            ValueError: Si la operación resulta en stock negativo
        """
        if operacion == 'suma':
            self.stock_total += cantidad
        elif operacion == 'resta':
            if self.stock_total - cantidad < 0:
                raise ValueError(f'Stock insuficiente. Stock actual: {self.stock_total}')
            self.stock_total -= cantidad
        else:
            raise ValueError(f'Operación no válida: {operacion}')

        self.updated_at = datetime.now(timezone.utc)

    def activar(self):
        """Activa el producto"""
        self.activo = True
        self.updated_at = datetime.now(timezone.utc)

    def desactivar(self):
        """Desactiva el producto"""
        self.activo = False
        self.updated_at = datetime.now(timezone.utc)

    # ==================== Métodos de Validación ====================

    @staticmethod
    def validar_codigo_barras(codigo_barras):
        """
        Valida que el código de barras sea numérico y tenga 13 caracteres

        Args:
            codigo_barras (str): Código de barras a validar

        Returns:
            bool: True si es válido

        Raises:
            ValueError: Si el código no es válido
        """
        if not codigo_barras:
            raise ValueError('El código de barras es requerido')

        if not codigo_barras.isdigit():
            raise ValueError('El código de barras debe ser numérico')

        if len(codigo_barras) != 13:
            raise ValueError('El código de barras debe tener exactamente 13 dígitos')

        return True

    @staticmethod
    def validar_precios(precio_compra, precio_venta):
        """
        Valida que los precios sean correctos

        Args:
            precio_compra (Decimal): Precio de compra
            precio_venta (Decimal): Precio de venta

        Returns:
            bool: True si son válidos

        Raises:
            ValueError: Si los precios no son válidos
        """
        if precio_compra <= 0:
            raise ValueError('El precio de compra debe ser mayor a 0')

        if precio_venta <= 0:
            raise ValueError('El precio de venta debe ser mayor a 0')

        if precio_venta <= precio_compra:
            raise ValueError('El precio de venta debe ser mayor al precio de compra')

        return True

    @staticmethod
    def validar_stock_minimo(stock_minimo):
        """
        Valida que el stock mínimo sea positivo

        Args:
            stock_minimo (int): Stock mínimo

        Returns:
            bool: True si es válido

        Raises:
            ValueError: Si el stock mínimo no es válido
        """
        if stock_minimo < 0:
            raise ValueError('El stock mínimo no puede ser negativo')

        return True

    def validar(self):
        """
        Valida todos los campos del producto antes de guardar

        Raises:
            ValueError: Si algún campo no es válido
        """
        self.validar_codigo_barras(self.codigo_barras)
        self.validar_precios(self.precio_compra, self.precio_venta)
        self.validar_stock_minimo(self.stock_minimo)

        if not self.nombre or len(self.nombre.strip()) == 0:
            raise ValueError('El nombre del producto es requerido')

        if not self.categoria or len(self.categoria.strip()) == 0:
            raise ValueError('La categoría es requerida')

    # ==================== Métodos Especiales ====================

    def __repr__(self):
        """Representación legible del producto"""
        return f'<Product {self.codigo_barras}: {self.nombre} - Stock: {self.stock_total}>'

    def __str__(self):
        """Representación en string del producto"""
        return f'{self.nombre} ({self.codigo_barras})'

    # ==================== Métodos de Clase ====================

    @classmethod
    def buscar_por_codigo(cls, codigo_barras):
        """
        Busca un producto por su código de barras

        Args:
            codigo_barras (str): Código de barras a buscar

        Returns:
            Product: Producto encontrado o None
        """
        return cls.query.filter_by(codigo_barras=codigo_barras).first()

    @classmethod
    def buscar_activos(cls):
        """
        Retorna todos los productos activos

        Returns:
            Query: Query de productos activos
        """
        return cls.query.filter_by(activo=True)

    @classmethod
    def buscar_por_categoria(cls, categoria, solo_activos=True):
        """
        Busca productos por categoría

        Args:
            categoria (str): Categoría a buscar
            solo_activos (bool): Filtrar solo productos activos

        Returns:
            Query: Query de productos de la categoría
        """
        query = cls.query.filter_by(categoria=categoria)
        if solo_activos:
            query = query.filter_by(activo=True)
        return query

    @classmethod
    def productos_bajo_stock(cls):
        """
        Retorna productos que necesitan reabastecimiento

        Returns:
            list: Lista de productos con stock bajo el mínimo
        """
        return cls.query.filter(
            cls.stock_total < cls.stock_minimo,
            cls.activo == True
        ).all()

    @classmethod
    def buscar_por_nombre(cls, termino, solo_activos=True):
        """
        Busca productos por nombre (búsqueda parcial)

        Args:
            termino (str): Término a buscar en el nombre
            solo_activos (bool): Filtrar solo productos activos

        Returns:
            Query: Query de productos que coinciden
        """
        query = cls.query.filter(cls.nombre.ilike(f'%{termino}%'))
        if solo_activos:
            query = query.filter_by(activo=True)
        return query
