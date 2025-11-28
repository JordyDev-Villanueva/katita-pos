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
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
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

        # Verificar si ya existe un turno para hoy (abierto o cerrado)
        # Esto previene abrir múltiples turnos en el mismo día
        hoy = date.today()
        turno_hoy = CuadroCaja.query.filter(
            CuadroCaja.vendedor_id == current_user_id,
            db.func.date(CuadroCaja.fecha_apertura) == hoy
        ).first()

        if turno_hoy:
            return jsonify({
                'error': 'Ya existe un turno para hoy. No puedes abrir otro turno en el mismo día.',
                'turno_existente': turno_hoy.to_dict(include_vendedor=True)
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


@cuadro_caja_bp.route('/solicitar-cierre', methods=['POST'])
@jwt_required()
def solicitar_cierre():
    """
    Vendedor solicita cierre de turno (requiere aprobación de admin)

    Body:
        {
            "efectivo_contado": 150.50,
            "observaciones": "Todo correcto" (opcional)
        }

    Returns:
        200: Solicitud de cierre registrada
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

        # Solicitar cierre
        turno.solicitar_cierre(efectivo_contado, observaciones)
        db.session.commit()

        return jsonify({
            'message': 'Solicitud de cierre enviada. Esperando aprobación del administrador.',
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al solicitar cierre: {str(e)}'}), 500


@cuadro_caja_bp.route('/aprobar-cierre/<int:turno_id>', methods=['POST'])
@jwt_required()
def aprobar_cierre(turno_id):
    """
    Admin aprueba el cierre solicitado por el vendedor

    Returns:
        200: Cierre aprobado
        403: No autorizado (no es admin)
        404: Turno no encontrado
        400: El turno no está pendiente de cierre
    """
    try:
        current_user_id = get_jwt_identity()

        # Verificar que el usuario es admin
        usuario = User.query.get(current_user_id)
        if not usuario or usuario.rol != 'admin':
            return jsonify({'error': 'No autorizado. Solo administradores pueden aprobar cierres.'}), 403

        # Buscar el turno
        turno = CuadroCaja.query.get(turno_id)
        if not turno:
            return jsonify({'error': 'Turno no encontrado'}), 404

        # Aprobar cierre
        turno.aprobar_cierre()
        db.session.commit()

        return jsonify({
            'message': 'Cierre aprobado exitosamente',
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al aprobar cierre: {str(e)}'}), 500


@cuadro_caja_bp.route('/rechazar-cierre/<int:turno_id>', methods=['POST'])
@jwt_required()
def rechazar_cierre(turno_id):
    """
    Admin rechaza el cierre solicitado por el vendedor

    Body:
        {
            "observaciones_rechazo": "Razón del rechazo"
        }

    Returns:
        200: Cierre rechazado
        403: No autorizado (no es admin)
        404: Turno no encontrado
        400: Datos inválidos o el turno no está pendiente de cierre
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Verificar que el usuario es admin
        usuario = User.query.get(current_user_id)
        if not usuario or usuario.rol != 'admin':
            return jsonify({'error': 'No autorizado. Solo administradores pueden rechazar cierres.'}), 403

        if not data or 'observaciones_rechazo' not in data:
            return jsonify({'error': 'Debe proporcionar la razón del rechazo'}), 400

        # Buscar el turno
        turno = CuadroCaja.query.get(turno_id)
        if not turno:
            return jsonify({'error': 'Turno no encontrado'}), 404

        observaciones_rechazo = data['observaciones_rechazo'].strip()
        if not observaciones_rechazo:
            return jsonify({'error': 'La razón del rechazo no puede estar vacía'}), 400

        # Rechazar cierre
        turno.rechazar_cierre(observaciones_rechazo)
        db.session.commit()

        return jsonify({
            'message': 'Cierre rechazado. El turno vuelve a estar abierto.',
            'turno': turno.to_dict(include_vendedor=True)
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error al rechazar cierre: {str(e)}'}), 500


@cuadro_caja_bp.route('/cerrar', methods=['POST'])
@jwt_required()
def cerrar_turno():
    """
    Admin cierra turno directamente (sin aprobación)

    Body:
        {
            "efectivo_contado": 150.50,
            "observaciones": "Todo correcto" (opcional)
        }

    Returns:
        200: Turno cerrado exitosamente
        403: No autorizado (no es admin)
        400: Datos inválidos o no hay turno abierto
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Verificar que el usuario es admin
        usuario = User.query.get(current_user_id)
        if not usuario or usuario.rol != 'admin':
            return jsonify({'error': 'No autorizado. Los vendedores deben usar /solicitar-cierre'}), 403

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

        # Cerrar turno directamente
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


@cuadro_caja_bp.route('/turnos-pendientes', methods=['GET'])
@jwt_required()
def obtener_turnos_pendientes():
    """
    Obtiene todos los turnos pendientes de cierre (solo admin)

    Returns:
        200: Lista de turnos pendientes de cierre
        403: No autorizado
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Solo admin puede ver todos los turnos pendientes
        if user.rol != 'admin':
            return jsonify({'error': 'No tienes permiso para esta operación'}), 403

        turnos = CuadroCaja.query.filter_by(estado='pendiente_cierre').order_by(CuadroCaja.fecha_apertura.desc()).all()

        return jsonify({
            'turnos': [turno.to_dict(include_vendedor=True) for turno in turnos],
            'total': len(turnos)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener turnos pendientes: {str(e)}'}), 500


@cuadro_caja_bp.route('/todos-los-turnos', methods=['GET'])
@jwt_required()
def obtener_todos_los_turnos():
    """
    Obtiene todos los turnos de todos los vendedores (solo admin)
    Incluye filtros por estado y fechas

    Query params:
        - estado: abierto, pendiente_cierre, cerrado (opcional)
        - fecha_inicio: YYYY-MM-DD (opcional)
        - fecha_fin: YYYY-MM-DD (opcional)

    Returns:
        200: Lista de todos los turnos
        403: No autorizado
    """
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Solo admin puede ver todos los turnos
        if user.rol != 'admin':
            return jsonify({'error': 'No tienes permiso para esta operación'}), 403

        # Construir query base
        query = CuadroCaja.query

        # Filtrar por estado si se proporciona
        estado = request.args.get('estado')
        if estado:
            query = query.filter_by(estado=estado)

        # Filtrar por fechas si se proporcionan
        fecha_inicio_str = request.args.get('fecha_inicio')
        fecha_fin_str = request.args.get('fecha_fin')

        if fecha_inicio_str:
            try:
                fecha_inicio = datetime.strptime(fecha_inicio_str, '%Y-%m-%d').date()
                inicio = datetime.combine(fecha_inicio, datetime.min.time())
                query = query.filter(CuadroCaja.fecha_apertura >= inicio)
            except:
                return jsonify({'error': 'Formato de fecha_inicio inválido (use YYYY-MM-DD)'}), 400

        if fecha_fin_str:
            try:
                fecha_fin = datetime.strptime(fecha_fin_str, '%Y-%m-%d').date()
                fin = datetime.combine(fecha_fin, datetime.max.time())
                query = query.filter(CuadroCaja.fecha_apertura <= fin)
            except:
                return jsonify({'error': 'Formato de fecha_fin inválido (use YYYY-MM-DD)'}), 400

        # Ordenar y ejecutar
        turnos = query.order_by(CuadroCaja.fecha_apertura.desc()).all()

        # Agrupar estadísticas
        stats = {
            'total': len(turnos),
            'abiertos': len([t for t in turnos if t.estado == 'abierto']),
            'pendientes': len([t for t in turnos if t.estado == 'pendiente_cierre']),
            'cerrados': len([t for t in turnos if t.estado == 'cerrado'])
        }

        return jsonify({
            'turnos': [turno.to_dict(include_vendedor=True) for turno in turnos],
            'estadisticas': stats
        }), 200

    except Exception as e:
        return jsonify({'error': f'Error al obtener turnos: {str(e)}'}), 500


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


# ==================================================================================
# ENDPOINT 11: GET /api/cuadro-caja/ventas-turno - Obtener ventas del turno actual
# ==================================================================================

@cuadro_caja_bp.route('/ventas-turno', methods=['GET'])
@jwt_required()
def obtener_ventas_turno():
    """
    Obtiene todas las ventas del turno actual del vendedor autenticado.

    Si el vendedor es admin, puede obtener las ventas de cualquier turno
    especificando el parámetro turno_id.

    Query params:
        - turno_id (int, opcional): ID del turno (solo para admin)

    Returns:
        200: Lista de ventas del turno
        404: No hay turno abierto o turno no encontrado
        500: Error interno
    """
    try:
        from flask import current_app

        # Obtener usuario autenticado
        user_id = get_jwt_identity()
        claims = get_jwt()
        user_rol = claims.get('rol')

        # Obtener parámetros
        turno_id = request.args.get('turno_id', type=int)

        # Si es admin y especifica turno_id, obtener ese turno
        if user_rol == 'admin' and turno_id:
            turno = CuadroCaja.query.get(turno_id)
            if not turno:
                return jsonify({'error': 'Turno no encontrado'}), 404
        else:
            # Obtener turno abierto del vendedor
            turno = CuadroCaja.query.filter_by(
                vendedor_id=user_id,
                estado='abierto'
            ).first()

            if not turno:
                return jsonify({
                    'message': 'No hay turno abierto',
                    'ventas': []
                }), 200

        # Obtener ventas del turno
        from app.models.venta import Venta
        ventas = Venta.query.filter_by(
            cuadro_caja_id=turno.id,
            estado='completada'
        ).order_by(Venta.fecha.desc()).all()

        # Serializar ventas (sin detalles para mejor performance)
        ventas_data = [venta.to_dict(include_detalles=False) for venta in ventas]

        # Calcular totales por método de pago
        from decimal import Decimal
        total_efectivo = sum(
            Decimal(str(v.total)) for v in ventas if v.metodo_pago == 'efectivo'
        )
        total_yape = sum(
            Decimal(str(v.total)) for v in ventas if v.metodo_pago == 'yape'
        )
        total_plin = sum(
            Decimal(str(v.total)) for v in ventas if v.metodo_pago == 'plin'
        )
        total_transferencia = sum(
            Decimal(str(v.total)) for v in ventas if v.metodo_pago == 'transferencia'
        )

        return jsonify({
            'turno_id': turno.id,
            'turno_numero': turno.numero_turno,
            'cantidad_ventas': len(ventas),
            'totales': {
                'efectivo': float(total_efectivo),
                'yape': float(total_yape),
                'plin': float(total_plin),
                'transferencia': float(total_transferencia),
                'total': float(total_efectivo + total_yape + total_plin + total_transferencia)
            },
            'ventas': ventas_data
        }), 200

    except Exception as e:
        current_app.logger.error(f'Error en obtener_ventas_turno: {str(e)}', exc_info=True)
        return jsonify({'error': f'Error al obtener ventas del turno: {str(e)}'}), 500
