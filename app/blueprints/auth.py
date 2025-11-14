# -*- coding: utf-8 -*-
"""
KATITA-POS - Blueprint de Autenticacion
========================================
Endpoints para autenticacion de usuarios con JWT.

Este modulo maneja:
- Login: Autenticar usuario y generar tokens
- Logout: Cerrar sesion (invalidar en cliente)
- Refresh: Renovar access token con refresh token
- Me: Obtener info del usuario autenticado

Sistema JWT:
- Stateless: No hay sesiones en el servidor
- Access token: 8 horas de validez
- Refresh token: 7 dias de validez
- Bloqueo automatico tras 5 intentos fallidos
"""

from flask import Blueprint, request, g
from sqlalchemy.exc import IntegrityError
import jwt
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from app import db
from app.models.user import User
from app.utils.responses import (
    success_response, error_response, created_response,
    not_found_response, validation_error_response,
    unauthorized_response, forbidden_response
)
from app.decorators.auth_decorators import login_required

# Crear Blueprint con prefijo /api/auth
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# ==================================================================================
# ENDPOINT 1: POST /api/auth/login - Autenticar usuario
# ==================================================================================

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Autenticar usuario y generar tokens JWT

    Valida las credenciales del usuario (username + password) y genera
    tokens de acceso y refresco si la autenticacion es exitosa.

    Seguridad:
    - Verifica que el usuario exista y este activo
    - Verifica que no este bloqueado (tras 5 intentos fallidos)
    - Hashea el password con bcrypt
    - Registra intentos fallidos
    - Bloquea usuario tras 5 intentos
    - Actualiza ultimo_acceso en login exitoso

    Request body:
        {
            "username": "admin1",
            "password": "admin123"
        }

    Returns:
        200: Login exitoso con tokens
        401: Credenciales incorrectas, usuario bloqueado o inactivo
        404: Usuario no encontrado
        422: Campos faltantes

    Ejemplo de respuesta exitosa:
        {
            "success": true,
            "message": "Login exitoso",
            "data": {
                "user": {
                    "id": 1,
                    "username": "admin1",
                    "nombre_completo": "Admin Principal",
                    "email": "admin@katita.com",
                    "rol": "admin",
                    "activo": true,
                    "ultimo_acceso": "2025-11-05T18:30:00"
                },
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "expires_in": 28800,
                "token_type": "Bearer"
            }
        }
    """
    try:
        data = request.json

        # ========== VALIDAR CAMPOS REQUERIDOS ==========
        errores = {}

        if not data.get('username'):
            errores['username'] = 'El username es requerido'

        if not data.get('password'):
            errores['password'] = 'El password es requerido'

        if errores:
            return validation_error_response(errores)

        username = data['username']
        password = data['password']

        # ========== BUSCAR USUARIO ==========
        user = User.query.filter_by(username=username).first()

        if not user:
            return not_found_response('Usuario no encontrado')

        # ========== VERIFICAR SI ESTA BLOQUEADO ==========
        if user.esta_bloqueado():
            # Obtener tiempo restante de bloqueo
            from datetime import datetime, timezone
            if user.bloqueado_hasta:
                tiempo_restante = (user.bloqueado_hasta - datetime.now(timezone.utc)).total_seconds() / 60
                return unauthorized_response(
                    f'Usuario bloqueado por multiples intentos fallidos. '
                    f'Intente nuevamente en {int(tiempo_restante)} minutos.',
                    errors={'bloqueado_hasta': user.bloqueado_hasta.isoformat()}
                )
            else:
                return unauthorized_response('Usuario bloqueado')

        # ========== VERIFICAR SI ESTA ACTIVO ==========
        if not user.activo:
            return unauthorized_response('Usuario inactivo. Contacte al administrador.')

        # ========== VERIFICAR PASSWORD ==========
        if not user.check_password(password):
            # Password incorrecto: registrar intento fallido
            user.incrementar_intentos_fallidos()
            db.session.commit()

            intentos_restantes = 5 - user.intentos_login_fallidos

            if intentos_restantes > 0:
                return unauthorized_response(
                    f'Credenciales incorrectas. Intentos restantes: {intentos_restantes}',
                    errors={'intentos_restantes': intentos_restantes}
                )
            else:
                return unauthorized_response(
                    'Usuario bloqueado por multiples intentos fallidos. '
                    'Intente nuevamente en 30 minutos.'
                )

        # ========== PASSWORD CORRECTO - GENERAR TOKENS ==========
        # Registrar login exitoso (resetea intentos fallidos, actualiza ultimo_acceso)
        user.registrar_acceso()
        db.session.commit()

        # Generar tokens JWT usando Flask-JWT-Extended
        access_token = create_access_token(
            identity=str(user.id),  # Convertir a string (requerido por Flask-JWT-Extended)
            additional_claims={
                'username': user.username,
                'rol': user.rol
            }
        )

        refresh_token = create_refresh_token(identity=str(user.id))

        # ========== DEBUGGING: Información del token ==========
        print(f'\n🔐 TOKEN GENERADO PARA: {username}')
        print(f'   Identity (user_id): {user.id}')
        print(f'   Username: {user.username}')
        print(f'   Rol: {user.rol}')
        print(f'   ✅ Access token válido por 8 horas')
        print(f'   ✅ Refresh token válido por 7 días')

        print(f'\n✅ Login exitoso: {username} (Rol: {user.rol})')
        print(f'✅ Tokens JWT generados correctamente')

        # ========== RESPUESTA EXITOSA ==========
        return success_response(
            data={
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'nombre_completo': user.nombre_completo,
                    'email': user.email,
                    'rol': user.rol,
                    'activo': user.activo,
                    'ultimo_acceso': user.ultimo_acceso.isoformat() if user.ultimo_acceso else None
                },
                'access_token': access_token,
                'refresh_token': refresh_token,
                'token_type': 'Bearer',
                'expires_in': 28800  # 8 horas en segundos
            },
            message='Login exitoso'
        )

    except Exception as e:
        db.session.rollback()
        return error_response(
            message='Error al procesar login',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 2: POST /api/auth/logout - Cerrar sesion
# ==================================================================================

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """
    Cerrar sesion del usuario

    Como JWT es stateless (no hay sesiones en el servidor), el logout
    es responsabilidad del cliente: debe eliminar los tokens del
    localStorage o sessionStorage.

    Este endpoint sirve principalmente para:
    - Confirmar al cliente que puede eliminar los tokens
    - Registrar el evento de logout para auditoria (opcional)
    - Realizar limpieza adicional si es necesaria

    Headers requeridos:
        Authorization: Bearer <access_token>

    Returns:
        200: Logout exitoso
        401: Token invalido o expirado

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Logout exitoso",
            "data": {
                "username": "admin1",
                "mensaje": "Los tokens deben ser eliminados del cliente"
            }
        }
    """
    try:
        # El decorador @login_required ya verifico el token
        # Los datos del usuario estan en g.current_user
        username = g.current_user['username']

        # Aqui podriamos registrar el logout en una tabla de auditoria
        # Por ahora solo confirmamos el logout

        return success_response(
            data={
                'username': username,
                'mensaje': 'Los tokens deben ser eliminados del cliente'
            },
            message='Logout exitoso'
        )

    except Exception as e:
        return error_response(
            message='Error al procesar logout',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 3: POST /api/auth/refresh - Refrescar access token
# ==================================================================================

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refrescar access token usando refresh token

    Cuando el access token expira (8 horas), el cliente puede usar
    el refresh token para obtener un nuevo access token sin que el
    usuario tenga que hacer login nuevamente.

    Flujo tipico:
    1. Cliente hace request con access token expirado
    2. Servidor responde 401 con mensaje "Token expirado"
    3. Cliente detecta token expirado
    4. Cliente envia refresh token en el header Authorization
    5. Servidor genera nuevo access token
    6. Cliente guarda nuevo token y reintenta request original

    Headers requeridos:
        Authorization: Bearer <refresh_token>

    Returns:
        200: Nuevo access token generado
        401: Refresh token invalido o expirado

    Ejemplo de respuesta exitosa:
        {
            "success": true,
            "message": "Token refrescado exitosamente",
            "data": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "expires_in": 28800,
                "token_type": "Bearer"
            }
        }
    """
    try:
        # Obtener identidad del usuario desde el refresh token (es string)
        current_user_id_str = get_jwt_identity()
        current_user_id = int(current_user_id_str)  # Convertir a int para consulta DB

        print(f'🔄 Refrescando token para usuario ID: {current_user_id}')

        # Buscar usuario para incluir claims adicionales
        user = User.query.get(current_user_id)

        if not user:
            return not_found_response('Usuario no encontrado')

        if not user.activo:
            return unauthorized_response('Usuario inactivo')

        # ========== GENERAR NUEVO ACCESS TOKEN ==========
        new_access_token = create_access_token(
            identity=str(user.id),  # Convertir a string
            additional_claims={
                'username': user.username,
                'rol': user.rol
            }
        )

        print(f'✅ Token refrescado para usuario: {user.username}')

        return success_response(
            data={
                'access_token': new_access_token,
                'token_type': 'Bearer',
                'expires_in': 28800  # 8 horas en segundos
            },
            message='Token refrescado exitosamente'
        )

    except Exception as e:
        return error_response(
            message='Error al refrescar token',
            status_code=500,
            errors={'exception': str(e)}
        )


