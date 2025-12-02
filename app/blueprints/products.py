"""
KATITA-POS - Blueprint de Products
===================================
Blueprint para gestionar endpoints de productos (API REST)

Endpoints:
- GET    /api/products/health  - Health check del blueprint
- GET    /api/products         - Listar todos los productos
- GET    /api/products/<id>    - Obtener un producto por ID
- POST   /api/products         - Crear un nuevo producto
- PUT    /api/products/<id>    - Actualizar un producto
- DELETE /api/products/<id>    - Eliminar un producto (soft delete)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
from app import db
from app.models.product import Product
from app.models.lote import Lote
from app.utils.responses import (
    success_response, error_response, created_response,
    not_found_response, validation_error_response, conflict_response
)
from app.decorators.auth_decorators import login_required, role_required

# Crear el blueprint
products_bp = Blueprint('products', __name__, url_prefix='/api/products')


@products_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check del blueprint de products

    Returns:
        JSON: Estado del blueprint

    Ejemplo de respuesta:
        {
            "status": "ok",
            "blueprint": "products",
            "message": "Blueprint de products funcionando correctamente"
        }
    """
    return jsonify({
        "status": "ok",
        "blueprint": "products",
        "message": "Blueprint de products funcionando correctamente"
    }), 200


# ============================================================================
# ENDPOINT 1: POST /api/products - Crear nuevo producto
# ============================================================================

