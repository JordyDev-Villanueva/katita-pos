"""
Modelo DetalleVenta para KATITA-POS

Define la estructura de items individuales de cada venta.
Conecta Venta con Product y Lote (trazabilidad FIFO).
Permite calcular ganancias y generar reportes.
"""

from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Index, CheckConstraint, Integer,
    DateTime, Numeric, func
)
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app import db


class DetalleVenta(db.Model):
    """
    Modelo para detalles de venta del sistema KATITA-POS

    Registra cada item vendido en una venta.
    Conecta con Product y Lote para trazabilidad FIFO.
    Calcula ganancias por item para reportes.

    IMPORTANTE: Este modelo NO descuenta stock.
    Solo REGISTRA lo que se vendió (para reportes y trazabilidad).
    """

    __tablename__ = 'detalles_venta'

    # === CAMPOS ===

    id = db.Column(Integer, primary_key=True, autoincrement=True)

    # Relaciones
    venta_id = db.Column(Integer, db.ForeignKey('ventas.id'), nullable=False, index=True)
    producto_id = db.Column(Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    lote_id = db.Column(Integer, db.ForeignKey('lotes.id'), nullable=True, index=True)

    # Cantidades y precios
    cantidad = db.Column(Integer, nullable=False)
    precio_unitario = db.Column(Numeric(10, 2), nullable=False)  # Precio de venta
    precio_compra_unitario = db.Column(Numeric(10, 2), nullable=False)  # Para calcular ganancia

    # Subtotales
    subtotal = db.Column(Numeric(10, 2), nullable=False)  # cantidad × precio_unitario
    descuento_item = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    subtotal_final = db.Column(Numeric(10, 2), nullable=False)  # subtotal - descuento_item

    # Timestamps
    created_at = db.Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    updated_at = db.Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # === RELACIONES ===

    venta = relationship('Venta', backref='detalles')
    producto = relationship('Product', backref='ventas_detalle')
    lote = relationship('Lote', backref='ventas_detalle')

    # === CONSTRAINTS ===

    __table_args__ = (
        CheckConstraint('cantidad > 0', name='check_cantidad_positiva'),
        CheckConstraint('precio_unitario > 0', name='check_precio_unitario_positivo'),
        CheckConstraint('precio_compra_unitario >= 0', name='check_precio_compra_no_negativo'),
        CheckConstraint('descuento_item >= 0', name='check_descuento_item_no_negativo'),
        CheckConstraint('descuento_item <= subtotal', name='check_descuento_menor_subtotal'),
        Index('idx_venta_producto', 'venta_id', 'producto_id'),
        Index('idx_producto_fecha', 'producto_id', 'created_at'),
    )

    # === CONSTRUCTOR ===

    def __init__(self, **kwargs):
        """
        Constructor del modelo DetalleVenta

        Inicializa valores por defecto y calcula subtotales.

        Args:
            **kwargs: Argumentos del detalle
        """
        super(DetalleVenta, self).__init__(**kwargs)

        # Establecer valores por defecto
        if self.descuento_item is None:
            self.descuento_item = Decimal('0.00')

        # Calcular subtotales si no se proporcionan
        if self.subtotal is None and self.cantidad and self.precio_unitario:
            self.subtotal = Decimal(str(self.cantidad)) * Decimal(str(self.precio_unitario))

        if self.subtotal_final is None and self.subtotal is not None:
            self.subtotal_final = self.subtotal - (self.descuento_item or Decimal('0.00'))

    # === VALIDACIONES AUTOMÁTICAS ===

    @validates('cantidad')
    def validate_cantidad(self, key, cantidad):
        """Valida que la cantidad sea positiva"""
        if cantidad is not None and cantidad <= 0:
            raise ValueError('La cantidad debe ser mayor a 0')

        return cantidad

    @validates('precio_unitario')
    def validate_precio_unitario(self, key, precio_unitario):
        """Valida que el precio unitario sea positivo"""
        if precio_unitario is not None and precio_unitario <= 0:
            raise ValueError('El precio unitario debe ser mayor a 0')

        return precio_unitario

    @validates('precio_compra_unitario')
    def validate_precio_compra_unitario(self, key, precio_compra_unitario):
        """Valida que el precio de compra no sea negativo"""
        if precio_compra_unitario is not None and precio_compra_unitario < 0:
            raise ValueError('El precio de compra no puede ser negativo')

        return precio_compra_unitario

    @validates('descuento_item')
    def validate_descuento_item(self, key, descuento_item):
        """Valida que el descuento no sea negativo"""
        if descuento_item is not None and descuento_item < 0:
            raise ValueError('El descuento del item no puede ser negativo')

        return descuento_item

    # === PROPIEDADES CALCULADAS ===

    @hybrid_property
    def ganancia_unitaria(self):
        """Retorna la ganancia por unidad (precio_venta - precio_compra)"""
        if not self.precio_unitario or not self.precio_compra_unitario:
            return Decimal('0.00')

        return Decimal(str(self.precio_unitario)) - Decimal(str(self.precio_compra_unitario))

    @hybrid_property
    def ganancia_total(self):
        """Retorna la ganancia total (ganancia_unitaria × cantidad)"""
        if not self.cantidad:
            return Decimal('0.00')

        return self.ganancia_unitaria * Decimal(str(self.cantidad))

    @hybrid_property
    def porcentaje_ganancia(self):
        """
        Retorna el porcentaje de ganancia sobre el precio de compra

        Formula: (ganancia / precio_compra) × 100
        """
        if not self.precio_compra_unitario or self.precio_compra_unitario == 0:
            return 0.0

        ganancia = float(self.ganancia_unitaria)
        precio_compra = float(self.precio_compra_unitario)

        return (ganancia / precio_compra) * 100.0

    @hybrid_property
    def margen_bruto(self):
        """
        Retorna el margen bruto sobre el precio de venta

        Formula: (ganancia / precio_venta) × 100
        """
        if not self.precio_unitario or self.precio_unitario == 0:
            return 0.0

        ganancia = float(self.ganancia_unitaria)
        precio_venta = float(self.precio_unitario)

        return (ganancia / precio_venta) * 100.0

    # === MÉTODOS DE CÁLCULO ===

    def calcular_subtotales(self):
        """
        Calcula subtotal y subtotal_final

        subtotal = cantidad × precio_unitario
        subtotal_final = subtotal - descuento_item
        """
        if self.cantidad and self.precio_unitario:
            self.subtotal = Decimal(str(self.cantidad)) * Decimal(str(self.precio_unitario))
            self.subtotal_final = self.subtotal - (self.descuento_item or Decimal('0.00'))

    def calcular_ganancia(self):
        """
        Calcula la ganancia total del item

        Returns:
            Decimal: Ganancia total (ganancia_unitaria × cantidad)
        """
        return self.ganancia_total

    # === MÉTODOS DE VALIDACIÓN ===

    def validar(self):
        """
        Valida el detalle completo

        Verifica:
        - Subtotales correctos
        - Descuento válido
        - Ganancia calculable

        Raises:
            ValueError: Si alguna validación falla
        """
        # Validar subtotal
        subtotal_esperado = Decimal(str(self.cantidad)) * Decimal(str(self.precio_unitario))
        if abs(self.subtotal - subtotal_esperado) > Decimal('0.01'):
            raise ValueError(f'El subtotal ({self.subtotal}) no coincide con cantidad × precio ({subtotal_esperado})')

        # Validar descuento
        if self.descuento_item and self.descuento_item > self.subtotal:
            raise ValueError('El descuento del item no puede ser mayor que el subtotal')

        # Validar subtotal_final
        subtotal_final_esperado = self.subtotal - (self.descuento_item or Decimal('0.00'))
        if abs(self.subtotal_final - subtotal_final_esperado) > Decimal('0.01'):
            raise ValueError(f'El subtotal final ({self.subtotal_final}) no coincide con subtotal - descuento ({subtotal_final_esperado})')

    # === MÉTODOS DE SERIALIZACIÓN ===

    def to_dict(self, include_relations=False):
        """
        Convierte el detalle a diccionario

        Args:
            include_relations (bool): Si True, incluye datos de relaciones

        Returns:
            dict: Diccionario con los datos del detalle
        """
        data = {
            'id': self.id,
            'venta_id': self.venta_id,
            'producto_id': self.producto_id,
            'lote_id': self.lote_id,
            'cantidad': self.cantidad,
            'precio_unitario': float(self.precio_unitario) if self.precio_unitario else 0.0,
            'precio_compra_unitario': float(self.precio_compra_unitario) if self.precio_compra_unitario else 0.0,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'descuento_item': float(self.descuento_item) if self.descuento_item else 0.0,
            'subtotal_final': float(self.subtotal_final) if self.subtotal_final else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Propiedades calculadas
            'ganancia_unitaria': float(self.ganancia_unitaria),
            'ganancia_total': float(self.ganancia_total),
            'porcentaje_ganancia': self.porcentaje_ganancia,
            'margen_bruto': self.margen_bruto,
        }

        if include_relations:
            if self.producto:
                data['producto'] = {
                    'id': self.producto.id,
                    'nombre': self.producto.nombre,
                    'codigo_barras': self.producto.codigo_barras,
                }
            if self.lote:
                data['lote'] = {
                    'id': self.lote.id,
                    'codigo_lote': self.lote.codigo_lote,
                    'fecha_vencimiento': self.lote.fecha_vencimiento.isoformat() if self.lote.fecha_vencimiento else None,
                }

        return data

    # === MÉTODOS DE CLASE (QUERIES) ===

    @classmethod
    def por_venta(cls, venta_id):
        """
        Retorna todos los detalles de una venta

        Args:
            venta_id (int): ID de la venta

        Returns:
            list[DetalleVenta]: Lista de detalles de la venta
        """
        return cls.query.filter_by(venta_id=venta_id).all()

    @classmethod
    def por_producto(cls, producto_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna ventas de un producto en un periodo

        Args:
            producto_id (int): ID del producto
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[DetalleVenta]: Lista de detalles del producto
        """
        query = cls.query.filter_by(producto_id=producto_id)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time())
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time())
            query = query.filter(cls.created_at <= fin)

        return query.all()

    @classmethod
    def por_lote(cls, lote_id):
        """
        Retorna ventas que usaron un lote específico

        Args:
            lote_id (int): ID del lote

        Returns:
            list[DetalleVenta]: Lista de detalles que usaron ese lote
        """
        return cls.query.filter_by(lote_id=lote_id).all()

    @classmethod
    def productos_mas_vendidos(cls, limite=10, fecha_inicio=None, fecha_fin=None):
        """
        Retorna los productos más vendidos

        Args:
            limite (int): Cantidad de productos a retornar (default: 10)
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[tuple]: Lista de (producto_id, nombre_producto, cantidad_total)
        """
        from app.models.product import Product

        query = db.session.query(
            cls.producto_id,
            Product.nombre,
            func.sum(cls.cantidad).label('cantidad_total')
        ).join(Product, cls.producto_id == Product.id)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time())
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time())
            query = query.filter(cls.created_at <= fin)

        return query.group_by(cls.producto_id, Product.nombre).order_by(
            func.sum(cls.cantidad).desc()
        ).limit(limite).all()

    @classmethod
    def ganancias_por_producto(cls, fecha_inicio=None, fecha_fin=None):
        """
        Retorna reporte de ganancias por producto

        Args:
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            list[dict]: Lista de diccionarios con estadísticas por producto
        """
        from app.models.product import Product

        query = db.session.query(
            cls.producto_id,
            Product.nombre,
            func.sum(cls.cantidad).label('cantidad_vendida'),
            func.sum(cls.subtotal_final).label('total_ventas'),
            func.sum(
                (cls.precio_unitario - cls.precio_compra_unitario) * cls.cantidad
            ).label('ganancia_total')
        ).join(Product, cls.producto_id == Product.id)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time())
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time())
            query = query.filter(cls.created_at <= fin)

        resultados = query.group_by(cls.producto_id, Product.nombre).all()

        return [
            {
                'producto_id': r[0],
                'nombre_producto': r[1],
                'cantidad_vendida': int(r[2]) if r[2] else 0,
                'total_ventas': float(r[3]) if r[3] else 0.0,
                'ganancia_total': float(r[4]) if r[4] else 0.0,
            }
            for r in resultados
        ]

    @classmethod
    def total_vendido_producto(cls, producto_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna la cantidad total vendida de un producto

        Args:
            producto_id (int): ID del producto
            fecha_inicio (date): Fecha de inicio (opcional)
            fecha_fin (date): Fecha de fin (opcional)

        Returns:
            int: Cantidad total vendida
        """
        query = db.session.query(func.sum(cls.cantidad)).filter_by(producto_id=producto_id)

        if fecha_inicio:
            inicio = datetime.combine(fecha_inicio, datetime.min.time())
            query = query.filter(cls.created_at >= inicio)

        if fecha_fin:
            fin = datetime.combine(fecha_fin, datetime.max.time())
            query = query.filter(cls.created_at <= fin)

        resultado = query.scalar()
        return int(resultado) if resultado else 0

    @classmethod
    def items_con_mayor_ganancia(cls, limite=10):
        """
        Retorna los items con mayor ganancia

        Args:
            limite (int): Cantidad de items a retornar (default: 10)

        Returns:
            list[DetalleVenta]: Lista de detalles ordenados por ganancia
        """
        return cls.query.order_by(
            ((cls.precio_unitario - cls.precio_compra_unitario) * cls.cantidad).desc()
        ).limit(limite).all()

    # === REPRESENTACIONES ===

    def __repr__(self):
        return f'<DetalleVenta venta_id={self.venta_id} producto_id={self.producto_id} cantidad={self.cantidad}>'

    def __str__(self):
        producto_nombre = self.producto.nombre if self.producto else f'Producto {self.producto_id}'
        return f'{self.cantidad}x {producto_nombre} - S/ {self.subtotal_final}'
