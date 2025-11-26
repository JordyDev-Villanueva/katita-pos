"""
Modelo CuadroCaja para KATITA-POS

Define la estructura para el registro de turnos de caja.
Permite apertura, seguimiento de ventas por método de pago, registro de egresos,
y cierre con arqueo de caja.
"""

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import (
    CheckConstraint, String, Integer,
    Boolean, DateTime, Text, Numeric, func, Index
)
from sqlalchemy.orm import validates, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app import db

# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))


class CuadroCaja(db.Model):
    """
    Modelo para turnos de caja del sistema KATITA-POS

    Gestiona:
    - Apertura de turno con monto inicial
    - Seguimiento automático de ventas por método de pago
    - Registro de egresos (gastos del turno)
    - Cierre con arqueo de caja y cálculo de diferencias
    """

    __tablename__ = 'cuadros_caja'

    # === CAMPOS ===

    id = db.Column(Integer, primary_key=True, autoincrement=True)

    # Identificación del turno
    numero_turno = db.Column(String(30), unique=True, nullable=False, index=True)
    vendedor_id = db.Column(Integer, db.ForeignKey('users.id'), nullable=False, index=True)

    # Fechas y horarios
    fecha_apertura = db.Column(DateTime, default=lambda: datetime.now(PERU_TZ), nullable=False, index=True)
    fecha_cierre = db.Column(DateTime, nullable=True)

    # Montos de apertura
    monto_inicial = db.Column(Numeric(10, 2), nullable=False, default=Decimal('0.00'))

    # Ventas por método de pago (se calculan automáticamente)
    total_efectivo = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    total_yape = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    total_plin = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    total_transferencia = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)

    # Egresos (gastos durante el turno)
    total_egresos = db.Column(Numeric(10, 2), default=Decimal('0.00'), nullable=False)
    detalle_egresos = db.Column(Text, nullable=True)  # JSON con lista de egresos

    # Cierre de caja
    efectivo_esperado = db.Column(Numeric(10, 2), nullable=True)  # Calculado: inicial + ventas_efectivo - egresos
    efectivo_contado = db.Column(Numeric(10, 2), nullable=True)   # Lo que realmente hay en caja
    diferencia = db.Column(Numeric(10, 2), nullable=True)         # contado - esperado

    # Estado y observaciones
    estado = db.Column(String(20), default='abierto', nullable=False, index=True)  # 'abierto', 'cerrado'
    observaciones = db.Column(Text, nullable=True)

    # Timestamps
    created_at = db.Column(DateTime, default=lambda: datetime.now(PERU_TZ), nullable=False)
    updated_at = db.Column(
        DateTime,
        default=lambda: datetime.now(PERU_TZ),
        onupdate=lambda: datetime.now(PERU_TZ),
        nullable=False
    )

    # === RELACIONES ===

    vendedor = relationship('User', backref='cuadros_caja')

    # === CONSTRAINTS ===

    __table_args__ = (
        CheckConstraint('monto_inicial >= 0', name='check_monto_inicial_no_negativo'),
        CheckConstraint('total_efectivo >= 0', name='check_total_efectivo_no_negativo'),
        CheckConstraint('total_yape >= 0', name='check_total_yape_no_negativo'),
        CheckConstraint('total_plin >= 0', name='check_total_plin_no_negativo'),
        CheckConstraint('total_transferencia >= 0', name='check_total_transferencia_no_negativo'),
        CheckConstraint('total_egresos >= 0', name='check_total_egresos_no_negativo'),
        CheckConstraint(
            "estado IN ('abierto', 'cerrado')",
            name='check_estado_valido'
        ),
        Index('idx_vendedor_fecha', 'vendedor_id', 'fecha_apertura'),
        Index('idx_estado_fecha', 'estado', 'fecha_apertura'),
    )

    # === CONSTRUCTOR ===

    def __init__(self, **kwargs):
        """Constructor del modelo CuadroCaja"""
        # Generar número de turno si no se proporciona
        if 'numero_turno' not in kwargs:
            kwargs['numero_turno'] = self._generar_numero_turno_temp()

        super(CuadroCaja, self).__init__(**kwargs)

        # Establecer valores por defecto
        if self.estado is None:
            self.estado = 'abierto'

        if self.monto_inicial is None:
            self.monto_inicial = Decimal('0.00')

        for campo in ['total_efectivo', 'total_yape', 'total_plin', 'total_transferencia', 'total_egresos']:
            if getattr(self, campo) is None:
                setattr(self, campo, Decimal('0.00'))

    def _generar_numero_turno_temp(self):
        """Genera número temporal (será reemplazado por generar_numero_turno())"""
        return f"T-{datetime.now().strftime('%Y%m%d')}-TEMP"

    # === VALIDACIONES AUTOMÁTICAS ===

    @validates('estado')
    def validate_estado(self, key, estado):
        """Valida que el estado sea válido"""
        estados_validos = ['abierto', 'cerrado']

        if not estado or estado not in estados_validos:
            raise ValueError(f'El estado debe ser uno de: {", ".join(estados_validos)}')

        return estado

    @validates('monto_inicial')
    def validate_monto_inicial(self, key, monto_inicial):
        """Valida que el monto inicial no sea negativo"""
        if monto_inicial is not None and monto_inicial < 0:
            raise ValueError('El monto inicial no puede ser negativo')

        return monto_inicial

    # === PROPIEDADES CALCULADAS ===

    @hybrid_property
    def total_ventas(self):
        """Retorna el total de ventas de todos los métodos de pago"""
        return (
            (self.total_efectivo or Decimal('0.00')) +
            (self.total_yape or Decimal('0.00')) +
            (self.total_plin or Decimal('0.00')) +
            (self.total_transferencia or Decimal('0.00'))
        )

    @hybrid_property
    def total_ventas_digitales(self):
        """Retorna el total de ventas con métodos digitales (yape + plin + transferencia)"""
        return (
            (self.total_yape or Decimal('0.00')) +
            (self.total_plin or Decimal('0.00')) +
            (self.total_transferencia or Decimal('0.00'))
        )

    @hybrid_property
    def esta_abierto(self):
        """Verifica si el turno está abierto"""
        return self.estado == 'abierto'

    @hybrid_property
    def esta_cerrado(self):
        """Verifica si el turno está cerrado"""
        return self.estado == 'cerrado'

    @hybrid_property
    def duracion_turno(self):
        """Retorna la duración del turno en horas"""
        if not self.fecha_apertura:
            return 0

        fecha_fin = self.fecha_cierre if self.fecha_cierre else datetime.now(PERU_TZ)
        delta = fecha_fin - self.fecha_apertura
        return round(delta.total_seconds() / 3600, 2)  # Horas con 2 decimales

    @hybrid_property
    def tiene_diferencia(self):
        """Verifica si hay diferencia entre efectivo esperado y contado"""
        return self.diferencia is not None and abs(self.diferencia) > Decimal('0.01')

    # === MÉTODOS DE GESTIÓN ===

    def generar_numero_turno(self):
        """
        Genera número de turno único en formato T-YYYYMMDD-XXXX

        Returns:
            str: Número de turno generado (ej: T-20251126-0001)
        """
        from datetime import date
        hoy = date.today()
        prefijo = f"T-{hoy.strftime('%Y%m%d')}"

        # Buscar el último número del día
        ultimo_turno = CuadroCaja.query.filter(
            CuadroCaja.numero_turno.like(f'{prefijo}-%')
        ).order_by(CuadroCaja.numero_turno.desc()).first()

        if ultimo_turno:
            # Extraer el número secuencial
            ultimo_numero = int(ultimo_turno.numero_turno.split('-')[-1])
            nuevo_numero = ultimo_numero + 1
        else:
            nuevo_numero = 1

        self.numero_turno = f"{prefijo}-{nuevo_numero:04d}"
        return self.numero_turno

    def calcular_efectivo_esperado(self):
        """
        Calcula el efectivo esperado en caja

        Fórmula: monto_inicial + total_efectivo - total_egresos

        Returns:
            Decimal: Efectivo esperado
        """
        self.efectivo_esperado = (
            (self.monto_inicial or Decimal('0.00')) +
            (self.total_efectivo or Decimal('0.00')) -
            (self.total_egresos or Decimal('0.00'))
        ).quantize(Decimal('0.01'))

        return self.efectivo_esperado

    def calcular_diferencia(self):
        """
        Calcula la diferencia entre efectivo contado y esperado

        Diferencia = efectivo_contado - efectivo_esperado
        - Positivo: Sobra dinero
        - Negativo: Falta dinero

        Returns:
            Decimal: Diferencia calculada
        """
        if self.efectivo_contado is None or self.efectivo_esperado is None:
            self.diferencia = None
            return None

        self.diferencia = (self.efectivo_contado - self.efectivo_esperado).quantize(Decimal('0.01'))
        return self.diferencia

    def registrar_venta(self, venta):
        """
        Registra una venta en el cuadro de caja

        Actualiza los totales según el método de pago.

        Args:
            venta (Venta): Instancia de Venta a registrar

        Raises:
            ValueError: Si el turno está cerrado o método de pago inválido
        """
        if self.estado == 'cerrado':
            raise ValueError('No se pueden registrar ventas en un turno cerrado')

        metodo = venta.metodo_pago
        monto = venta.total

        if metodo == 'efectivo':
            self.total_efectivo = (self.total_efectivo or Decimal('0.00')) + monto
        elif metodo == 'yape':
            self.total_yape = (self.total_yape or Decimal('0.00')) + monto
        elif metodo == 'plin':
            self.total_plin = (self.total_plin or Decimal('0.00')) + monto
        elif metodo == 'transferencia':
            self.total_transferencia = (self.total_transferencia or Decimal('0.00')) + monto
        else:
            raise ValueError(f'Método de pago inválido: {metodo}')

    def agregar_egreso(self, monto, concepto):
        """
        Agrega un egreso (gasto) al turno

        Args:
            monto (Decimal): Monto del egreso
            concepto (str): Descripción del egreso

        Raises:
            ValueError: Si el turno está cerrado o monto inválido
        """
        if self.estado == 'cerrado':
            raise ValueError('No se pueden agregar egresos a un turno cerrado')

        if monto <= 0:
            raise ValueError('El monto del egreso debe ser mayor a 0')

        # Actualizar total de egresos
        self.total_egresos = (self.total_egresos or Decimal('0.00')) + monto

        # Agregar a detalle de egresos (JSON simple)
        import json
        egresos_list = []

        if self.detalle_egresos:
            try:
                egresos_list = json.loads(self.detalle_egresos)
            except:
                egresos_list = []

        egresos_list.append({
            'monto': float(monto),
            'concepto': concepto,
            'fecha': datetime.now(PERU_TZ).isoformat()
        })

        self.detalle_egresos = json.dumps(egresos_list, ensure_ascii=False)

    def cerrar_turno(self, efectivo_contado, observaciones=None):
        """
        Cierra el turno de caja

        Args:
            efectivo_contado (Decimal): Monto de efectivo contado físicamente
            observaciones (str): Observaciones del cierre (opcional)

        Raises:
            ValueError: Si el turno ya está cerrado
        """
        if self.estado == 'cerrado':
            raise ValueError('El turno ya está cerrado')

        self.efectivo_contado = Decimal(str(efectivo_contado))
        self.calcular_efectivo_esperado()
        self.calcular_diferencia()

        self.fecha_cierre = datetime.now(PERU_TZ)
        self.estado = 'cerrado'

        if observaciones:
            self.observaciones = observaciones

    def reabrir_turno(self):
        """
        Reabre el turno (solo para correcciones administrativas)

        Raises:
            ValueError: Si el turno ya está abierto
        """
        if self.estado == 'abierto':
            raise ValueError('El turno ya está abierto')

        self.estado = 'abierto'
        self.fecha_cierre = None
        self.efectivo_contado = None
        self.diferencia = None

    # === MÉTODOS DE SERIALIZACIÓN ===

    def to_dict(self, include_vendedor=False):
        """
        Convierte el cuadro de caja a diccionario

        Args:
            include_vendedor (bool): Si True, incluye información del vendedor

        Returns:
            dict: Diccionario con los datos del cuadro de caja
        """
        import json

        # Parsear egresos si existen
        egresos = []
        if self.detalle_egresos:
            try:
                egresos = json.loads(self.detalle_egresos)
            except:
                egresos = []

        data = {
            'id': self.id,
            'numero_turno': self.numero_turno,
            'vendedor_id': self.vendedor_id,
            'fecha_apertura': self.fecha_apertura.isoformat() if self.fecha_apertura else None,
            'fecha_cierre': self.fecha_cierre.isoformat() if self.fecha_cierre else None,
            'monto_inicial': float(self.monto_inicial) if self.monto_inicial else 0.0,
            'total_efectivo': float(self.total_efectivo) if self.total_efectivo else 0.0,
            'total_yape': float(self.total_yape) if self.total_yape else 0.0,
            'total_plin': float(self.total_plin) if self.total_plin else 0.0,
            'total_transferencia': float(self.total_transferencia) if self.total_transferencia else 0.0,
            'total_egresos': float(self.total_egresos) if self.total_egresos else 0.0,
            'detalle_egresos': egresos,
            'efectivo_esperado': float(self.efectivo_esperado) if self.efectivo_esperado else None,
            'efectivo_contado': float(self.efectivo_contado) if self.efectivo_contado else None,
            'diferencia': float(self.diferencia) if self.diferencia else None,
            'estado': self.estado,
            'observaciones': self.observaciones,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # Propiedades calculadas
            'total_ventas': float(self.total_ventas),
            'total_ventas_digitales': float(self.total_ventas_digitales),
            'esta_abierto': self.esta_abierto,
            'esta_cerrado': self.esta_cerrado,
            'duracion_turno': self.duracion_turno,
            'tiene_diferencia': self.tiene_diferencia,
        }

        # Incluir información del vendedor si existe
        if include_vendedor and self.vendedor:
            data['vendedor_nombre'] = self.vendedor.nombre_completo
            data['vendedor_username'] = self.vendedor.username
        else:
            data['vendedor_nombre'] = None
            data['vendedor_username'] = None

        return data

    # === MÉTODOS DE CLASE (QUERIES) ===

    @classmethod
    def turno_abierto_vendedor(cls, vendedor_id):
        """
        Busca si existe un turno abierto para un vendedor

        Args:
            vendedor_id (int): ID del vendedor

        Returns:
            CuadroCaja: Turno abierto o None
        """
        return cls.query.filter_by(
            vendedor_id=vendedor_id,
            estado='abierto'
        ).first()

    @classmethod
    def turnos_del_dia(cls, fecha=None):
        """
        Retorna todos los turnos de un día específico

        Args:
            fecha (date): Fecha a buscar (default: hoy en Perú)

        Returns:
            list[CuadroCaja]: Lista de turnos del día
        """
        from datetime import date
        if fecha is None:
            fecha = datetime.now(PERU_TZ).date()

        inicio = datetime.combine(fecha, datetime.min.time())
        fin = datetime.combine(fecha, datetime.max.time())

        return cls.query.filter(
            cls.fecha_apertura >= inicio,
            cls.fecha_apertura <= fin
        ).order_by(cls.fecha_apertura.desc()).all()

    @classmethod
    def turnos_por_vendedor(cls, vendedor_id, fecha_inicio=None, fecha_fin=None):
        """
        Retorna turnos de un vendedor en un periodo

        Args:
            vendedor_id (int): ID del vendedor
            fecha_inicio (date): Fecha de inicio (default: hoy)
            fecha_fin (date): Fecha de fin (default: hoy)

        Returns:
            list[CuadroCaja]: Lista de turnos del vendedor
        """
        from datetime import date
        if fecha_inicio is None:
            fecha_inicio = datetime.now(PERU_TZ).date()
        if fecha_fin is None:
            fecha_fin = datetime.now(PERU_TZ).date()

        inicio = datetime.combine(fecha_inicio, datetime.min.time())
        fin = datetime.combine(fecha_fin, datetime.max.time())

        return cls.query.filter(
            cls.vendedor_id == vendedor_id,
            cls.fecha_apertura >= inicio,
            cls.fecha_apertura <= fin
        ).order_by(cls.fecha_apertura.desc()).all()

    @classmethod
    def turnos_abiertos(cls):
        """Retorna todos los turnos abiertos"""
        return cls.query.filter_by(estado='abierto').all()

    @classmethod
    def buscar_por_numero(cls, numero_turno):
        """
        Busca un turno por número

        Args:
            numero_turno (str): Número de turno (ej: T-20251126-0001)

        Returns:
            CuadroCaja: Turno encontrado o None
        """
        return cls.query.filter_by(numero_turno=numero_turno).first()

    # === REPRESENTACIONES ===

    def __repr__(self):
        return f'<CuadroCaja {self.numero_turno}: {self.estado} - S/ {self.total_ventas}>'

    def __str__(self):
        return f'Turno {self.numero_turno} - {self.estado} - Total: S/ {self.total_ventas}'
