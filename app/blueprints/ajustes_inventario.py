"""
Blueprint de Ajustes de Inventario para KATITA-POS

Gestiona ajustes manuales de stock por mermas, roturas, robos o toma física.
Solo accesible para administradores.
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
from app import db
from app.models.ajuste_inventario import AjusteInventario
from app.models.producto import Product
from app.models.lote import Lote
from app.decorators.auth_decorators import login_required, role_required

ajustes_bp = Blueprint('ajustes_inventario', __name__, url_prefix='/api/ajustes-inventario')


# ===========================
# HANDLER PARA OPTIONS (CORS Preflight)
# ===========================

@ajustes_bp.route('/', methods=['OPTIONS'])
@ajustes_bp.route('/<int:ajuste_id>', methods=['OPTIONS'])
def handle_options(ajuste_id=None):
    """Maneja peticiones OPTIONS para CORS preflight"""
    return '', 204


# ===========================
# CREAR AJUSTE DE INVENTARIO
# ===========================

@ajustes_bp.route('/', methods=['POST'])
@login_required
@role_required('admin')
def crear_ajuste():
    """
    POST /api/ajustes-inventario/

    Crea un ajuste de inventario manual.
    Solo admin puede realizar ajustes.

    Body:
    {
        "producto_id": 123,
        "cantidad_nueva": 50,
        "tipo_ajuste": "merma|rotura|robo|error_conteo|inventario_fisico",
        "motivo": "Productos vencidos",
        "lote_id": 456,  // opcional
        "observaciones": "Detalles adicionales"  // opcional
    }

    Returns:
        {
            "success": true,
            "message": "Ajuste de inventario creado exitosamente",
            "ajuste": {...}
        }
    """
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['producto_id', 'cantidad_nueva', 'tipo_ajuste', 'motivo']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({
                    'success': False,
                    'error': f'El campo {field} es requerido'
                }), 400

        producto_id = data['producto_id']
        cantidad_nueva = data['cantidad_nueva']
        tipo_ajuste = data['tipo_ajuste']
        motivo = data['motivo']
        lote_id = data.get('lote_id')
        observaciones = data.get('observaciones')

        # Validar tipo de ajuste
        tipos_validos = ['merma', 'rotura', 'robo', 'error_conteo', 'inventario_fisico']
        if tipo_ajuste not in tipos_validos:
            return jsonify({
                'success': False,
                'error': f'Tipo de ajuste inválido. Debe ser: {", ".join(tipos_validos)}'
            }), 400

        # Validar cantidad nueva
        try:
            cantidad_nueva = int(cantidad_nueva)
            if cantidad_nueva < 0:
                raise ValueError('La cantidad no puede ser negativa')
        except ValueError as e:
            return jsonify({
                'success': False,
                'error': f'Cantidad nueva inválida: {str(e)}'
            }), 400

        # Crear el ajuste usando el método estático
        admin_id = g.current_user['user_id']
        ajuste = AjusteInventario.crear_ajuste(
            producto_id=producto_id,
            admin_id=admin_id,
            cantidad_nueva=cantidad_nueva,
            tipo_ajuste=tipo_ajuste,
            motivo=motivo,
            lote_id=lote_id,
            observaciones=observaciones
        )

        # Guardar en base de datos
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Ajuste de inventario creado exitosamente',
            'ajuste': ajuste.to_dict()
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Error al crear ajuste: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Error al crear ajuste: {str(e)}'
        }), 500


# ===========================
# LISTAR TODOS LOS AJUSTES
# ===========================

@ajustes_bp.route('/', methods=['GET'])
@login_required
@role_required('admin')
def get_ajustes():
    """
    GET /api/ajustes-inventario/

    Lista todos los ajustes de inventario (solo admin)

    Query params:
    - fecha_inicio: Filtrar desde fecha (YYYY-MM-DD)
    - fecha_fin: Filtrar hasta fecha (YYYY-MM-DD)
    - tipo_ajuste: Filtrar por tipo
    - producto_id: Filtrar por producto
    """
    try:
        # Query base
        query = AjusteInventario.query

        # Filtro por fecha
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        if fecha_inicio:
            query = query.filter(AjusteInventario.fecha >= fecha_inicio)

        if fecha_fin:
            query = query.filter(AjusteInventario.fecha <= fecha_fin)

        # Filtro por tipo de ajuste
        tipo_ajuste = request.args.get('tipo_ajuste')
        if tipo_ajuste:
            query = query.filter(AjusteInventario.tipo_ajuste == tipo_ajuste)

        # Filtro por producto
        producto_id = request.args.get('producto_id')
        if producto_id:
            query = query.filter(AjusteInventario.producto_id == producto_id)

        # Ordenar por fecha (más recientes primero)
        ajustes = query.order_by(AjusteInventario.fecha.desc()).all()

        return jsonify({
            'success': True,
            'ajustes': [a.to_dict() for a in ajustes],
            'total': len(ajustes)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al listar ajustes: {str(e)}'
        }), 500


# ===========================
# OBTENER AJUSTE POR ID
# ===========================

@ajustes_bp.route('/<int:ajuste_id>', methods=['GET'])
@login_required
@role_required('admin')
def get_ajuste(ajuste_id):
    """
    GET /api/ajustes-inventario/<id>

    Obtiene un ajuste específico por ID (solo admin)
    """
    try:
        ajuste = AjusteInventario.query.get(ajuste_id)

        if not ajuste:
            return jsonify({
                'success': False,
                'error': 'Ajuste no encontrado'
            }), 404

        return jsonify({
            'success': True,
            'ajuste': ajuste.to_dict()
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener ajuste: {str(e)}'
        }), 500


# ===========================
# OBTENER HISTORIAL DE UN PRODUCTO
# ===========================

@ajustes_bp.route('/producto/<int:producto_id>/historial', methods=['GET'])
@login_required
@role_required('admin')
def get_historial_producto(producto_id):
    """
    GET /api/ajustes-inventario/producto/<id>/historial

    Obtiene el historial de ajustes de un producto específico
    """
    try:
        # Verificar que el producto existe
        producto = Product.query.get(producto_id)
        if not producto:
            return jsonify({
                'success': False,
                'error': 'Producto no encontrado'
            }), 404

        # Obtener todos los ajustes del producto
        ajustes = AjusteInventario.query.filter_by(
            producto_id=producto_id
        ).order_by(AjusteInventario.fecha.desc()).all()

        return jsonify({
            'success': True,
            'producto': {
                'id': producto.id,
                'nombre': producto.nombre,
                'stock_actual': producto.stock_actual
            },
            'ajustes': [a.to_dict() for a in ajustes],
            'total_ajustes': len(ajustes)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener historial: {str(e)}'
        }), 500
