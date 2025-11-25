"""
Blueprint de Dashboard para KATITA-POS

Endpoint optimizado que retorna todas las estadísticas del dashboard en una sola petición.
Reduce significativamente el tiempo de carga al evitar múltiples requests HTTP.
"""

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, and_
from app import db
from app.models.venta import Venta
from app.models.detalle_venta import DetalleVenta
from app.models.product import Product
from app.models.lote import Lote

# Zona horaria de Perú (UTC-5)
PERU_TZ = timezone(timedelta(hours=-5))

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """
    Endpoint optimizado que retorna todas las estadísticas del dashboard en 1 sola petición.

    Retorna:
        - Ventas de hoy (total y ganancia)
        - Productos en stock
        - Lotes próximos a vencer (7 días)
        - Productos bajo stock
        - Lotes vencidos
        - Ventas últimos 7 días (para gráfico)

    Response:
        {
            "success": true,
            "data": {
                "ventas_hoy": {
                    "total": 150.50,
                    "cantidad": 5,
                    "ganancia": 45.20
                },
                "productos": {
                    "en_stock": 25,
                    "bajo_stock": 3
                },
                "lotes": {
                    "por_vencer": 2,
                    "vencidos": 1
                },
                "ventas_7_dias": [...]
            }
        }
    """
    try:
        # Obtener fecha de hoy en Perú
        hoy = datetime.now(PERU_TZ).date()
        hace_7_dias = hoy - timedelta(days=7)

        # ========== 1. VENTAS DE HOY ==========
        ventas_hoy = db.session.query(
            func.count(Venta.id).label('cantidad'),
            func.coalesce(func.sum(Venta.total), 0).label('total')
        ).filter(
            func.date(Venta.created_at) == hoy
        ).first()

        # Calcular ganancia de hoy
        ganancia_hoy = db.session.query(
            func.coalesce(
                func.sum((DetalleVenta.precio_unitario - DetalleVenta.precio_compra) * DetalleVenta.cantidad),
                0
            )
        ).join(Venta).filter(
            func.date(Venta.created_at) == hoy
        ).scalar() or 0

        # ========== 2. PRODUCTOS ==========
        productos_stats = db.session.query(
            func.count(Product.id).label('total'),
            func.sum(func.case((Product.stock_total > 0, 1), else_=0)).label('en_stock'),
            func.sum(func.case((Product.stock_total <= Product.stock_minimo, 1), else_=0)).label('bajo_stock')
        ).filter(Product.activo == True).first()

        # ========== 3. LOTES ==========
        hoy_mas_7 = hoy + timedelta(days=7)

        lotes_por_vencer = db.session.query(func.count(Lote.id)).filter(
            and_(
                Lote.fecha_vencimiento <= hoy_mas_7,
                Lote.fecha_vencimiento >= hoy,
                Lote.cantidad_actual > 0
            )
        ).scalar() or 0

        lotes_vencidos = db.session.query(func.count(Lote.id)).filter(
            and_(
                Lote.fecha_vencimiento < hoy,
                Lote.cantidad_actual > 0
            )
        ).scalar() or 0

        # ========== 4. VENTAS ÚLTIMOS 7 DÍAS (para gráfico) ==========
        ventas_7_dias_query = db.session.query(
            func.date(Venta.created_at).label('fecha'),
            func.count(Venta.id).label('cantidad'),
            func.coalesce(func.sum(Venta.total), 0).label('total')
        ).filter(
            func.date(Venta.created_at) >= hace_7_dias
        ).group_by(
            func.date(Venta.created_at)
        ).order_by(
            func.date(Venta.created_at).desc()
        ).all()

        ventas_7_dias = [
            {
                'fecha': v.fecha.isoformat(),
                'cantidad': v.cantidad,
                'total': float(v.total)
            }
            for v in ventas_7_dias_query
        ]

        # ========== 5. TOP 5 PRODUCTOS BAJO STOCK ==========
        productos_bajo_stock = Product.query.filter(
            and_(
                Product.activo == True,
                Product.stock_total <= Product.stock_minimo
            )
        ).order_by(Product.stock_total.asc()).limit(5).all()

        productos_bajo_stock_list = [
            {
                'id': p.id,
                'nombre': p.nombre,
                'stock_total': p.stock_total,
                'stock_minimo': p.stock_minimo
            }
            for p in productos_bajo_stock
        ]

        # ========== 6. LOTES POR VENCER (detalles) ==========
        lotes_por_vencer_query = Lote.query.filter(
            and_(
                Lote.fecha_vencimiento <= hoy_mas_7,
                Lote.fecha_vencimiento >= hoy,
                Lote.cantidad_actual > 0
            )
        ).order_by(Lote.fecha_vencimiento.asc()).limit(5).all()

        lotes_por_vencer_list = [
            {
                'id': lote.id,
                'codigo_lote': lote.codigo_lote,
                'producto_id': lote.producto_id,
                'producto_nombre': lote.producto.nombre if lote.producto else 'Desconocido',
                'cantidad_actual': lote.cantidad_actual,
                'fecha_vencimiento': lote.fecha_vencimiento.isoformat(),
                'dias_para_vencer': (lote.fecha_vencimiento - hoy).days
            }
            for lote in lotes_por_vencer_query
        ]

        # ========== CONSTRUIR RESPUESTA ==========
        response = {
            'success': True,
            'data': {
                'ventas_hoy': {
                    'total': float(ventas_hoy.total),
                    'cantidad': ventas_hoy.cantidad,
                    'ganancia': float(ganancia_hoy)
                },
                'productos': {
                    'total': productos_stats.total or 0,
                    'en_stock': int(productos_stats.en_stock or 0),
                    'bajo_stock': int(productos_stats.bajo_stock or 0),
                    'bajo_stock_lista': productos_bajo_stock_list
                },
                'lotes': {
                    'por_vencer': lotes_por_vencer,
                    'vencidos': lotes_vencidos,
                    'por_vencer_lista': lotes_por_vencer_list
                },
                'ventas_ultimos_7_dias': ventas_7_dias,
                'fecha_actual': hoy.isoformat(),
                'cache_timestamp': datetime.now(PERU_TZ).isoformat()
            }
        }

        return jsonify(response), 200

    except Exception as e:
        from flask import current_app
        import traceback
        current_app.logger.error(f"[DASHBOARD] Error: {str(e)}")
        current_app.logger.error(f"[DASHBOARD] Traceback: {traceback.format_exc()}")

        return jsonify({
            'success': False,
            'message': 'Error al obtener estadísticas del dashboard',
            'error': str(e)
        }), 500
