"""
Blueprint de Devoluciones para KATITA-POS

Gestiona devoluciones de ventas con reversión automática de inventario.
Solo accesible para administradores.
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
from app import db
from app.models.devolucion import Devolucion
from app.models.venta import Venta
from app.models.detalle_venta import DetalleVenta
from app.models.producto import Product
from app.models.lote import Lote
from app.models.cuadro_caja import CuadroCaja
from app.decorators.auth_decorators import login_required, role_required

devoluciones_bp = Blueprint('devoluciones', __name__, url_prefix='/api/devoluciones')


# ===========================
# HANDLER PARA OPTIONS (CORS Preflight)
# ===========================

@devoluciones_bp.route('/', methods=['OPTIONS'])
@devoluciones_bp.route('/<int:devolucion_id>', methods=['OPTIONS'])
def handle_options(devolucion_id=None):
    """Maneja peticiones OPTIONS para CORS preflight"""
    return '', 204


# ===========================
# CREAR DEVOLUCIÓN
# ===========================

@devoluciones_bp.route('/', methods=['POST'])
@login_required
@role_required('admin')
def crear_devolucion():
    """
    POST /api/devoluciones/

    Crea una devolución y revierte el inventario automáticamente.
    Solo admin puede aprobar devoluciones.

    Body:
    {
        "venta_id": 123,
        "motivo": "Cliente insatisfecho",
        "observaciones": "Producto defectuoso"
    }

    Returns:
        {
            "success": true,
            "message": "Devolución procesada exitosamente",
            "devolucion": {...},
            "stock_revertido": [...]
        }
    """
    try:
        data = request.get_json()

        # Validar campos requeridos
        if 'venta_id' not in data or not data['venta_id']:
            return jsonify({
                'success': False,
                'error': 'El ID de la venta es requerido'
            }), 400

        if 'motivo' not in data or not data['motivo']:
            return jsonify({
                'success': False,
                'error': 'El motivo de la devolución es requerido'
            }), 400

        venta_id = data['venta_id']
        motivo = data['motivo']
        observaciones = data.get('observaciones')

        # Verificar que la venta existe
        venta = Venta.query.get(venta_id)
        if not venta:
            return jsonify({
                'success': False,
                'error': 'La venta no existe'
            }), 404

        # Verificar que la venta no esté ya devuelta
        if venta.devuelta:
            return jsonify({
                'success': False,
                'error': 'Esta venta ya fue devuelta anteriormente'
            }), 400

        # Crear la devolución usando el método estático
        admin_id = g.current_user['user_id']
        devolucion = Devolucion.crear_devolucion(
            venta_id=venta_id,
            admin_id=admin_id,
            motivo=motivo,
            observaciones=observaciones
        )

        # === REVERSIÓN DE INVENTARIO ===
        # Por cada producto en la venta, devolver el stock
        stock_revertido = []

        for detalle in venta.detalles:
            producto = Product.query.get(detalle.producto_id)
            if not producto:
                continue

            # Aumentar stock del producto
            cantidad_devuelta = detalle.cantidad
            producto.stock_actual += cantidad_devuelta

            # Si había un lote asociado, también revertir su stock
            if detalle.lote_id:
                lote = Lote.query.get(detalle.lote_id)
                if lote:
                    lote.cantidad_disponible += cantidad_devuelta

            stock_revertido.append({
                'producto_id': producto.id,
                'producto_nombre': producto.nombre,
                'cantidad_devuelta': cantidad_devuelta,
                'stock_anterior': producto.stock_actual - cantidad_devuelta,
                'stock_nuevo': producto.stock_actual
            })

        # === REVERSIÓN DEL CUADRO DE CAJA ===
        # Restar el monto de la venta del cuadro de caja del vendedor
        if venta.cuadro_caja_id:
            cuadro = CuadroCaja.query.get(venta.cuadro_caja_id)
            if cuadro and cuadro.estado == 'abierto':
                # Restar del método de pago correspondiente
                if venta.metodo_pago == 'efectivo':
                    cuadro.efectivo -= venta.total
                elif venta.metodo_pago == 'yape':
                    cuadro.yape -= venta.total
                elif venta.metodo_pago == 'plin':
                    cuadro.plin -= venta.total
                elif venta.metodo_pago == 'transferencia':
                    cuadro.transferencia -= venta.total

                # Recalcular total del cuadro
                cuadro.calcular_totales()

        # Guardar todos los cambios
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Devolución procesada exitosamente',
            'devolucion': devolucion.to_dict(),
            'stock_revertido': stock_revertido
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Error al procesar devolución: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al procesar devolución: {str(e)}'
        }), 500


# ===========================
# LISTAR TODAS LAS DEVOLUCIONES
# ===========================

@devoluciones_bp.route('/', methods=['GET'])
@login_required
@role_required('admin')
def get_devoluciones():
    """
    GET /api/devoluciones/

    Lista todas las devoluciones del sistema (solo admin)

    Query params:
    - fecha_inicio: Filtrar desde fecha (YYYY-MM-DD)
    - fecha_fin: Filtrar hasta fecha (YYYY-MM-DD)
    - vendedor_id: Filtrar por vendedor
    """
    try:
        # Query base
        query = Devolucion.query

        # Filtro por fecha
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        if fecha_inicio:
            query = query.filter(Devolucion.fecha >= fecha_inicio)

        if fecha_fin:
            query = query.filter(Devolucion.fecha <= fecha_fin)

        # Filtro por vendedor
        vendedor_id = request.args.get('vendedor_id')
        if vendedor_id:
            query = query.filter(Devolucion.vendedor_id == vendedor_id)

        # Ordenar por fecha (más recientes primero)
        devoluciones = query.order_by(Devolucion.fecha.desc()).all()

        return jsonify({
            'success': True,
            'devoluciones': [d.to_dict() for d in devoluciones],
            'total': len(devoluciones)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al listar devoluciones: {str(e)}'
        }), 500


# ===========================
# OBTENER DEVOLUCIÓN POR ID
# ===========================

@devoluciones_bp.route('/<int:devolucion_id>', methods=['GET'])
@login_required
@role_required('admin')
def get_devolucion(devolucion_id):
    """
    GET /api/devoluciones/<id>

    Obtiene una devolución específica por ID (solo admin)
    """
    try:
        devolucion = Devolucion.query.get(devolucion_id)

        if not devolucion:
            return jsonify({
                'success': False,
                'error': 'Devolución no encontrada'
            }), 404

        # Incluir datos de la venta devuelta
        devolucion_dict = devolucion.to_dict()
        devolucion_dict['venta'] = devolucion.venta.to_dict(include_detalles=True)

        return jsonify({
            'success': True,
            'devolucion': devolucion_dict
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener devolución: {str(e)}'
        }), 500
