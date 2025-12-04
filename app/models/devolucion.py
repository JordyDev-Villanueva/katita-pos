"""
Modelo de Devoluciones para KATITA-POS

Registra las devoluciones de ventas con reversión automática de inventario.
"""

from app import db
from datetime import datetime


class Devolucion(db.Model):
    """
    Modelo de Devolución de Venta

    Registra cuando una venta es devuelta/anulada.
    Revierte automáticamente el stock y el dinero del cuadro de caja.
    """
    __tablename__ = 'devoluciones'

    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('ventas.id'), nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vendedor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Datos de la devolución
    motivo = db.Column(db.String(200), nullable=False)  # "Cliente insatisfecho", "Producto defectuoso", etc.
    observaciones = db.Column(db.Text, nullable=True)
    monto_devuelto = db.Column(db.Numeric(10, 2), nullable=False)

    # Timestamps
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    venta = db.relationship('Venta', backref='devoluciones', foreign_keys=[venta_id])
    admin = db.relationship('User', foreign_keys=[admin_id])
    vendedor = db.relationship('User', foreign_keys=[vendedor_id])

    def __repr__(self):
        return f'<Devolucion {self.id} - Venta #{self.venta_id} - S/{self.monto_devuelto}>'

    def to_dict(self):
        """Convierte la devolución a diccionario"""
        return {
            'id': self.id,
            'venta_id': self.venta_id,
            'admin_id': self.admin_id,
            'admin_nombre': self.admin.nombre_completo if self.admin else None,
            'vendedor_id': self.vendedor_id,
            'vendedor_nombre': self.vendedor.nombre_completo if self.vendedor else None,
            'motivo': self.motivo,
            'observaciones': self.observaciones,
            'monto_devuelto': float(self.monto_devuelto),
            'fecha': self.fecha.isoformat() if self.fecha else None
        }

    @staticmethod
    def crear_devolucion(venta_id, admin_id, motivo, observaciones=None):
        """
        Crea una nueva devolución y revierte el inventario

        Args:
            venta_id: ID de la venta a devolver
            admin_id: ID del admin que aprueba la devolución
            motivo: Motivo de la devolución
            observaciones: Observaciones adicionales

        Returns:
            Devolucion: La devolución creada

        Raises:
            ValueError: Si la venta no existe o ya fue devuelta
        """
        from app.models.venta import Venta

        # Verificar que la venta existe
        venta = Venta.query.get(venta_id)
        if not venta:
            raise ValueError('La venta no existe')

        # Verificar que la venta no haya sido devuelta ya
        devolucion_existente = Devolucion.query.filter_by(venta_id=venta_id).first()
        if devolucion_existente:
            raise ValueError('Esta venta ya fue devuelta anteriormente')

        # Crear la devolución
        devolucion = Devolucion(
            venta_id=venta_id,
            admin_id=admin_id,
            vendedor_id=venta.vendedor_id,
            motivo=motivo,
            observaciones=observaciones,
            monto_devuelto=venta.total
        )

        db.session.add(devolucion)

        # Marcar la venta como devuelta (agregar campo en modelo Venta)
        venta.devuelta = True

        return devolucion