# ==================================================================================
# ENDPOINT 4: GET /api/auth/me - Obtener usuario actual
# ==================================================================================

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """
    Obtener informacion del usuario autenticado

    Retorna los datos completos del usuario que esta autenticado.
    Util para:
    - Verificar que el token siga siendo valido
    - Obtener info actualizada del usuario
    - Mostrar perfil del usuario en el frontend

    Headers requeridos:
        Authorization: Bearer <access_token>

    Returns:
        200: Informacion del usuario
        401: Token invalido o expirado

    Ejemplo de respuesta:
        {
            "success": true,
            "message": "Usuario obtenido exitosamente",
            "data": {
                "id": 1,
                "username": "admin1",
                "email": "admin@katita.com",
                "nombre_completo": "Admin Principal",
                "telefono": "987654321",
                "rol": "admin",
                "activo": true,
                "ultimo_acceso": "2025-11-05T18:30:00",
                "intentos_login_fallidos": 0,
                "created_at": "2025-11-01T10:00:00",
                "updated_at": "2025-11-05T18:30:00"
            }
        }
    """
    try:
        # El decorador @login_required ya verifico el token
        # Los datos del usuario estan en g.current_user
        user_id = g.current_user['user_id']

        # Buscar usuario en la base de datos
        user = User.query.get(user_id)

        if not user:
            return not_found_response('Usuario no encontrado')

        if not user.activo:
            return unauthorized_response('Usuario inactivo')

        # ========== RESPUESTA CON INFO COMPLETA DEL USUARIO ==========
        return success_response(
            data={
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'nombre_completo': user.nombre_completo,
                'telefono': user.telefono,
                'rol': user.rol,
                'activo': user.activo,
                'ultimo_acceso': user.ultimo_acceso.isoformat() if user.ultimo_acceso else None,
                'intentos_login_fallidos': user.intentos_login_fallidos,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            },
            message='Usuario obtenido exitosamente'
        )

    except Exception as e:
        return error_response(
            message='Error al obtener usuario',
            status_code=500,
            errors={'exception': str(e)}
        )
