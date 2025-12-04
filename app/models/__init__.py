"""
KATITA-POS - Models Package
===========================
Módulo para importar todos los modelos de la base de datos
"""

from app.models.product import Product
from app.models.lote import Lote
from app.models.user import User
from app.models.venta import Venta
from app.models.detalle_venta import DetalleVenta
from app.models.movimiento_stock import MovimientoStock
from app.models.sync_queue import SyncQueue
from app.models.cuadro_caja import CuadroCaja
from app.models.devolucion import Devolucion  # FASE 8: Sistema de devoluciones
from app.models.ajuste_inventario import AjusteInventario  # FASE 8: Ajustes de inventario

# Cuando se creen más modelos, importarlos aquí:
# from app.models.category import Category

__all__ = [
    'Product',
    'Lote',
    'User',
    'Venta',
    'DetalleVenta',
    'MovimientoStock',
    'SyncQueue',
    'CuadroCaja',
    'Devolucion',
    'AjusteInventario'
]
