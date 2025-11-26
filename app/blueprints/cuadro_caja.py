"""
Blueprint para gestión de cuadros de caja (turnos)

Endpoints para:
- Abrir turno de caja
- Consultar turno activo
- Registrar egresos
- Cerrar turno con arqueo
- Consultar historial de turnos
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from decimal import Decimal

from app import db
from app.models import CuadroCaja, Venta, User

cuadro_caja_bp = Blueprint('cuadro_caja', __name__, url_prefix='/api/cuadro-caja')


# ==================== ENDPOINTS ====================

@cuadro_caja_bp.route('/abrir', methods=['POST'])
@jwt_required()
def abrir_turno():
    """
    Abre un nuevo turno de caja

    Body:
        {
            "monto_inicial": 50.00  (opcional, default: 0)
        }

    Returns:
        201: Turno creado exitosamente
        400: Datos inválidos o ya existe turno abierto
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json() or {}

        # Verificar si ya tiene un turno abierto
        turno_existente = CuadroCaja.turno_abierto_vendedor(current_user_id)
        if turno_existente:
            return jsonify({
                'error': 'Ya tienes un turno abierto',
                'turno_actual': turno_existente.to_dict(include_vendedor=True)
            }), 400

        # Crear nuevo turno
        monto_inicial = Decimal(str(data.get('monto_inicial', 0)))

        if monto_inicial < 0:
            return jsonify({'error': 'El monto inicial no puede ser negativo'}), 400

        turno = CuadroCaja(
            vendedor_id=current_user_id,
            monto_inicial=monto_inicial
        )

        # Generar número de turno
        turno.generar_numero_turno()

        db.session.add(turno)
        db.session.commit()

        return jsonify({
            'message': 'Turno abierto exitosamente',
            'turno': turno.to_dict(include_vendedor=True)
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al abrir turno: {str(e)}'}), 500


@cuadro_caja_bp.route('/turno-actual', methods=['GET'])
@jwt_required()
def obtener_turno_actual():
    """
    Obtiene el turno actualmente abierto del vendedor

    Returns:
        200: Turno actual (o null si no hay turno abierto)
    """
    try:
        current_user_id = get_jwt_identity()

        turno = CuadroCaja.turno_abierto_vendedor(current_user_id)

        if not turno:
            return jsonify({'turno': None}), 200

        return jsonify({
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener turno: {str(e)}'}), 500


@cuadro_caja_bp.route('/agregar-egreso', methods=['POST'])
@jwt_required()
def agregar_egreso():
    """
    Agrega un egreso (gasto) al turno actual

    Body:
        {
            "monto": 10.50,
            "concepto": "Compra de bolsas"
        }

    Returns:
        200: Egreso registrado
        400: Datos inválidos o no hay turno abierto
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not data or 'monto' not in data or 'concepto' not in data:
            return jsonify({'error': 'Debe proporcionar monto y concepto'}), 400

        # Buscar turno abierto
        turno = CuadroCaja.turno_abierto_vendedor(current_user_id)
        if not turno:
            return jsonify({'error': 'No tienes un turno abierto'}), 400

        monto = Decimal(str(data['monto']))
        concepto = data['concepto'].strip()

        if not concepto:
            return jsonify({'error': 'El concepto no puede estar vacío'}), 400

        # Agregar egreso
        turno.agregar_egreso(monto, concepto)
        db.session.commit()

        return jsonify({
            'message': 'Egreso registrado exitosamente',
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al registrar egreso: {str(e)}'}), 500


@cuadro_caja_bp.route('/cerrar', methods=['POST'])
@jwt_required()
def cerrar_turno():
    """
    Cierra el turno actual realizando arqueo de caja

    Body:
        {
            "efectivo_contado": 150.50,
            "observaciones": "Todo correcto" (opcional)
        }

    Returns:
        200: Turno cerrado exitosamente
        400: Datos inválidos o no hay turno abierto
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        if not data or 'efectivo_contado' not in data:
            return jsonify({'error': 'Debe proporcionar el efectivo contado'}), 400

        # Buscar turno abierto
        turno = CuadroCaja.turno_abierto_vendedor(current_user_id)
        if not turno:
            return jsonify({'error': 'No tienes un turno abierto'}), 400

        efectivo_contado = Decimal(str(data['efectivo_contado']))
        observaciones = data.get('observaciones', None)

        if efectivo_contado < 0:
            return jsonify({'error': 'El efectivo contado no puede ser negativo'}), 400

        # Cerrar turno
        turno.cerrar_turno(efectivo_contado, observaciones)
        db.session.commit()

        return jsonify({
            'message': 'Turno cerrado exitosamente',
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al cerrar turno: {str(e)}'}), 500


@cuadro_caja_bp.route('/historial', methods=['GET'])
@jwt_required()
def obtener_historial():
    """
    Obtiene el historial de turnos

    Query params:
        - fecha_inicio: Fecha de inicio (YYYY-MM-DD)
        - fecha_fin: Fecha de fin (YYYY-MM-DD)
        - solo_mis_turnos: true/false (default: true para vendedores)

    Returns:
        200: Lista de turnos
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Query params
        fecha_inicio_str = request.args.get('fecha_inicio')
        fecha_fin_str = request.args.get('fecha_fin')
        solo_mis_turnos = request.args.get('solo_mis_turnos', 'true').lower() == 'true'

        # Parsear fechas
        fecha_inicio = None
        fecha_fin = None

        if fecha_inicio_str:
            try:
                fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
            except:
                return jsonify({'error': 'Formato de fecha_inicio inválido (use YYYY-MM-DD)'}), 400

        if fecha_fin_str:
            try:
                fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
            except:
                return jsonify({'error': 'Formato de fecha_fin inválido (use YYYY-MM-DD)'}), 400

        # Si es vendedor, solo puede ver sus turnos (a menos que sea admin)
        if user.rol != 'admin':
            solo_mis_turnos = True

        if solo_mis_turnos:
            turnos = CuadroCaja.turnos_por_vendedor(current_user_id, fecha_inicio, fecha_fin)
        else:
            # Admin puede ver todos los turnos
            if fecha_inicio and fecha_fin:
                inicio = datetime.combine(fecha_inicio, datetime.min.time())
                fin = datetime.combine(fecha_fin, datetime.max.time())
                turnos = CuadroCaja.query.filter(
                    CuadroCaja.fecha_apertura >= inicio,
                    CuadroCaja.fecha_apertura <= fin
                ).order_by(CuadroCaja.fecha_apertura.desc()).all()
            else:
                # Últimos 30 días
                turnos = CuadroCaja.query.order_by(CuadroCaja.fecha_apertura.desc()).limit(100).all()

        return jsonify({
            'turnos': [turno.to_dict(include_vendedor=True) for turno in turnos]
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener historial: {str(e)}'}), 500


@cuadro_caja_bp.route('/turno/<int:turno_id>', methods=['GET'])
@jwt_required()
def obtener_turno(turno_id):
    """
    Obtiene los detalles de un turno específico

    Returns:
        200: Turno encontrado
        403: No autorizado
        404: Turno no encontrado
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        turno = CuadroCaja.query.get(turno_id)

        if not turno:
            return jsonify({'error': 'Turno no encontrado'}), 404

        # Verificar permisos: solo el vendedor dueño o admin pueden ver el turno
        if turno.vendedor_id != current_user_id and user.rol != 'admin':
            return jsonify({'error': 'No tienes permiso para ver este turno'}), 403

        return jsonify({
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener turno: {str(e)}'}), 500


@cuadro_caja_bp.route('/turnos-abiertos', methods=['GET'])
@jwt_required()
def obtener_turnos_abiertos():
    """
    Obtiene todos los turnos actualmente abiertos (solo admin)

    Returns:
        200: Lista de turnos abiertos
        403: No autorizado
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Solo admin puede ver todos los turnos abiertos
        if user.rol != 'admin':
            return jsonify({'error': 'No tienes permiso para esta operación'}), 403

        turnos = CuadroCaja.turnos_abiertos()

        return jsonify({
            'turnos': [turno.to_dict(include_vendedor=True) for turno in turnos]
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener turnos abiertos: {str(e)}'}), 500


@cuadro_caja_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def obtener_estadisticas():
    """
    Obtiene estadísticas de cuadros de caja

    Query params:
        - fecha: Fecha específica (YYYY-MM-DD) - default: hoy

    Returns:
        200: Estadísticas del día
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Parsear fecha
        fecha_str = request.args.get('fecha')
        if fecha_str:
            try:
                fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
            except:
                return jsonify({'error': 'Formato de fecha inválido (use YYYY-MM-DD)'}), 400
        else:
            fecha = date.today()

        # Obtener turnos del día
        turnos_dia = CuadroCaja.turnos_del_dia(fecha)

        # Filtrar por vendedor si no es admin
        if user.rol != 'admin':
            turnos_dia = [t for t in turnos_dia if t.vendedor_id == current_user_id]

        # Calcular estadísticas
        total_turnos = len(turnos_dia)
        turnos_abiertos = len([t for t in turnos_dia if t.esta_abierto])
        turnos_cerrados = len([t for t in turnos_dia if t.esta_cerrado])

        total_ventas = sum(t.total_ventas for t in turnos_dia)
        total_efectivo = sum(t.total_efectivo for t in turnos_dia)
        total_yape = sum(t.total_yape for t in turnos_dia)
        total_plin = sum(t.total_plin for t in turnos_dia)
        total_transferencia = sum(t.total_transferencia for t in turnos_dia)
        total_egresos = sum(t.total_egresos for t in turnos_dia)

        # Diferencias
        turnos_con_diferencia = [t for t in turnos_dia if t.esta_cerrado and t.tiene_diferencia]
        total_diferencias = sum(t.diferencia for t in turnos_con_diferencia)

        return jsonify({
            'fecha': fecha.isoformat(),
            'resumen': {
                'total_turnos': total_turnos,
                'turnos_abiertos': turnos_abiertos,
                'turnos_cerrados': turnos_cerrados
            },
            'ventas': {
                'total': float(total_ventas),
                'efectivo': float(total_efectivo),
                'yape': float(total_yape),
                'plin': float(total_plin),
                'transferencia': float(total_transferencia)
            },
            'egresos': float(total_egresos),
            'diferencias': {
                'cantidad_turnos': len(turnos_con_diferencia),
                'total': float(total_diferencias)
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener estadísticas: {str(e)}'}), 500
