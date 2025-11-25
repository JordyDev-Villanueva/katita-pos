# -*- coding: utf-8 -*-
"""
KATITA-POS - Blueprint de Lotes
================================
Endpoints para la gestion de inventario con sistema FIFO.

Este modulo maneja:
- Ingreso de mercaderia (crear lotes)
- Consulta de lotes con filtros
- Control de vencimientos y alertas
- Sistema FIFO automatico
- Trazabilidad de inventario

El sistema de lotes es CRITICO para:
- Evitar mermas por productos vencidos
- Trazabilidad de cada venta a su lote original
- Control FIFO: primero que vence, primero que sale
- Gestion de fechas de vencimiento
"""

from flask import Blueprint, request, g
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from decimal import Decimal
from datetime import datetime, timedelta
from app import db
from app.models.lote import Lote
from app.models.product import Product
from app.models.movimiento_stock import MovimientoStock
from app.utils.responses import (
    success_response, error_response, created_response,
    not_found_response, validation_error_response, conflict_response
)
from app.decorators.auth_decorators import login_required, role_required

# Crear Blueprint con prefijo /api/lotes
lotes_bp = Blueprint('lotes', __name__, url_prefix='/api/lotes')


# ==================================================================================
# ENDPOINT 1: POST /api/lotes - Crear lote (ingreso de mercaderia)
# ==================================================================================

