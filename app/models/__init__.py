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

# Cuando se creen más modelos, importarlos aquí:
# from app.models.category import Category

__all__ = ['Product', 'Lote', 'User', 'Venta', 'DetalleVenta', 'MovimientoStock', 'SyncQueue', 'CuadroCaja']
