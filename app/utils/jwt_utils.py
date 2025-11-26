# -*- coding: utf-8 -*-
"""
KATITA-POS - Utilidades JWT
============================
Funciones para generar y verificar tokens JWT (JSON Web Tokens).

JWT permite autenticacion stateless sin necesidad de sesiones en el servidor.
Cada token contiene la informacion del usuario codificada y firmada.

Tipos de tokens:
- Access Token: Token de corta duracion (8 horas) para acceder a recursos
- Refresh Token: Token de larga duracion (7 dias) para renovar access tokens
"""

from datetime import datetime, timedelta, timezone
import jwt
from flask import current_app
from typing import Dict, Any


def generar_token(user_id: int, username: str, rol: str) -> Dict[str, Any]:
    """
    Genera access token y refresh token para un usuario

    Los tokens JWT contienen:
    - user_id: ID del usuario en la base de datos
    - username: Nombre de usuario
    - rol: Rol del usuario (admin, vendedor, bodeguero)
    - iat (issued at): Timestamp de creacion
    - exp (expiration): Timestamp de expiracion

    Args:
        user_id (int): ID del usuario
        username (str): Nombre de usuario
        rol (str): Rol del usuario

    Returns:
        dict: Diccionario con access_token, refresh_token y expires_in

    Example:
        >>> tokens = generar_token(1, 'admin1', 'admin')
        >>> print(tokens['access_token'])
        'eyJ0eXAiOiJKV1QiLCJhbGc...'
    """
    # Obtener configuracion
    secret_key = current_app.config['JWT_SECRET_KEY']
    access_expires = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 28800)  # 8 horas
    refresh_expires = current_app.config.get('JWT_REFRESH_TOKEN_EXPIRES', 604800)  # 7 dias

    # Timestamp actual
    now = datetime.now(timezone.utc)

    # ========== CREAR ACCESS TOKEN ==========
    access_payload = {
        'user_id': user_id,
        'username': username,
        'rol': rol,
        'type': 'access',  # Cambio 'tipo' -> 'type' para compatibilidad con Flask-JWT-Extended
        'iat': now,
        'exp': now + timedelta(seconds=access_expires)
    }

    access_token = jwt.encode(
        access_payload,
        secret_key,
        algorithm='HS256'
    )

    # ========== CREAR REFRESH TOKEN ==========
    refresh_payload = {
        'user_id': user_id,
        'username': username,
        'type': 'refresh',  # Cambio 'tipo' -> 'type' para compatibilidad con Flask-JWT-Extended
        'iat': now,
        'exp': now + timedelta(seconds=refresh_expires)
    }

    refresh_token = jwt.encode(
        refresh_payload,
        secret_key,
        algorithm='HS256'
    )

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_in': access_expires,
        'token_type': 'Bearer'
    }


def verificar_token(token: str, token_type: str = 'access') -> Dict[str, Any]:
    """
    Verifica y decodifica un token JWT

    Valida:
    1. Firma del token (que no haya sido modificado)
    2. Fecha de expiracion
    3. Tipo de token (access o refresh)

    Args:
        token (str): Token JWT a verificar
        token_type (str): Tipo esperado ('access' o 'refresh')

    Returns:
        dict: Payload del token con datos del usuario

    Raises:
        jwt.ExpiredSignatureError: Si el token expiro
        jwt.InvalidTokenError: Si el token es invalido
        ValueError: Si el tipo de token no coincide

    Example:
        >>> payload = verificar_token(token, 'access')
        >>> print(payload['user_id'])
        1
    """
    secret_key = current_app.config['JWT_SECRET_KEY']

    try:
        # Decodificar y verificar token
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=['HS256']
        )

        # Verificar tipo de token (compatibilidad con Flask-JWT-Extended que usa 'type')
        if payload.get('type') != token_type:
            raise ValueError(f"Token invalido: se esperaba tipo '{token_type}' pero se recibio '{payload.get('type')}'")

        return payload

    except jwt.ExpiredSignatureError:
        # Token expirado
        raise jwt.ExpiredSignatureError('El token ha expirado')

    except jwt.InvalidTokenError as e:
        # Token invalido (firma incorrecta, formato incorrecto, etc)
        raise jwt.InvalidTokenError(f'Token invalido: {str(e)}')


def refrescar_token(refresh_token: str) -> Dict[str, Any]:
    """
    Genera un nuevo access token usando un refresh token valido

    El refresh token debe ser valido y no expirado. Se usa para obtener
    un nuevo access token sin que el usuario tenga que hacer login nuevamente.

    Flujo tipico:
    1. Access token expira (8 horas)
    2. Cliente detecta token expirado (401)
    3. Cliente envia refresh token a este endpoint
    4. Se genera nuevo access token
    5. Cliente continua usando la app sin re-login

    Args:
        refresh_token (str): Refresh token valido

    Returns:
        dict: Nuevo access_token y expires_in

    Raises:
        jwt.ExpiredSignatureError: Si el refresh token expiro
        jwt.InvalidTokenError: Si el refresh token es invalido
        ValueError: Si no es un refresh token

    Example:
        >>> new_tokens = refrescar_token(old_refresh_token)
        >>> print(new_tokens['access_token'])
        'eyJ0eXAiOiJKV1QiLCJhbGc...'
    """
    # Verificar que sea un refresh token valido
    payload = verificar_token(refresh_token, token_type='refresh')

    # Extraer datos del usuario
    user_id = payload['user_id']
    username = payload['username']

    # NOTA: El refresh token no incluye el rol por seguridad
    # Necesitamos obtenerlo de la base de datos
    from app.models.user import User
    user = User.query.get(user_id)

    if not user:
        raise ValueError('Usuario no encontrado')

    if not user.activo:
        raise ValueError('Usuario inactivo')

    # Generar solo nuevo access token
    secret_key = current_app.config['JWT_SECRET_KEY']
    access_expires = current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 28800)

    now = datetime.now(timezone.utc)

    access_payload = {
        'user_id': user.id,
        'username': user.username,
        'rol': user.rol,
        'type': 'access',  # Cambio 'tipo' -> 'type' para compatibilidad con Flask-JWT-Extended
        'iat': now,
        'exp': now + timedelta(seconds=access_expires)
    }

    access_token = jwt.encode(
        access_payload,
        secret_key,
        algorithm='HS256'
    )

    return {
        'access_token': access_token,
        'expires_in': access_expires,
        'token_type': 'Bearer'
    }


def extraer_token_del_header(authorization_header: str) -> str:
    """
    Extrae el token JWT del header Authorization

    El header debe tener el formato: "Bearer <token>"

    Args:
        authorization_header (str): Valor del header Authorization

    Returns:
        str: Token JWT sin el prefijo "Bearer "

    Raises:
        ValueError: Si el formato del header es invalido

    Example:
        >>> token = extraer_token_del_header("Bearer eyJ0eXAi...")
        >>> print(token)
        'eyJ0eXAi...'
    """
    if not authorization_header:
        raise ValueError('Header Authorization no proporcionado')

    # El formato debe ser: "Bearer <token>"
    parts = authorization_header.split()

    if len(parts) != 2:
        raise ValueError('Formato de Authorization invalido. Use: Bearer <token>')

    if parts[0].lower() != 'bearer':
        raise ValueError('Tipo de token invalido. Use: Bearer <token>')

    return parts[1]
