"""
Modelo de Ajustes de Inventario para KATITA-POS

Registra ajustes manuales de stock por mermas, roturas, robos o toma física.
"""

from app import db
from datetime import datetime


class AjusteInventario(db.Model):
    """
    Modelo de Ajuste de Inventario

    Registra cuando el admin hace correcciones de stock por:
    - Mermas (productos vencidos/dañados)
    - Roturas
    - Robos
    - Errores de conteo
    - Toma de inventario física (comparar sistema vs realidad)
    """
    __tablename__ = 'ajustes_inventario'

    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    lote_id = db.Column(db.Integer, db.ForeignKey('lotes.id'), nullable=True)  # Opcional
    admin_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Datos del ajuste
    cantidad_anterior = db.Column(db.Integer, nullable=False)
    cantidad_nueva = db.Column(db.Integer, nullable=False)
    diferencia = db.Column(db.Integer, nullable=False)  # Puede ser + o -

    # Tipo de ajuste
    tipo_ajuste = db.Column(
        db.Enum('merma', 'rotura', 'robo', 'error_conteo', 'inventario_fisico', name='tipo_ajuste_enum'),
        nullable=False
    )

    # Detalles
    motivo = db.Column(db.Text, nullable=False)
    observaciones = db.Column(db.Text, nullable=True)

    # Timestamps
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    producto = db.relationship('Product', backref='ajustes')
    lote = db.relationship('Lote', backref='ajustes')
    admin = db.relationship('User', backref='ajustes_realizados')

    def __repr__(self):
        signo = '+' if self.diferencia > 0 else ''
        return f'<AjusteInventario {self.id} - {self.producto.nombre} - {signo}{self.diferencia}>'

    def to_dict(self):
        """Convierte el ajuste a diccionario"""
        return {
            'id': self.id,
            'producto_id': self.producto_id,
            'producto_nombre': self.producto.nombre if self.producto else None,
            'lote_id': self.lote_id,
            'lote_numero': self.lote.numero_lote if self.lote else None,
            'admin_id': self.admin_id,
            'admin_nombre': self.admin.nombre_completo if self.admin else None,
            'cantidad_anterior': self.cantidad_anterior,
            'cantidad_nueva': self.cantidad_nueva,
            'diferencia': self.diferencia,
            'tipo_ajuste': self.tipo_ajuste,
            'motivo': self.motivo,
            'observaciones': self.observaciones,
            'fecha': self.fecha.isoformat() if self.fecha else None
        }

    @staticmethod
    def crear_ajuste(producto_id, admin_id, cantidad_nueva, tipo_ajuste, motivo, lote_id=None, observaciones=None):
        """
        Crea un nuevo ajuste de inventario

        Args:
            producto_id: ID del producto a ajustar
            admin_id: ID del admin que realiza el ajuste
            cantidad_nueva: Nueva cantidad del producto
            tipo_ajuste: Tipo de ajuste (merma, rotura, robo, error_conteo, inventario_fisico)
            motivo: Motivo del ajuste
            lote_id: ID del lote (opcional)
            observaciones: Observaciones adicionales

        Returns:
            AjusteInventario: El ajuste creado

        Raises:
            ValueError: Si el producto no existe o los datos son inválidos
        """
        from app.models.product import Product

        # Verificar que el producto existe
        producto = Product.query.get(producto_id)
        if not producto:
            raise ValueError('El producto no existe')

        # Validar cantidad nueva
        if cantidad_nueva < 0:
            raise ValueError('La cantidad nueva no puede ser negativa')

        # Validar tipo de ajuste
        tipos_validos = ['merma', 'rotura', 'robo', 'error_conteo', 'inventario_fisico']
        if tipo_ajuste not in tipos_validos:
            raise ValueError(f'Tipo de ajuste inválido. Debe ser: {", ".join(tipos_validos)}')

        # Calcular diferencia
        cantidad_anterior = producto.stock_actual
        diferencia = cantidad_nueva - cantidad_anterior

        # Crear el ajuste
        ajuste = AjusteInventario(
            producto_id=producto_id,
            lote_id=lote_id,
            admin_id=admin_id,
            cantidad_anterior=cantidad_anterior,
            cantidad_nueva=cantidad_nueva,
            diferencia=diferencia,
            tipo_ajuste=tipo_ajuste,
            motivo=motivo,
            observaciones=observaciones
        )

        db.session.add(ajuste)

        # Actualizar el stock del producto
        producto.stock_actual = cantidad_nueva

        return ajuste
