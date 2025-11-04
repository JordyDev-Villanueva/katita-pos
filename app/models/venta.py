"""
Modelo Venta para KATITA-POS

Define la estructura de ventas del sistema POS.
Incluye métodos de pago específicos de Perú (Yape/Plin/Transferencia via QR).
Gestiona cálculo de totales y cambio solo para efectivo.
Los precios YA INCLUYEN IGV - no se calcula por separado.
"""

from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from sqlalchemy import (
    Index, CheckConstraint, String, Integer,
    Boolean, DateTime, Text, Numeric, func
)
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app import db


class Venta(db.Model):
    """
    Modelo para ventas del sistema KATITA-POS

    Gestiona transacciones de venta con métodos de pago peruanos:
    - Efectivo: Calcula cambio
    - Yape/Plin/Transferencia: Cliente escanea QR, sin cambio

    Total: subtotal - descuento (precios ya incluyen IGV)
    """

    __tablename__ = 'ventas'

    # === CAMPOS ===

    id = db.Column(Integer, primary_key=True, autoincrement=True)

    # Identificación
    numero_venta = db.Column(String(20), unique=True, nullable=False, index=True)
    fecha = db.Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Montos
    subtotal = db.Column(Numeric(10, 2), nullable=False)
    descuento = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    total = db.Column(Numeric(10, 2), nullable=False)

    # Pago
    metodo_pago = db.Column(String(20), nullable=False, index=True)
    monto_recibido = db.Column(Numeric(10, 2), nullable=True)  # Solo efectivo
    cambio = db.Column(Numeric(10, 2), nullable=True)  # Solo efectivo

    # Cliente (opcional)
    cliente_nombre = db.Column(String(200), nullable=True)
    cliente_dni = db.Column(String(8), nullable=True)

    # Vendedor
    vendedor_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Estado y sincronización
    estado = db.Column(String(20), default='completada', nullable=False, index=True)
    notas = db.Column(Text, nullable=True)
    created_offline = db.Column(Boolean, default=False, nullable=False)
    synced = db.Column(Boolean, default=True, nullable=False, index=True)

    # Timestamps
    created_at = db.Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = db.Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # === RELACIONES ===

    vendedor = relationship('User', backref='ventas')
    # detalles: relationship con DetalleVenta (se definirá en modelo DetalleVenta)
    # movimientos: relationship con MovimientoStock (se definirá en modelo MovimientoStock)

    # === CONSTRAINTS ===

    __table_args__ = (
        CheckConstraint('total > 0', name='check_total_positivo'),
        CheckConstraint('subtotal >= 0', name='check_subtotal_no_negativo'),
        CheckConstraint('descuento >= 0', name='check_descuento_no_negativo'),
        CheckConstraint('descuento <= subtotal', name='check_descuento_menor_subtotal'),
        CheckConstraint(
            "metodo_pago IN ('efectivo', 'yape', 'plin', 'transferencia')",
            name='check_metodo_pago_valido'
        ),
        CheckConstraint(
            "estado IN ('completada', 'cancelada', 'pendiente')",
            name='check_estado_valido'
        ),
        Index('idx_fecha_vendedor', 'fecha', 'vendedor_id'),
        Index('idx_estado_synced', 'estado', 'synced'),
        Index('idx_metodo_pago_fecha', 'metodo_pago', 'fecha'),
    )

    # === CONSTRUCTOR ===

    def __init__(self, **kwargs):
        """
        Constructor del modelo Venta

        Inicializa valores por defecto y genera número de venta.

        Args:
            **kwargs: Argumentos de la venta
        """
        # Generar número de venta si no se proporciona
        if 'numero_venta' not in kwargs:
            kwargs['numero_venta'] = self._generar_numero_venta_temp()

        super(Venta, self).__init__(**kwargs)

        # Establecer valores por defecto
        if self.descuento is None:
            self.descuento = Decimal('0.00')

        if self.estado is None:
            self.estado = 'completada'

        if self.created_offline is None:
            self.created_offline = False

        if self.synced is None:
            self.synced = True

    def _generar_numero_venta_temp(self):
        """Genera número temporal (será reemplazado por generar_numero_venta())"""
        return f"V-{datetime.now().strftime('%Y%m%d')}-TEMP"

    # === VALIDACIONES AUTOMÁTICAS ===

    @validates('metodo_pago')
    def validate_metodo_pago(self, key, metodo_pago):
        """Valida que el método de pago sea válido"""
        metodos_validos = ['efectivo', 'yape', 'plin', 'transferencia']

        if not metodo_pago or metodo_pago not in metodos_validos:
            raise ValueError(f'El método de pago debe ser uno de: {", ".join(metodos_validos)}')

        return metodo_pago

    @validates('estado')
    def validate_estado(self, key, estado):
        """Valida que el estado sea válido"""
        estados_validos = ['completada', 'cancelada', 'pendiente']

        if not estado or estado not in estados_validos:
            raise ValueError(f'El estado debe ser uno de: {", ".join(estados_validos)}')

        return estado

    @validates('total')
    def validate_total(self, key, total):
        """Valida que el total sea positivo"""
        if total is not None and total <= 0:
            raise ValueError('El total debe ser mayor a 0')

        return total

    @validates('subtotal')
    def validate_subtotal(self, key, subtotal):
        """Valida que el subtotal no sea negativo"""
        if subtotal is not None and subtotal < 0:
            raise ValueError('El subtotal no puede ser negativo')

        return subtotal

    @validates('descuento')
    def validate_descuento(self, key, descuento):
        """Valida que el descuento no sea negativo"""
        if descuento is not None and descuento < 0:
            raise ValueError('El descuento no puede ser negativo')

        return descuento

    # === PROPIEDADES CALCULADAS ===

    @hybrid_property
    def cantidad_items(self):
        """Retorna la cantidad total de items en la venta"""
        if not hasattr(self, 'detalles') or not self.detalles:
            return 0
        return sum(detalle.cantidad for detalle in self.detalles)

    @hybrid_property
    def ganancia_total(self):
        """Retorna la ganancia total de la venta"""
        if not hasattr(self, 'detalles') or not self.detalles:
            return Decimal('0.00')
        return sum(detalle.ganancia_total for detalle in self.detalles if hasattr(detalle, 'ganancia_total'))

    @hybrid_property
    def fue_creada_hoy(self):
        """Verifica si la venta fue creada hoy"""
        if not self.fecha:
            return False

        # Detectar si fecha es timezone-aware o naive
        if self.fecha.tzinfo is not None:
            hoy = datetime.now(timezone.utc).date()
            fecha_venta = self.fecha.date()
        else:
            hoy = datetime.now().date()
            fecha_venta = self.fecha.date() if isinstance(self.fecha, datetime) else self.fecha

        return fecha_venta == hoy

    @hybrid_property
    def dias_desde_venta(self):
        """Retorna los días transcurridos desde la venta"""
        if not self.fecha:
            return 0

        hoy = datetime.now(timezone.utc)
        fecha_aware = self.fecha.replace(tzinfo=timezone.utc) if self.fecha.tzinfo is None else self.fecha
        delta = hoy - fecha_aware
        return delta.days

    @hybrid_property
    def esta_pendiente_sync(self):
        """Verifica si la venta está pendiente de sincronización"""
        return self.created_offline and not self.synced

    @hybrid_property
    def es_pago_digital(self):
        """Verifica si el método de pago es digital (yape/plin/transferencia)"""
        return self.metodo_pago in ['yape', 'plin', 'transferencia']

    @hybrid_property
    def es_pago_efectivo(self):
        """Verifica si el método de pago es efectivo"""
        return self.metodo_pago == 'efectivo'

    # === MÉTODOS DE CÁLCULO ===

    def calcular_totales(self):
        """
        Calcula subtotal y total desde los detalles

        El subtotal es la suma de (precio * cantidad) de todos los detalles
        Total = subtotal - descuento

        Los precios de venta YA INCLUYEN el IGV implícitamente.
        No se calcula ni muestra IGV por separado (práctica común en minimarkets peruanos).
        """
        # Si hay detalles, calcular subtotal desde ellos
        if hasattr(self, 'detalles') and self.detalles:
            # Calcular subtotal desde detalles
            self.subtotal = sum(
                Decimal(str(detalle.precio_unitario)) * detalle.cantidad
                for detalle in self.detalles
            )

        # Calcular total (sin IGV por separado - ya está incluido en los precios)
        self.total = ((self.subtotal or Decimal('0.00')) - (self.descuento or Decimal('0.00'))).quantize(Decimal('0.01'))

    def calcular_cambio(self):
        """
        Calcula el cambio solo si el método de pago es efectivo

        Si método de pago es digital (yape/plin/transferencia):
        - monto_recibido = None
        - cambio = 0

        Si método de pago es efectivo:
        - Valida que monto_recibido >= total
        - Calcula cambio = monto_recibido - total

        Raises:
            ValueError: Si monto_recibido < total para efectivo
        """
        if self.es_pago_digital:
            # Pagos digitales son exactos, no hay cambio
            self.monto_recibido = None
            self.cambio = Decimal('0.00')
        elif self.es_pago_efectivo:
            # Efectivo: validar y calcular cambio
            if self.monto_recibido is None:
                raise ValueError('Para pagos en efectivo, debe especificar el monto recibido')

            if self.monto_recibido < self.total:
                raise ValueError(f'El monto recibido ({self.monto_recibido}) es menor que el total ({self.total})')

            self.cambio = (self.monto_recibido - self.total).quantize(Decimal('0.01'))

    # === MÉTODOS DE GESTIÓN ===

    def generar_numero_venta(self):
        """
        Genera número de venta único en formato V-YYYYMMDD-XXXX

        Busca el último número del día y genera el siguiente.

        Returns:
            str: Número de venta generado (ej: V-20251101-0001)
        """
        hoy = date.today()
        prefijo = f"V-{hoy.strftime('%Y%m%d')}"

        # Buscar el último número del día
        ultima_venta = Venta.query.filter(
            Venta.numero_venta.like(f'{prefijo}-%')
        ).order_by(Venta.numero_venta.desc()).first()

        if ultima_venta:
            # Extraer el número secuencial
            ultimo_numero = int(ultima_venta.numero_venta.split('-')[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1

        self.numero_venta = f"{prefijo}-{nuevo_numero:04d}"
        return self.numero_venta

    def validar(self):
        """
        Valida la venta completa

        Verifica:
        - Totales correctos
        - Descuento válido
        - Cambio correcto (si es efectivo)

        Raises:
            ValueError: Si alguna validación falla
        """
        # Validar descuento
        if self.descuento and self.descuento > self.subtotal:
            raise ValueError('El descuento no puede ser mayor que el subtotal')

        # Validar total (sin IGV - ya incluido en precios)
        total_esperado = (self.subtotal - (self.descuento or Decimal('0.00'))).quantize(Decimal('0.01'))

        if abs(self.total - total_esperado) > Decimal('0.02'):
            raise ValueError(f'El total calculado ({total_esperado}) no coincide con el total de la venta ({self.total})')

        # Validar cambio según método de pago
        if self.es_pago_efectivo:
            if self.monto_recibido is None:
                raise ValueError('Para pagos en efectivo debe especificar el monto recibido')

            if self.monto_recibido < self.total:
                raise ValueError(f'El monto recibido ({self.monto_recibido}) es menor que el total ({self.total})')

            cambio_esperado = (self.monto_recibido - self.total).quantize(Decimal('0.01'))
            if self.cambio != cambio_esperado:
                raise ValueError(f'El cambio calculado ({cambio_esperado}) no coincide con el cambio de la venta ({self.cambio})')

        elif self.es_pago_digital:
            # Pagos digitales no deben tener monto_recibido ni cambio
            if self.monto_recibido and self.monto_recibido > 0:
                raise ValueError('Los pagos digitales no requieren monto recibido')

            if self.cambio and self.cambio > 0:
                raise ValueError('Los pagos digitales no generan cambio')

    def cancelar(self, motivo=None):
        """
        Cancela la venta

        Args:
            motivo (str): Motivo de la cancelación (se guarda en notas)
        """
        self.estado = 'cancelada'

        if motivo:
            if self.notas:
                self.notas += f"\n[CANCELADA] {motivo}"
            else:
                self.notas = f"[CANCELADA] {motivo}"

    def marcar_como_sincronizada(self):
        """Marca la venta como sincronizada a la nube"""
        self.synced = True

    def agregar_detalle(self, producto, cantidad, precio, lote_id=None):
        """
        Agrega un detalle a la venta (placeholder)

        Este método se implementará completamente cuando se cree DetalleVenta.

        Args:
            producto: Instancia de Product
            cantidad (int): Cantidad vendida
            precio (Decimal): Precio unitario
            lote_id (int): ID del lote (opcional)
        """
        # Este método se completará cuando se cree el modelo DetalleVenta
        pass

    # === MÉTODOS DE SERIALIZACIÓN ===

    def to_dict(self, include_detalles=False):
        """
        Convierte la venta a diccionario

        Args:
            include_detalles (bool): Si True, incluye los detalles de la venta

        Returns:
            dict: Diccionario con los datos de la venta
        """
        data = {
            'id': self.id,
            'numero_venta': self.numero_venta,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'subtotal': float(self.subtotal) if self.subtotal else 0.0,
            'descuento': float(self.descuento) if self.descuento else 0.0,
            'total': float(self.total) if self.total else 0.0,
            'metodo_pago': self.metodo_pago,
            'monto_recibido': float(self.monto_recibido) if self.monto_recibido else None,
            'cambio': float(self.cambio) if self.cambio else 0.0,
            'cliente_nombre': self.cliente_nombre,
            'cliente_dni': self.cliente_dni,
            'vendedor_id': self.vendedor_id,
            'estado': self.estado,
            'notas': self.notas,
            'created_offline': self.created_offline,
            'synced': self.synced,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Propiedades calculadas
            'cantidad_items': self.cantidad_items,
            'es_pago_digital': self.es_pago_digital,
            'es_pago_efectivo': self.es_pago_efectivo,
            'fue_creada_hoy': self.fue_creada_hoy,
            'dias_desde_venta': self.dias_desde_venta,
        }

        if include_detalles and hasattr(self, 'detalles'):
            data['detalles'] = [
                detalle.to_dict() for detalle in self.detalles
            ] if self.detalles else []

        return data

    # === MÉTODOS DE CLASE (QUERIES) ===

    @classmethod
    def ventas_del_dia(cls, fecha=None):
        """
        Retorna todas las ventas de un día específico

        Args:
            fecha (date): Fecha a buscar (default: hoy en UTC)

        Returns:
            list[Venta]: Lista de ventas del día
        """
        if fecha is None:
            # Usar fecha UTC porque las ventas se guardan en UTC
            fecha = datetime.now(timezone.utc).date()

        # Convertir fecha a datetime UTC naive (SQLite no guarda tzinfo)
        inicio = datetime.combine(fecha, datetime.min.time())
        fin = datetime.combine(fecha, datetime.max.time())

        return cls.query.filter(
            cls.fecha >= inicio,
            cls.fecha <= fin,
            cls.estado != 'cancelada'
        ).all()

    @classmethod
    def ventas_por_vendedor(cls, vendedor_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna ventas de un vendedor en un periodo

        Args:
            vendedor_id (int): ID del vendedor
            fecha_inicio (date): Fecha de inicio (default: hoy en UTC)
            fecha_fin (date): Fecha de fin (default: hoy en UTC)

        Returns:
            list[Venta]: Lista de ventas del vendedor
        """
        if fecha_inicio is None:
            # Usar fecha UTC porque las ventas se guardan en UTC
            fecha_inicio = datetime.now(timezone.utc).date()
        if fecha_fin is None:
            fecha_fin = datetime.now(timezone.utc).date()

        # Convertir a datetime UTC naive (SQLite no guarda tzinfo)
        inicio = datetime.combine(fecha_inicio, datetime.min.time())
        fin = datetime.combine(fecha_fin, datetime.max.time())

        return cls.query.filter(
            cls.vendedor_id == vendedor_id,
            cls.fecha >= inicio,
            cls.fecha <= fin,
            cls.estado != 'cancelada'
        ).all()

    @classmethod
    def ventas_por_metodo_pago(cls, metodo):
        """
        Retorna ventas por método de pago

        Args:
            metodo (str): Método de pago ('efectivo', 'yape', 'plin', 'transferencia')

        Returns:
            list[Venta]: Lista de ventas con ese método de pago
        """
        return cls.query.filter(
            cls.metodo_pago == metodo,
            cls.estado != 'cancelada'
        ).all()

    @classmethod
    def ventas_digitales(cls):
        """Retorna ventas con métodos de pago digitales (yape/plin/transferencia)"""
        return cls.query.filter(
            cls.metodo_pago.in_(['yape', 'plin', 'transferencia']),
            cls.estado != 'cancelada'
        ).all()

    @classmethod
    def ventas_efectivo(cls):
        """Retorna ventas en efectivo"""
        return cls.query.filter(
            cls.metodo_pago == 'efectivo',
            cls.estado != 'cancelada'
        ).all()

    @classmethod
    def ventas_pendientes_sync(cls):
        """Retorna ventas pendientes de sincronización"""
        return cls.query.filter(
            cls.created_offline == True,
            cls.synced == False
        ).all()

    @classmethod
    def ventas_por_periodo(cls, fecha_inicio, fecha_fin):
        """
        Retorna ventas en un periodo

        Args:
            fecha_inicio (date): Fecha de inicio
            fecha_fin (date): Fecha de fin

        Returns:
            list[Venta]: Lista de ventas en el periodo
        """
        inicio = datetime.combine(fecha_inicio, datetime.min.time())
        fin = datetime.combine(fecha_fin, datetime.max.time())

        return cls.query.filter(
            cls.fecha >= inicio,
            cls.fecha <= fin,
            cls.estado != 'cancelada'
        ).all()

    @classmethod
    def total_ventas_dia(cls, fecha=None):
        """
        Retorna el total de ventas de un día

        Args:
            fecha (date): Fecha a buscar (default: hoy en UTC)

        Returns:
            Decimal: Suma total de ventas del día
        """
        if fecha is None:
            # Usar fecha UTC porque las ventas se guardan en UTC
            fecha = datetime.now(timezone.utc).date()

        # Convertir a datetime UTC naive (SQLite no guarda tzinfo)
        inicio = datetime.combine(fecha, datetime.min.time())
        fin = datetime.combine(fecha, datetime.max.time())

        resultado = db.session.query(func.sum(cls.total)).filter(
            cls.fecha >= inicio,
            cls.fecha <= fin,
            cls.estado != 'cancelada'
        ).scalar()

        return Decimal(str(resultado)) if resultado else Decimal('0.00')

    @classmethod
    def cantidad_ventas_dia(cls, fecha=None):
        """
        Retorna la cantidad de ventas de un día

        Args:
            fecha (date): Fecha a buscar (default: hoy en UTC)

        Returns:
            int: Cantidad de ventas del día
        """
        if fecha is None:
            # Usar fecha UTC porque las ventas se guardan en UTC
            fecha = datetime.now(timezone.utc).date()

        # Convertir a datetime UTC naive (SQLite no guarda tzinfo)
        inicio = datetime.combine(fecha, datetime.min.time())
        fin = datetime.combine(fecha, datetime.max.time())

        return cls.query.filter(
            cls.fecha >= inicio,
            cls.fecha <= fin,
            cls.estado != 'cancelada'
        ).count()

    @classmethod
    def ventas_canceladas(cls):
        """Retorna todas las ventas canceladas"""
        return cls.query.filter(cls.estado == 'cancelada').all()

    @classmethod
    def ultimas_ventas(cls, limit=10):
        """
        Retorna las últimas ventas

        Args:
            limit (int): Cantidad de ventas a retornar (default: 10)

        Returns:
            list[Venta]: Lista de últimas ventas
        """
        return cls.query.filter(
            cls.estado != 'cancelada'
        ).order_by(cls.fecha.desc()).limit(limit).all()

    @classmethod
    def buscar_por_numero(cls, numero_venta):
        """
        Busca una venta por número

        Args:
            numero_venta (str): Número de venta (ej: V-20251101-0001)

        Returns:
            Venta: Venta encontrada o None
        """
        return cls.query.filter_by(numero_venta=numero_venta).first()

    # === REPRESENTACIONES ===

    def __repr__(self):
        return f'<Venta {self.numero_venta}: S/ {self.total} ({self.metodo_pago})>'

    def __str__(self):
        return f'Venta {self.numero_venta} - S/ {self.total} - {self.metodo_pago} - {self.estado}'