@products_bp.route('', methods=['POST'])
@jwt_required()
def crear_producto():
    """
    Crea un nuevo producto en el sistema

    Request Body:
        {
            "codigo_barras": "7750182001878",  (requerido, único)
            "nombre": "Coca Cola 500ml",       (requerido, max 200 chars)
            "categoria": "Bebidas",            (opcional)
            "precio_compra": 2.00,             (requerido, > 0)
            "precio_venta": 3.50,              (requerido, > precio_compra)
            "stock_total": 0,                  (opcional, default 0, >= 0)
            "stock_minimo": 10,                (opcional, default 5, >= 0)
            "descripcion": "...",              (opcional)
            "imagen_url": "https://..."        (opcional)
        }

    Returns:
        201: Producto creado exitosamente
        400: Error de validación
        409: Código de barras duplicado
        500: Error interno del servidor

    Ejemplo de respuesta exitosa:
        {
            "success": true,
            "message": "Producto creado exitosamente",
            "data": {
                "id": 1,
                "codigo_barras": "7750182001878",
                "nombre": "Coca Cola 500ml",
                ...
            }
        }
    """
    try:
        # LOG: Inicio de creación de producto
        print("\n" + "="*60)
        print("[DEBUG] POST /api/products - Crear producto")
        print("="*60)

        # Validar que request.json exista
        if not request.json:
            return validation_error_response(
                {"request": "El cuerpo de la solicitud debe ser JSON"},
                "Datos inválidos"
            )

        data = request.json
        print(f"Datos recibidos:")
        print(f"  - codigo_barras: {data.get('codigo_barras')}")
        print(f"  - nombre: {data.get('nombre')}")
        print(f"  - categoria: {data.get('categoria')}")
        print(f"  - precio_compra: {data.get('precio_compra')}")
        print(f"  - precio_venta: {data.get('precio_venta')}")
        print(f"  - stock_minimo: {data.get('stock_minimo')}")

        errores = {}

        # Validar campos requeridos
        if not data.get('codigo_barras'):
            errores['codigo_barras'] = 'Campo requerido'
        if not data.get('nombre'):
            errores['nombre'] = 'Campo requerido'
        if 'precio_compra' not in data:
            errores['precio_compra'] = 'Campo requerido'
        if 'precio_venta' not in data:
            errores['precio_venta'] = 'Campo requerido'

        # Si hay errores de campos requeridos, retornar ahora
        if errores:
            return validation_error_response(errores, "Faltan campos requeridos")

        # Validar tipos y valores
        try:
            precio_compra = Decimal(str(data['precio_compra']))
            precio_venta = Decimal(str(data['precio_venta']))
            stock_total = int(data.get('stock_total', 0))
            stock_minimo = int(data.get('stock_minimo', 5))
        except (ValueError, TypeError) as e:
            return validation_error_response(
                {"formato": "Precios deben ser números y stocks deben ser enteros"},
                "Formato de datos inválido"
            )

        # Validar rangos
        if precio_compra <= 0:
            errores['precio_compra'] = 'Debe ser mayor a 0'
        if precio_venta <= 0:
            errores['precio_venta'] = 'Debe ser mayor a 0'
        if precio_venta <= precio_compra:
            errores['precio_venta'] = 'Debe ser mayor que el precio de compra'
        if stock_total < 0:
            errores['stock_total'] = 'No puede ser negativo'
        if stock_minimo < 0:
            errores['stock_minimo'] = 'No puede ser negativo'
        if len(data['nombre']) > 200:
            errores['nombre'] = 'No puede exceder 200 caracteres'

        if errores:
            return validation_error_response(errores, "Validación de datos fallida")

        # Verificar que el código de barras no exista
        producto_existente = Product.buscar_por_codigo(data['codigo_barras'])
        if producto_existente:
            return conflict_response(
                "El código de barras ya existe",
                {"codigo_barras": data['codigo_barras']}
            )

        # Crear nuevo producto
        print(f"\nCreando nuevo producto...")
        nuevo_producto = Product(
            codigo_barras=data['codigo_barras'],
            nombre=data['nombre'],
            categoria=data.get('categoria'),
            precio_compra=precio_compra,
            precio_venta=precio_venta,
            stock_total=stock_total,
            stock_minimo=stock_minimo,
            descripcion=data.get('descripcion'),
            imagen_url=data.get('imagen_url')
        )

        db.session.add(nuevo_producto)
        print(f"  - Producto agregado a la sesion")

        db.session.commit()
        print(f"  - COMMIT realizado exitosamente")
        print(f"  - ID asignado: {nuevo_producto.id}")
        print(f"  - Producto guardado: {nuevo_producto.nombre}")
        print("="*60 + "\n")

        return created_response(
            {"producto": nuevo_producto.to_dict()},
            "Producto creado exitosamente"
        )

    except IntegrityError as e:
        db.session.rollback()
        return conflict_response(
            "El código de barras ya existe o hay un error de integridad",
            {"error": str(e.orig)}
        )
    except ValueError as e:
        db.session.rollback()
        return validation_error_response(
            {"validacion": str(e)},
            "Error de validación"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error interno del servidor: {str(e)}", 500)


# ============================================================================
# ENDPOINT 2: GET /api/products - Listar productos con filtros
# ============================================================================

@products_bp.route('', methods=['GET'])
@jwt_required()
def listar_productos():
    """
    Lista todos los productos con filtros opcionales

    Query Parameters:
        - activo: 'true' o 'false' (filtrar por estado)
        - categoria: string (filtrar por categoría exacta)
        - bajo_stock: 'true' (solo productos con stock_total <= stock_minimo)
        - buscar: string (buscar en nombre o código de barras, case insensitive)
        - limit: int (default 100, máximo 500)
        - offset: int (default 0, para paginación)

    Ejemplos:
        GET /api/products
        GET /api/products?activo=true
        GET /api/products?categoria=Bebidas
        GET /api/products?bajo_stock=true
        GET /api/products?buscar=coca
        GET /api/products?limit=10&offset=0

    Returns:
        200: Lista de productos
        500: Error interno del servidor

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Productos obtenidos exitosamente",
            "data": {
                "productos": [...],
                "total": 50,
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

        if lotes_vencidos:
            for lote in lotes_vencidos:
                lote.activo = False
            db.session.commit()

        # ========== AUTO-INACTIVAR PRODUCTOS SIN LOTES VÁLIDOS ==========
        # Obtener todos los productos activos con stock
        productos_con_stock = Product.query.filter(
            Product.activo == True,
            Product.stock_total > 0
        ).all()

        for producto in productos_con_stock:
            # Verificar si tiene al menos un lote válido (no vencido con stock)
            lotes_validos = Lote.query.filter(
                Lote.producto_id == producto.id,
                Lote.cantidad_actual > 0,
                Lote.fecha_vencimiento > hoy,
                Lote.activo == True
            ).count()

            # Si no tiene lotes válidos, inactivar el producto
            if lotes_validos == 0:
                producto.activo = False

        db.session.commit()

        # Obtener usuario autenticado
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str) if current_user_id_str else None

        # LOG: Parámetros recibidos
        print("\n" + "="*60)
        print("[DEBUG] GET /api/products - Solicitud recibida")
        print(f"Usuario autenticado: {current_user_id}")
        print("="*60)

        # Obtener parámetros de query
        activo_param = request.args.get('activo')
        categoria = request.args.get('categoria')
        bajo_stock_param = request.args.get('bajo_stock')
        buscar = request.args.get('buscar')

        print(f"Parametros recibidos:")
        print(f"  - activo: {activo_param}")
        print(f"  - categoria: {categoria}")
        print(f"  - bajo_stock: {bajo_stock_param}")
        print(f"  - buscar: {buscar}")

        # Paginación
        try:
            limit = min(int(request.args.get('limit', 100)), 500)
            offset = int(request.args.get('offset', 0))
        except ValueError:
            limit = 100
            offset = 0

        print(f"  - limit: {limit}")
        print(f"  - offset: {offset}")

        # Crear query base
        query = Product.query

        # Aplicar filtros
        if activo_param is not None:
            if activo_param.lower() == 'true':
                query = query.filter(Product.activo == True)
            elif activo_param.lower() == 'false':
                query = query.filter(Product.activo == False)

        if categoria:
            query = query.filter(Product.categoria == categoria)

        if bajo_stock_param and bajo_stock_param.lower() == 'true':
            query = query.filter(Product.stock_total <= Product.stock_minimo)

        if buscar:
            buscar_pattern = f'%{buscar}%'
            query = query.filter(
                db.or_(
                    Product.nombre.ilike(buscar_pattern),
                    Product.codigo_barras.ilike(buscar_pattern)
                )
            )

        # Obtener total ANTES de aplicar limit/offset
        total = query.count()
        print(f"\nTotal de productos encontrados (sin paginacion): {total}")

        # Aplicar paginación y ejecutar query
        productos = query.order_by(Product.nombre).limit(limit).offset(offset).all()
        print(f"Productos retornados (con paginacion): {len(productos)}")

        # Convertir a diccionarios
        productos_dict = [producto.to_dict() for producto in productos]

        # LOG: Primeros productos
        if productos_dict:
            print(f"\nPrimeros productos:")
            for i, p in enumerate(productos_dict[:3], 1):
                print(f"  {i}. {p['nombre']} ({p['codigo_barras']}) - Activo: {p['activo']}")
        else:
            print("\n  ⚠ ADVERTENCIA: Array de productos VACIO")

        # ESTRUCTURA DE RESPUESTA CORRECTA
        # Para el frontend, retornar directamente el array en "data"
        response_data = {
            "productos": productos_dict,
            "total": total,
            "limit": limit,
            "offset": offset
        }

        print(f"\nEstructura de respuesta:")
        print(f"  - success: true")
        print(f"  - data.productos: array con {len(productos_dict)} elementos")
        print(f"  - data.total: {total}")
        print("="*60 + "\n")

        return success_response(
            response_data,
            f"{len(productos_dict)} productos obtenidos exitosamente"
        )

    except Exception as e:
        return error_response(f"Error al obtener productos: {str(e)}", 500)


# ============================================================================
# ENDPOINT ESPECIAL PARA POS: GET /api/products/barcode/<codigo>
# ============================================================================

@products_bp.route('/barcode/<codigo_barras>', methods=['GET'])
@jwt_required()
def buscar_por_codigo_barras(codigo_barras):
    """
    Buscar producto por codigo de barras para sistema POS

    ENDPOINT CRITICO para el sistema POS. Cuando el vendedor escanea
    un codigo de barras con el lector USB Bluetooth, este endpoint
    retorna el producto completo con sus lotes disponibles ordenados
    FIFO (First In, First Out) para garantizar trazabilidad.

    Caracteristicas:
    - Busca producto por codigo de barras
    - Valida que este activo
    - Retorna lotes disponibles ordenados FIFO (primero que vence sale primero)
    - Incluye informacion de vencimiento de cada lote
    - Identifica el lote_siguiente_fifo (el que se usara en la proxima venta)

    Path Parameters:
        codigo_barras (str): Codigo de barras del producto (EAN-13, UPC, etc.)

    Returns:
        200 OK: Producto encontrado con lotes FIFO
            - Con stock: incluye lotes_disponibles y lote_siguiente_fifo
            - Sin stock: warning e indica lote_siguiente_fifo = null
        404 Not Found: Producto no existe o esta inactivo
        500 Internal Server Error: Error del servidor

    Response format (CON STOCK):
        {
          "success": true,
          "message": "Producto encontrado",
          "data": {
            "id": 1,
            "codigo_barras": "7750182001878",
            "nombre": "Coca Cola 500ml",
            "categoria": "Bebidas",
            "precio_venta": 3.50,
            "stock_total": 48,
            "lotes_disponibles": [
              {
                "id": 5,
                "codigo_lote": "LOTE-001",
                "cantidad_actual": 24,
                "fecha_vencimiento": "2025-12-31T00:00:00",
                "dias_hasta_vencimiento": 58,
                "esta_vencido": false,
                "esta_por_vencer": false
              }
            ],
            "lote_siguiente_fifo": {
              "id": 5,
              "codigo_lote": "LOTE-001",
              "cantidad_actual": 24,
              "fecha_vencimiento": "2025-12-31T00:00:00",
              "dias_hasta_vencimiento": 58
            }
          }
        }

    Response format (SIN STOCK):
        {
          "success": true,
          "message": "Producto encontrado",
          "warning": "Producto sin stock disponible",
          "data": {
            ...producto...,
            "lotes_disponibles": [],
            "lote_siguiente_fifo": null
          }
        }

    Ejemplos:
        GET /api/products/barcode/7750182001878
        → Retorna Coca Cola con lotes ordenados FIFO

        GET /api/products/barcode/7755139002015
        → Retorna Inca Kola con warning si no tiene lotes

    Notas importantes:
        - El orden FIFO es CRITICO para el negocio (evita mermas por vencimiento)
        - lote_siguiente_fifo es el que se usara automaticamente en la venta
        - Si hay productos vencidos, NO se incluyen en lotes_disponibles
        - dias_hasta_vencimiento ayuda al vendedor a identificar productos proximos a vencer
    """
    try:
        # Buscar producto por codigo de barras
        producto = Product.buscar_por_codigo(codigo_barras)

        # Validar que existe y esta activo
        if not producto or not producto.activo:
            return not_found_response(
                f"Producto con codigo de barras '{codigo_barras}' no encontrado o inactivo"
            )

        # Obtener lotes disponibles ordenados FIFO (primero que vence, primero que sale)
        lotes = Lote.lotes_fifo(producto.id)

        # Preparar informacion detallada de lotes con datos de vencimiento
        lotes_data = []
        for lote in lotes:
            lotes_data.append({
                'id': lote.id,
                'codigo_lote': lote.codigo_lote,
                'cantidad_actual': lote.cantidad_actual,
                'fecha_vencimiento': lote.fecha_vencimiento.isoformat(),
                'dias_hasta_vencimiento': lote.dias_hasta_vencimiento,
                'esta_vencido': lote.esta_vencido,
                'esta_por_vencer': lote.esta_por_vencer
            })

        # Construir respuesta completa con producto y lotes
        data = producto.to_dict()
        data['lotes_disponibles'] = lotes_data

        # lote_siguiente_fifo: el primero del array (el que se usara en la venta)
        data['lote_siguiente_fifo'] = lotes_data[0] if lotes_data else None

        # Si no hay lotes disponibles, agregar warning (no es error, solo informativo)
        if not lotes_data:
            response_data = success_response(data, "Producto encontrado")
            # Agregar warning al response JSON
            json_response = response_data[0].get_json()
            json_response['warning'] = "Producto sin stock disponible"
            return jsonify(json_response), 200

        return success_response(data, "Producto encontrado")

    except Exception as e:
        return error_response(f"Error al buscar producto: {str(e)}", 500)


# ============================================================================
# ENDPOINT 3: GET /api/products/<id> - Obtener un producto por ID
# ============================================================================

@products_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def obtener_producto(id):
    """
    Obtiene un producto específico por su ID

    Path Parameters:
        id (int): ID del producto

    Returns:
        200: Producto encontrado
        404: Producto no encontrado
        500: Error interno del servidor

    Ejemplo de respuesta exitosa:
        {
            "success": true,
            "message": "Producto encontrado",
            "data": {
                "id": 1,
                "codigo_barras": "7750182001878",
                "nombre": "Coca Cola 500ml",
                ...
            }
        }
    """
    try:
        # Buscar producto por ID
        producto = Product.query.get(id)

        if producto is None:
            return not_found_response(f"Producto con ID {id} no encontrado")

        return success_response(
            {"producto": producto.to_dict()},
            "Producto encontrado"
        )

    except Exception as e:
        return error_response(f"Error al obtener producto: {str(e)}", 500)


# ============================================================================
# ENDPOINT 4: PUT /api/products/<id> - Actualizar un producto
# ============================================================================

@products_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def actualizar_producto(id):
    """
    Actualiza un producto existente

    Path Parameters:
        id (int): ID del producto a actualizar

    Request Body (todos los campos son opcionales):
        {
            "nombre": "Nuevo nombre",
            "categoria": "Nueva categoría",
            "precio_compra": 2.50,
            "precio_venta": 4.00,
            "stock_minimo": 15,
            "descripcion": "Nueva descripción",
            "imagen_url": "https://...",
            "activo": true
        }

    NOTA:
        - NO se permite cambiar codigo_barras
        - NO se permite cambiar stock_total (usar endpoints de stock)
        - Si se cambian precios, precio_venta debe ser > precio_compra

    Returns:
        200: Producto actualizado exitosamente
        404: Producto no encontrado
        400: Error de validación
        500: Error interno del servidor

    Ejemplo de respuesta exitosa:
        {
            "success": true,
            "message": "Producto actualizado exitosamente",
            "data": {
                "id": 1,
                ...datos actualizados...
            }
        }
    """
    try:
        # Buscar producto
        producto = Product.query.get(id)

        if producto is None:
            return not_found_response(f"Producto con ID {id} no encontrado")

        # Validar que request.json exista
        if not request.json:
            return validation_error_response(
                {"request": "El cuerpo de la solicitud debe ser JSON"},
                "Datos inválidos"
            )

        data = request.json
        errores = {}

        # Campos permitidos para actualizar
        campos_permitidos = [
            'nombre', 'categoria', 'descripcion', 'imagen_url',
            'precio_compra', 'precio_venta', 'stock_minimo', 'activo'
        ]

        # Validar y actualizar campos
        if 'nombre' in data:
            if not data['nombre'] or len(data['nombre']) > 200:
                errores['nombre'] = 'Debe tener entre 1 y 200 caracteres'
            else:
                producto.nombre = data['nombre']

        if 'categoria' in data:
            producto.categoria = data['categoria']

        if 'descripcion' in data:
            producto.descripcion = data['descripcion']

        if 'imagen_url' in data:
            producto.imagen_url = data['imagen_url']

        if 'stock_minimo' in data:
            try:
                stock_minimo = int(data['stock_minimo'])
                if stock_minimo < 0:
                    errores['stock_minimo'] = 'No puede ser negativo'
                else:
                    producto.stock_minimo = stock_minimo
            except (ValueError, TypeError):
                errores['stock_minimo'] = 'Debe ser un número entero'

        if 'activo' in data:
            if isinstance(data['activo'], bool):
                producto.activo = data['activo']
            else:
                errores['activo'] = 'Debe ser un valor booleano (true/false)'

        # Validar precios si vienen en el request
        precio_compra_nuevo = None
        precio_venta_nuevo = None

        if 'precio_compra' in data:
            try:
                precio_compra_nuevo = Decimal(str(data['precio_compra']))
                if precio_compra_nuevo <= 0:
                    errores['precio_compra'] = 'Debe ser mayor a 0'
            except (ValueError, TypeError):
                errores['precio_compra'] = 'Debe ser un número válido'

        if 'precio_venta' in data:
            try:
                precio_venta_nuevo = Decimal(str(data['precio_venta']))
                if precio_venta_nuevo <= 0:
                    errores['precio_venta'] = 'Debe ser mayor a 0'
            except (ValueError, TypeError):
                errores['precio_venta'] = 'Debe ser un número válido'

        # Validar que precio_venta > precio_compra
        precio_compra_final = precio_compra_nuevo if precio_compra_nuevo else producto.precio_compra
        precio_venta_final = precio_venta_nuevo if precio_venta_nuevo else producto.precio_venta

        if precio_venta_final <= precio_compra_final:
            errores['precio_venta'] = 'Debe ser mayor que el precio de compra'

        # Si hay errores de validación, retornar
        if errores:
            return validation_error_response(errores, "Validación de datos fallida")

        # Aplicar cambios de precios si no hay errores
        if precio_compra_nuevo:
            producto.precio_compra = precio_compra_nuevo
        if precio_venta_nuevo:
            producto.precio_venta = precio_venta_nuevo

        # Guardar cambios
        db.session.commit()

        return success_response(
            {"producto": producto.to_dict()},
            "Producto actualizado exitosamente"
        )

    except ValueError as e:
        db.session.rollback()
        return validation_error_response(
            {"validacion": str(e)},
            "Error de validación"
        )
    except Exception as e:
        db.session.rollback()
        return error_response(f"Error interno del servidor: {str(e)}", 500)

# ==================================================================================
# ENDPOINT NUEVO - FASE 5: Búsqueda automática por código de barras (Open Food Facts)
# ==================================================================================

@products_bp.route('/buscar-barcode/<barcode>', methods=['GET'])
def buscar_producto_por_barcode(barcode):
    """
    Busca información de producto en Open Food Facts API usando código de barras.

    Permite auto-completar datos del producto (nombre, foto, marca, categoría)
    cuando el usuario escanea o ingresa un código de barras.

    Args:
        barcode (str): Código de barras del producto (8-13 dígitos)

    Returns:
        JSON: Información del producto si se encuentra, o not_found

    Ejemplo de respuesta exitosa:
        {
            "encontrado": true,
            "nombre": "Coca Cola Original 500ml",
            "foto_url": "https://...",
            "marca": "Coca-Cola",
            "categoria": "Bebidas"
        }

    Ejemplo de respuesta no encontrada:
        {
            "encontrado": false,
            "mensaje": "Producto no encontrado en Open Food Facts"
        }
    """
    try:
        import requests
        from flask import current_app

        # Validar que el código de barras tenga longitud válida
        if not barcode or len(barcode) < 8 or len(barcode) > 13:
            return jsonify({
                'encontrado': False,
                'mensaje': 'Código de barras inválido. Debe tener entre 8 y 13 dígitos.'
            }), 400

        # Buscar en Open Food Facts API
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        current_app.logger.info(f"Buscando producto en Open Food Facts: {barcode}")

        response = requests.get(url, timeout=5)

        if response.status_code == 200:
            data = response.json()

            # Verificar si el producto fue encontrado
            if data.get('status') == 1:
                producto = data.get('product', {})

                # Extraer información relevante
                nombre = producto.get('product_name', '') or producto.get('product_name_es', '')
                foto_url = producto.get('image_url', '') or producto.get('image_front_url', '')
                marca = producto.get('brands', '')

                # Categorías en Open Food Facts vienen como tags
                categorias = producto.get('categories_tags', [])
                categoria = categorias[0].replace('en:', '') if categorias else None

                current_app.logger.info(f"✓ Producto encontrado: {nombre}")

                return jsonify({
                    'encontrado': True,
                    'nombre': nombre,
                    'foto_url': foto_url,
                    'marca': marca,
                    'categoria': categoria,
                    'barcode': barcode
                })
            else:
                current_app.logger.info(f"Producto no encontrado en Open Food Facts: {barcode}")
                return jsonify({
                    'encontrado': False,
                    'mensaje': 'Producto no encontrado en Open Food Facts. Puedes registrarlo manualmente.'
                })
        else:
            current_app.logger.warning(f"Error en API Open Food Facts: {response.status_code}")
            return jsonify({
                'encontrado': False,
                'mensaje': 'Error al consultar Open Food Facts. Intenta nuevamente.'
            }), 503

    except requests.Timeout:
        current_app.logger.error("Timeout al consultar Open Food Facts API")
        return jsonify({
            'encontrado': False,
            'mensaje': 'Timeout al buscar producto. Verifica tu conexión.'
        }), 504

    except Exception as e:
        current_app.logger.error(f"Error buscando producto: {str(e)}")
        return jsonify({
            'encontrado': False,
            'mensaje': f'Error al buscar producto: {str(e)}'
        }), 500
