"""
KATITA-POS - Models Package
===========================
Módulo para importar todos los modelos de la base de datos
"""

from app.models.product import Product
from app.models.lote import Lote
from app.models.user import User

# Cuando se creen más modelos, importarlos aquí:
# from app.models.sale import Sale
# from app.models.category import Category
# from app.models.movimiento_stock import MovimientoStock

__all__ = ['Product', 'Lote', 'User']