@lotes_bp.route('', methods=['POST'])
@jwt_required()
def crear_lote():
    """
    Crear un nuevo lote de mercaderia (ingreso de inventario)

    Cuando llega mercaderia nueva al minimarket, el sistema registra:
    - Cantidad recibida
    - Fecha de vencimiento
    - Precio de compra del lote
    - Proveedor y ubicacion en almacen

    El sistema automaticamente:
    1. Actualiza el stock_total del producto
    2. Crea un registro de MovimientoStock tipo "compra"
    3. Genera codigo_lote si no se proporciona

    Body JSON:
        {
            "producto_id": 1,
            "cantidad_inicial": 100,
            "fecha_vencimiento": "2025-12-31",
            "precio_compra_lote": 2.50,
            "codigo_lote": "LOTE-20250104-001",  // Opcional
            "proveedor": "Coca Cola Peru SAC",    // Opcional
            "ubicacion_almacen": "Estante A-3",   // Opcional
            "notas": "Promocion verano 2025"      // Opcional
        }

    Validaciones:
        - producto_id: Debe existir en la BD
        - cantidad_inicial: Entero > 0
        - fecha_vencimiento: Fecha futura obligatoria
        - precio_compra_lote: Decimal > 0
        - codigo_lote: Si se proporciona, debe ser unico

    Returns:
        201: Lote creado exitosamente con datos completos
        400: Error de validacion
        404: Producto no encontrado
        409: Codigo de lote duplicado
        500: Error interno

    Ejemplo de respuesta exitosa:
        {
            "success": true,
            "message": "Lote creado exitosamente",
            "data": {
                "lote": {...},
                "producto": {...},
                "movimiento": {...}
            }
        }
    """
    try:
        from flask import current_app
        current_app.logger.info("[LOTES] Iniciando creacion de lote...")

        # Obtener usuario autenticado desde JWT
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None
        current_app.logger.info(f"[LOTES] Usuario autenticado: {current_user_id}")

        data = request.json
        current_app.logger.info(f"[LOTES] Datos recibidos: {data}")

        # ========== VALIDACIONES DE CAMPOS REQUERIDOS ==========
        campos_requeridos = ['producto_id', 'cantidad_inicial', 'fecha_vencimiento', 'precio_compra_lote']
        errores = {}

        for campo in campos_requeridos:
            if campo not in data or data[campo] is None:
                errores[campo] = f'El campo {campo} es requerido'

        if errores:
            return validation_error_response(errores)

        # ========== VALIDAR PRODUCTO EXISTE ==========
        producto = Product.query.get(data['producto_id'])
        if not producto:
            return not_found_response(f"Producto con ID {data['producto_id']} no encontrado")

        # ========== VALIDAR CANTIDAD INICIAL ==========
        try:
            cantidad_inicial = int(data['cantidad_inicial'])
            if cantidad_inicial <= 0:
                errores['cantidad_inicial'] = 'Debe ser mayor a 0'
        except (ValueError, TypeError):
            errores['cantidad_inicial'] = 'Debe ser un numero entero'

        # ========== VALIDAR FECHA DE VENCIMIENTO ==========
        try:
            # Parsear la fecha (formato YYYY-MM-DD o ISO 8601)
            fecha_vencimiento_str = data['fecha_vencimiento']
            if 'T' in fecha_vencimiento_str:
                # Formato ISO 8601 con hora - convertir a date
                fecha_vencimiento = datetime.fromisoformat(fecha_vencimiento_str.replace('Z', '+00:00')).date()
            else:
                # Formato solo fecha YYYY-MM-DD - convertir a date
                fecha_vencimiento = datetime.strptime(fecha_vencimiento_str, '%Y-%m-%d').date()

            # Verificar que sea fecha futura
            from datetime import date
            if fecha_vencimiento <= date.today():
                errores['fecha_vencimiento'] = 'Debe ser una fecha futura'
        except (ValueError, TypeError):
            errores['fecha_vencimiento'] = 'Formato invalido. Use YYYY-MM-DD'

        # ========== VALIDAR PRECIO DE COMPRA ==========
        try:
            precio_compra_lote = Decimal(str(data['precio_compra_lote']))
            if precio_compra_lote <= 0:
                errores['precio_compra_lote'] = 'Debe ser mayor a 0'
        except (ValueError, TypeError):
            errores['precio_compra_lote'] = 'Debe ser un numero decimal valido'

        # ========== VALIDAR CODIGO DE LOTE (si se proporciona) ==========
        codigo_lote = data.get('codigo_lote')
        if codigo_lote:
            # Verificar unicidad
            if Lote.query.filter_by(codigo_lote=codigo_lote).first():
                errores['codigo_lote'] = f'El codigo de lote {codigo_lote} ya existe'
        else:
            # Generar codigo automatico: LOTE-YYYYMMDD-XXX
            fecha_hoy = datetime.now().strftime('%Y%m%d')
            # Contar lotes creados hoy
            count = Lote.query.filter(Lote.codigo_lote.like(f'LOTE-{fecha_hoy}-%')).count()
            codigo_lote = f'LOTE-{fecha_hoy}-{str(count + 1).zfill(3)}'

        # Si hay errores de validacion, retornar
        if errores:
            return validation_error_response(errores)

        # ========== CREAR EL LOTE ==========
        nuevo_lote = Lote(
            producto_id=data['producto_id'],
            codigo_lote=codigo_lote,
            cantidad_inicial=cantidad_inicial,
            cantidad_actual=cantidad_inicial,  # Al inicio, actual = inicial
            fecha_vencimiento=fecha_vencimiento,
            precio_compra_lote=precio_compra_lote,
            proveedor=data.get('proveedor', ''),
            ubicacion=data.get('ubicacion_almacen', ''),
            notas=data.get('notas', '')
        )

        db.session.add(nuevo_lote)
        db.session.flush()  # Para obtener el ID del lote

        # ========== ACTUALIZAR STOCK DEL PRODUCTO ==========
        stock_anterior = producto.stock_total
        producto.stock_total += cantidad_inicial
        stock_nuevo = producto.stock_total

        # ========== CREAR MOVIMIENTO DE STOCK ==========
        movimiento = MovimientoStock(
            producto_id=producto.id,
            lote_id=nuevo_lote.id,
            tipo='compra',
            cantidad=cantidad_inicial,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            usuario_id=current_user_id,
            referencia=f'Ingreso de mercaderia - {codigo_lote}',
            motivo=f'Proveedor: {nuevo_lote.proveedor}' if nuevo_lote.proveedor else 'Compra'
        )

        db.session.add(movimiento)
        db.session.commit()

        # ========== RESPUESTA EXITOSA ==========
        return created_response(
            data={
                'lote': nuevo_lote.to_dict(),
                'producto': {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'codigo_barras': producto.codigo_barras,
                    'stock_total': producto.stock_total
                },
                'movimiento': movimiento.to_dict()
            },
            message='Lote creado exitosamente'
        )

    except IntegrityError as e:
        from flask import current_app
        current_app.logger.error(f"[LOTES] IntegrityError: {str(e)}")
        db.session.rollback()
        return conflict_response(
            message='Error de integridad en la base de datos',
            errors={'database': str(e.orig)}
        )
    except Exception as e:
        from flask import current_app
        import traceback
        current_app.logger.error(f"[LOTES] Exception: {str(e)}")
        current_app.logger.error(f"[LOTES] Traceback: {traceback.format_exc()}")
        db.session.rollback()
        return error_response(
            message='Error al crear el lote',
            status_code=500,
            errors={'exception': str(e), 'traceback': traceback.format_exc()}
        )


