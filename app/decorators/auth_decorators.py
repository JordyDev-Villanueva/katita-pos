# -*- coding: utf-8 -*-
"""
KATITA-POS - Decoradores de Autenticacion y Autorizacion
==========================================================
Decoradores para proteger endpoints con autenticacion JWT y control de roles.

Decoradores disponibles:
- @login_required: Requiere token JWT valido
- @role_required('admin', 'vendedor'): Requiere rol especifico

Uso tipico:
    @app.route('/admin/usuarios')
    @login_required
    @role_required('admin')
    def listar_usuarios():
        # Solo usuarios con rol 'admin' pueden acceder
        pass
"""

from functools import wraps
from flask import request, g
import jwt
from app.utils.responses import unauthorized_response, forbidden_response
from app.utils.jwt_utils import verificar_token, extraer_token_del_header


def login_required(f):
    """
    Decorador que requiere token JWT valido para acceder al endpoint

    Verifica que:
    1. El header Authorization este presente
    2. El token tenga formato correcto (Bearer <token>)
    3. El token sea valido y no haya expirado
    4. El token sea de tipo 'access'

    Si todas las validaciones pasan, guarda los datos del usuario
    en g.current_user para que esten disponibles en el endpoint.

    Args:
        f: Funcion del endpoint a proteger

    Returns:
        Funcion decorada que verifica autenticacion

    Raises:
        401 Unauthorized: Si el token falta, es invalido o expiro

    Example:
        @app.route('/productos')
        @login_required
        def listar_productos():
            # En este punto, g.current_user esta disponible
            user_id = g.current_user['user_id']
            username = g.current_user['username']
            rol = g.current_user['rol']
            return {'productos': [...]}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # ========== EXTRAER TOKEN DEL HEADER ==========
        authorization_header = request.headers.get('Authorization')

        if not authorization_header:
            return unauthorized_response('Token de autenticacion requerido')

        try:
            # Extraer token del formato "Bearer <token>"
            token = extraer_token_del_header(authorization_header)

        except ValueError as e:
            return unauthorized_response(str(e))

        # ========== VERIFICAR TOKEN ==========
        try:
            # Verificar que sea un access token valido
            payload = verificar_token(token, token_type='access')

            # Guardar datos del usuario en g para acceso en el endpoint
            g.current_user = {
                'user_id': payload['user_id'],
                'username': payload['username'],
                'rol': payload['rol']
            }

        except jwt.ExpiredSignatureError:
            return unauthorized_response('Token expirado. Por favor, refresque su token.')

        except jwt.InvalidTokenError as e:
            return unauthorized_response(f'Token invalido: {str(e)}')

        except ValueError as e:
            return unauthorized_response(str(e))

        except Exception as e:
            return unauthorized_response(f'Error al verificar token: {str(e)}')

        # Token valido, ejecutar endpoint
        return f(*args, **kwargs)

    return decorated_function


def role_required(*allowed_roles):
    """
    Decorador que requiere que el usuario tenga uno de los roles especificados

    Este decorador DEBE usarse DESPUES de @login_required porque necesita
    acceder a g.current_user que es establecido por login_required.

    Args:
        *allowed_roles: Roles permitidos ('admin', 'vendedor', 'bodeguero')

    Returns:
        Decorador que verifica el rol del usuario

    Raises:
        403 Forbidden: Si el usuario no tiene el rol requerido
        401 Unauthorized: Si no hay usuario autenticado

    Example:
        # Solo admin puede acceder
        @app.route('/admin/reportes')
        @login_required
        @role_required('admin')
        def generar_reporte():
            return {'reporte': [...]}

        # Admin y bodeguero pueden acceder
        @app.route('/inventario/lotes')
        @login_required
        @role_required('admin', 'bodeguero')
        def crear_lote():
            return {'lote': {...}}

        # Todos los roles autenticados pueden acceder
        @app.route('/productos')
        @login_required
        def listar_productos():
            return {'productos': [...]}
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar que el usuario este autenticado
            if not hasattr(g, 'current_user'):
                return unauthorized_response(
                    'Usuario no autenticado. El decorador @login_required debe usarse antes de @role_required'
                )

            # Obtener rol del usuario actual
            user_rol = g.current_user.get('rol')

            if not user_rol:
                return unauthorized_response('Rol de usuario no encontrado en el token')

            # Verificar si el rol del usuario esta en los roles permitidos
            if user_rol not in allowed_roles:
                return forbidden_response(
                    message=f'Acceso denegado. Se requiere uno de estos roles: {", ".join(allowed_roles)}',
                    errors={
                        'rol_requerido': list(allowed_roles),
                        'rol_actual': user_rol
                    }
                )

            # Rol valido, ejecutar endpoint
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def optional_auth(f):
    """
    Decorador que intenta autenticar al usuario pero NO falla si no hay token

    Util para endpoints que pueden funcionar sin autenticacion pero que
    muestran contenido diferente si el usuario esta autenticado.

    Si hay token valido, guarda datos en g.current_user
    Si no hay token o es invalido, g.current_user sera None

    Args:
        f: Funcion del endpoint

    Returns:
        Funcion decorada

    Example:
        @app.route('/productos')
        @optional_auth
        def listar_productos():
            if g.current_user:
                # Usuario autenticado, mostrar precios
                return {'productos': [...], 'precios': [...]}
            else:
                # Usuario anonimo, no mostrar precios
                return {'productos': [...]}
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Intentar extraer y verificar token
        authorization_header = request.headers.get('Authorization')

        g.current_user = None  # Default: no autenticado

        if authorization_header:
            try:
                token = extraer_token_del_header(authorization_header)
                payload = verificar_token(token, token_type='access')

                g.current_user = {
                    'user_id': payload['user_id'],
                    'username': payload['username'],
                    'rol': payload['rol']
                }

            except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
                # Token invalido, pero no fallar - continuar sin autenticacion
                pass

        # Ejecutar endpoint (con o sin autenticacion)
        return f(*args, **kwargs)

    return decorated_function