# ==================================================================================
# ENDPOINT 2: GET /api/lotes - Listar lotes con filtros
# ==================================================================================

@lotes_bp.route('', methods=['GET'])
@jwt_required()
def listar_lotes():
    """
    Listar lotes con filtros opcionales

    Permite consultar el inventario actual con diversos filtros:
    - Por producto especifico
    - Solo lotes activos o agotados
    - Solo lotes vencidos
    - Solo lotes proximos a vencer

    Query Parameters:
        producto_id (int): Filtrar por producto especifico
        activo (bool): true = con stock, false = agotados
        vencidos (bool): true = solo vencidos, false = no vencidos
        por_vencer (int): Dias de anticipacion (ej: 7, 15, 30)
        limit (int): Maximo de resultados (default: 100, max: 500)
        offset (int): Paginacion (default: 0)

    Ordenamiento:
        Siempre ordenado FIFO: fecha_vencimiento ASC

    Returns:
        200: Lista de lotes con metadata
        400: Parametros invalidos
        500: Error interno

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Lotes encontrados",
            "data": {
                "lotes": [...],
                "total": 45,
                "limit": 100,
                "offset": 0
            }
        }
    """
    try:
        # ========== AUTO-INACTIVAR LOTES VENCIDOS ==========
        from datetime import date
        hoy = date.today()
        lotes_vencidos = Lote.query.filter(
            Lote.fecha_vencimiento <= hoy,
            Lote.activo == True,
            Lote.cantidad_actual > 0
        ).all()

        productos_afectados = set()
        if lotes_vencidos:
            for lote in lotes_vencidos:
                lote.activo = False
                productos_afectados.add(lote.producto_id)
            db.session.commit()

        # ========== AUTO-INACTIVAR PRODUCTOS SIN LOTES VÁLIDOS ==========
        if productos_afectados:
            for producto_id in productos_afectados:
                producto = Product.query.get(producto_id)
                if producto and producto.activo:
                    # Verificar si el producto tiene al menos un lote válido (no vencido con stock)
                    lotes_validos = Lote.query.filter(
                        Lote.producto_id == producto_id,
                        Lote.cantidad_actual > 0,
                        Lote.fecha_vencimiento > hoy,
                        Lote.activo == True
                    ).count()

                    # Si no tiene lotes válidos, inactivar el producto
                    if lotes_validos == 0:
                        producto.activo = False

            db.session.commit()
        # ========== CONSTRUIR QUERY BASE ==========
        query = Lote.query

        # ========== FILTRO POR PRODUCTO ==========
        producto_id = request.args.get('producto_id', type=int)
        if producto_id:
            query = query.filter(Lote.producto_id == producto_id)

        # ========== FILTRO POR ACTIVO/AGOTADO ==========
        activo = request.args.get('activo')
        if activo is not None:
            if activo.lower() == 'true':
                query = query.filter(Lote.cantidad_actual > 0)
            elif activo.lower() == 'false':
                query = query.filter(Lote.cantidad_actual == 0)

        # ========== FILTRO POR VENCIDOS ==========
        vencidos = request.args.get('vencidos')
        if vencidos is not None:
            if vencidos.lower() == 'true':
                query = query.filter(Lote.fecha_vencimiento < datetime.now())
            elif vencidos.lower() == 'false':
                query = query.filter(Lote.fecha_vencimiento >= datetime.now())

        # ========== FILTRO POR PROXIMO A VENCER ==========
        por_vencer = request.args.get('por_vencer', type=int)
        if por_vencer:
            fecha_limite = datetime.now() + timedelta(days=por_vencer)
            query = query.filter(
                Lote.fecha_vencimiento >= datetime.now(),
                Lote.fecha_vencimiento <= fecha_limite,
                Lote.cantidad_actual > 0
            )

        # ========== ORDENAMIENTO FIFO ==========
        query = query.order_by(Lote.fecha_vencimiento.asc())

        # ========== PAGINACION ==========
        limit = request.args.get('limit', default=100, type=int)
        offset = request.args.get('offset', default=0, type=int)

        # Validar limit
        if limit > 500:
            limit = 500
        if limit < 1:
            limit = 100

        # Contar total antes de paginar
        total = query.count()

        # Aplicar paginacion
        lotes = query.limit(limit).offset(offset).all()

        # ========== ENRIQUECER DATOS DE RESPUESTA ==========
        lotes_dict = []
        for lote in lotes:
            # BUG 3 CORREGIDO: Incluir información del producto
            lote_data = lote.to_dict(include_producto=True)
            lotes_dict.append(lote_data)

        # ========== RESPUESTA EXITOSA ==========
        return success_response(
            data={
                'lotes': lotes_dict,
                'total': total,
                'limit': limit,
                'offset': offset
            },
            message=f'{total} lotes encontrados'
        )

    except Exception as e:
        return error_response(
            message='Error al listar lotes',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 3: GET /api/lotes/producto/<int:producto_id> - Lotes FIFO de un producto
# ==================================================================================

@lotes_bp.route('/producto/<int:producto_id>', methods=['GET'])
@jwt_required()
def lotes_producto(producto_id):
    """
    Obtener lotes disponibles de un producto ordenados FIFO

    Este endpoint es CRITICO para el sistema FIFO. Retorna los lotes
    de un producto especifico ordenados por fecha de vencimiento (primero
    el que vence antes) para garantizar rotacion correcta del inventario.

    Usado por:
    - Sistema de ventas para saber de que lote descontar
    - Consulta de disponibilidad de stock
    - Verificacion de fechas de vencimiento

    Path Parameter:
        producto_id (int): ID del producto

    Query Parameters:
        solo_disponibles (bool): true = solo con stock > 0 (default: true)
        incluir_vencidos (bool): true = incluir vencidos (default: false)

    Returns:
        200: Lista de lotes ordenados FIFO
        404: Producto no encontrado
        500: Error interno

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Lotes encontrados",
            "data": {
                "producto": {...},
                "lotes_disponibles": [...],
                "total_lotes": 5,
                "stock_total": 250,
                "lote_siguiente_fifo": {...}
            }
        }
    """
    try:
        # ========== VALIDAR QUE EL PRODUCTO EXISTE ==========
        producto = Product.query.get(producto_id)
        if not producto:
            return not_found_response(f'Producto con ID {producto_id} no encontrado')

        # ========== OBTENER PARAMETROS ==========
        solo_disponibles = request.args.get('solo_disponibles', 'true').lower() == 'true'
        incluir_vencidos = request.args.get('incluir_vencidos', 'false').lower() == 'true'

        # ========== USAR METODO FIFO DEL MODELO ==========
        # El metodo lotes_fifo retorna una Query, necesitamos ejecutarla con .all()
        lotes = Lote.lotes_fifo(producto_id).all()

        # ========== ENRIQUECER DATOS ==========
        lotes_dict = []
        stock_total_disponible = 0

        for lote in lotes:
            lote_data = lote.to_dict()
            lotes_dict.append(lote_data)

            if lote.cantidad_actual > 0:
                stock_total_disponible += lote.cantidad_actual

        # ========== IDENTIFICAR LOTE SIGUIENTE FIFO ==========
        lote_siguiente_fifo = None
        if lotes_dict:
            # El primer lote con stock disponible es el siguiente FIFO
            for lote_data in lotes_dict:
                if lote_data['cantidad_actual'] > 0 and not lote_data['esta_vencido']:
                    lote_siguiente_fifo = lote_data
                    break

        # ========== RESPUESTA EXITOSA ==========
        return success_response(
            data={
                'producto': {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'codigo_barras': producto.codigo_barras,
                    'stock_total': producto.stock_total
                },
                'lotes_disponibles': lotes_dict,
                'total_lotes': len(lotes_dict),
                'stock_total_disponible': stock_total_disponible,
                'lote_siguiente_fifo': lote_siguiente_fifo
            },
            message=f'{len(lotes_dict)} lotes encontrados para {producto.nombre}'
        )

    except Exception as e:
        return error_response(
            message='Error al obtener lotes del producto',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 4: GET /api/lotes/alertas - Productos proximos a vencer
# ==================================================================================

@lotes_bp.route('/alertas', methods=['GET'])
@jwt_required()
def alertas_vencimiento():
    """
    Obtener alertas de productos proximos a vencer

    Este endpoint es CRITICO para la gestion de mermas. Permite al
    administrador identificar productos que estan proximos a vencer
    para tomar acciones:
    - Hacer promociones/descuentos
    - Reordenar productos en estantes
    - Notificar al personal de ventas

    Query Parameters:
        dias (int): Dias de anticipacion (default: 7)
                   Ejemplos: 7, 15, 30
        solo_activos (bool): Solo productos con stock > 0 (default: true)

    Returns:
        200: Lista de productos con lotes proximos a vencer
        500: Error interno

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Alertas de vencimiento",
            "data": {
                "alertas": [
                    {
                        "producto": {...},
                        "lotes_proximos": [...],
                        "cantidad_total_afectada": 50,
                        "urgencia": "alta"  // alta, media, baja
                    }
                ],
                "total_productos_afectados": 3,
                "dias_anticipacion": 7
            }
        }
    """
    try:
        # ========== PARAMETROS ==========
        dias = request.args.get('dias', default=7, type=int)
        solo_activos = request.args.get('solo_activos', 'true').lower() == 'true'

        # Validar dias
        if dias < 1:
            dias = 7

        # ========== CALCULAR FECHA LIMITE ==========
        fecha_limite = datetime.now() + timedelta(days=dias)

        # ========== CONSULTAR LOTES PROXIMOS A VENCER ==========
        query = Lote.query.filter(
            Lote.fecha_vencimiento >= datetime.now(),
            Lote.fecha_vencimiento <= fecha_limite
        )

        if solo_activos:
            query = query.filter(Lote.cantidad_actual > 0)

        query = query.order_by(Lote.fecha_vencimiento.asc())
        lotes_proximos = query.all()

        # ========== AGRUPAR POR PRODUCTO ==========
        productos_afectados = {}

        for lote in lotes_proximos:
            producto_id = lote.producto_id

            if producto_id not in productos_afectados:
                productos_afectados[producto_id] = {
                    'producto': lote.producto,
                    'lotes': [],
                    'cantidad_total': 0
                }

            productos_afectados[producto_id]['lotes'].append(lote)
            productos_afectados[producto_id]['cantidad_total'] += lote.cantidad_actual

        # ========== CONSTRUIR RESPUESTA CON NIVELES DE URGENCIA ==========
        alertas = []

        for producto_id, data in productos_afectados.items():
            producto = data['producto']
            lotes = data['lotes']
            cantidad_total = data['cantidad_total']

            # Calcular urgencia basada en el lote mas proximo
            dias_min = min(lote.dias_hasta_vencimiento for lote in lotes)

            if dias_min <= 3:
                urgencia = 'alta'
            elif dias_min <= 7:
                urgencia = 'media'
            else:
                urgencia = 'baja'

            # Serializar lotes (BUG 3 CORREGIDO)
            lotes_dict = []
            for lote in lotes:
                lote_data = lote.to_dict(include_producto=True)
                lote_data['dias_hasta_vencimiento'] = lote.dias_hasta_vencimiento
                lote_data['esta_vencido'] = lote.esta_vencido
                lotes_dict.append(lote_data)

            alertas.append({
                'producto': {
                    'id': producto.id,
                    'nombre': producto.nombre,
                    'codigo_barras': producto.codigo_barras,
                    'categoria': producto.categoria,
                    'precio_venta': str(producto.precio_venta)
                },
                'lotes_proximos': lotes_dict,
                'cantidad_total_afectada': cantidad_total,
                'urgencia': urgencia,
                'dias_minimo_vencimiento': dias_min
            })

        # Ordenar por urgencia (alta primero)
        urgencia_orden = {'alta': 0, 'media': 1, 'baja': 2}
        alertas.sort(key=lambda x: (urgencia_orden[x['urgencia']], x['dias_minimo_vencimiento']))

        # ========== RESPUESTA EXITOSA ==========
        return success_response(
            data={
                'alertas': alertas,
                'total_productos_afectados': len(alertas),
                'dias_anticipacion': dias,
                'fecha_limite': fecha_limite.strftime('%Y-%m-%d')
            },
            message=f'{len(alertas)} productos con lotes proximos a vencer en {dias} dias'
        )

    except Exception as e:
        return error_response(
            message='Error al obtener alertas de vencimiento',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 5: PUT /api/lotes/<int:id> - Actualizar lote
# ==================================================================================

@lotes_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_lote(id):
    """
    Actualizar informacion de un lote existente

    Permite actualizar campos administrativos del lote:
    - ubicacion_almacen: Cambiar ubicacion fisica
    - notas: Agregar observaciones
    - proveedor: Corregir proveedor

    IMPORTANTE: NO permite cambiar:
    - cantidad_inicial / cantidad_actual (se maneja via MovimientoStock)
    - fecha_vencimiento (inmutable por trazabilidad)
    - codigo_lote (inmutable por trazabilidad)
    - producto_id (inmutable por integridad)

    Path Parameter:
        id (int): ID del lote

    Body JSON:
        {
            "ubicacion_almacen": "Estante B-5",
            "notas": "Revisar empaque",
            "proveedor": "Proveedor Actualizado"
        }

    Returns:
        200: Lote actualizado exitosamente
        404: Lote no encontrado
        400: Error de validacion
        500: Error interno
    """
    try:
        # ========== BUSCAR EL LOTE ==========
        lote = Lote.query.get(id)
        if not lote:
            return not_found_response(f'Lote con ID {id} no encontrado')

        # ========== OBTENER DATOS ==========
        data = request.json
        if not data:
            return error_response('No se proporcionaron datos para actualizar')

        # ========== CAMPOS PERMITIDOS PARA ACTUALIZACION ==========
        campos_permitidos = ['ubicacion', 'notas', 'proveedor']
        campos_actualizados = []

        for campo in campos_permitidos:
            if campo in data:
                setattr(lote, campo, data[campo])
                campos_actualizados.append(campo)

        # ========== VALIDAR QUE NO INTENTEN CAMBIAR CAMPOS INMUTABLES ==========
        campos_inmutables = ['producto_id', 'codigo_lote', 'cantidad_inicial',
                             'cantidad_actual', 'fecha_vencimiento', 'precio_compra_lote']
        campos_rechazados = []

        for campo in campos_inmutables:
            if campo in data:
                campos_rechazados.append(campo)

        if campos_rechazados:
            return error_response(
                message='No se pueden modificar campos inmutables',
                status_code=400,
                errors={
                    'campos_rechazados': campos_rechazados,
                    'razon': 'Estos campos son inmutables por trazabilidad e integridad'
                }
            )

        if not campos_actualizados:
            return error_response('No se proporcionaron campos validos para actualizar')

        # ========== GUARDAR CAMBIOS ==========
        db.session.commit()

        # ========== RESPUESTA EXITOSA ==========
        return success_response(
            data={
                'lote': lote.to_dict(),
                'campos_actualizados': campos_actualizados
            },
            message='Lote actualizado exitosamente'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(
            message='Error al actualizar el lote',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 6: GET /api/lotes/vencidos - Reporte de lotes vencidos
# ==================================================================================

@lotes_bp.route('/vencidos', methods=['GET'])
@jwt_required()
def reporte_vencidos():
    """
    Obtener reporte de lotes vencidos

    Genera un reporte de lotes que ya han superado su fecha de vencimiento.
    Util para:
    - Identificar mermas
    - Calcular perdidas economicas
    - Dar de baja productos
    - Analisis de gestion de inventario

    Query Parameters:
        con_stock (bool): true = solo vencidos con stock > 0 (default: true)
        desde (date): Fecha inicio del periodo (formato: YYYY-MM-DD)
        hasta (date): Fecha fin del periodo (formato: YYYY-MM-DD)
        limit (int): Maximo de resultados (default: 100)
        offset (int): Paginacion (default: 0)

    Returns:
        200: Reporte de lotes vencidos
        400: Parametros invalidos
        500: Error interno

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Reporte de lotes vencidos",
            "data": {
                "lotes_vencidos": [...],
                "total_lotes": 12,
                "cantidad_total_afectada": 340,
                "valor_perdido_estimado": 850.50,
                "productos_unicos_afectados": 8
            }
        }
    """
    try:
        # ========== PARAMETROS ==========
        con_stock = request.args.get('con_stock', 'true').lower() == 'true'
        desde = request.args.get('desde')
        hasta = request.args.get('hasta')
        limit = request.args.get('limit', default=100, type=int)
        offset = request.args.get('offset', default=0, type=int)

        # ========== CONSTRUIR QUERY ==========
        query = Lote.query.filter(Lote.fecha_vencimiento < datetime.now())

        # Filtrar solo con stock
        if con_stock:
            query = query.filter(Lote.cantidad_actual > 0)

        # Filtrar por rango de fechas de vencimiento
        if desde:
            try:
                fecha_desde = datetime.strptime(desde, '%Y-%m-%d')
                query = query.filter(Lote.fecha_vencimiento >= fecha_desde)
            except ValueError:
                return error_response(
                    'Formato de fecha invalido para "desde". Use YYYY-MM-DD',
                    status_code=400
                )

        if hasta:
            try:
                fecha_hasta = datetime.strptime(hasta, '%Y-%m-%d')
                query = query.filter(Lote.fecha_vencimiento <= fecha_hasta)
            except ValueError:
                return error_response(
                    'Formato de fecha invalido para "hasta". Use YYYY-MM-DD',
                    status_code=400
                )

        # Ordenar por fecha de vencimiento (mas antiguo primero)
        query = query.order_by(Lote.fecha_vencimiento.asc())

        # Contar total
        total = query.count()

        # Aplicar paginacion
        lotes_vencidos = query.limit(limit).offset(offset).all()

        # ========== CALCULAR METRICAS ==========
        cantidad_total_afectada = 0
        valor_perdido_estimado = Decimal('0')
        productos_unicos = set()

        lotes_dict = []
        for lote in lotes_vencidos:
            # BUG 3 CORREGIDO: Incluir información del producto
            lote_data = lote.to_dict(include_producto=True)
            lote_data['dias_vencido'] = abs(lote.dias_hasta_vencimiento)

            # Calcular valor perdido (cantidad * precio_compra)
            valor_lote_perdido = lote.cantidad_actual * lote.precio_compra_lote
            lote_data['valor_perdido'] = str(valor_lote_perdido)

            lotes_dict.append(lote_data)

            # Sumar metricas
            cantidad_total_afectada += lote.cantidad_actual
            valor_perdido_estimado += valor_lote_perdido
            productos_unicos.add(lote.producto_id)

        # ========== RESPUESTA EXITOSA ==========
        return success_response(
            data={
                'lotes_vencidos': lotes_dict,
                'total_lotes': total,
                'cantidad_total_afectada': cantidad_total_afectada,
                'valor_perdido_estimado': str(valor_perdido_estimado),
                'productos_unicos_afectados': len(productos_unicos),
                'limit': limit,
                'offset': offset
            },
            message=f'{total} lotes vencidos encontrados'
        )

    except Exception as e:
        return error_response(
            message='Error al generar reporte de vencidos',
            status_code=500,
            errors={'exception': str(e)}
        )
