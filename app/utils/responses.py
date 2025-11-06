# -*- coding: utf-8 -*-
"""
KATITA-POS - Utilidades de Respuestas HTTP
===========================================
Funciones helper para estandarizar respuestas JSON de la API REST

Todas las funciones retornan tuplas (response, status_code)
para ser usadas directamente en endpoints Flask.
"""

from flask import jsonify


def success_response(data, message="Operacion exitosa", status_code=200):
    """
    Genera una respuesta JSON de exito

    Args:
        data: Datos a incluir en la respuesta (dict, list, etc.)
        message (str): Mensaje descriptivo del exito
        status_code (int): Codigo de estado HTTP (default: 200)

    Returns:
        tuple: (response_json, status_code)

    Ejemplo de uso:
        return success_response(
            data={'producto': producto.to_dict()},
            message="Producto encontrado"
        )

    Respuesta generada:
        {
            "success": true,
            "message": "Producto encontrado",
            "data": {...}
        }
    """
    response = {
        "success": True,
        "message": message,
        "data": data
    }
    return jsonify(response), status_code


def error_response(message, status_code=400, errors=None):
    """
    Genera una respuesta JSON de error

    Args:
        message (str): Mensaje descriptivo del error
        status_code (int): Codigo de estado HTTP (default: 400)
        errors (dict/list): Detalles adicionales del error (opcional)

    Returns:
        tuple: (response_json, status_code)

    Ejemplo de uso:
        return error_response(
            message="Validacion fallida",
            status_code=422,
            errors={'precio': 'Debe ser mayor a 0'}
        )

    Respuesta generada:
        {
            "success": false,
            "message": "Validacion fallida",
            "errors": {...}
        }
    """
    response = {
        "success": False,
        "message": message
    }

    if errors:
        response["errors"] = errors

    return jsonify(response), status_code


def created_response(data, message="Creado exitosamente"):
    """
    Genera una respuesta JSON de creacion exitosa (201 Created)

    Args:
        data: Datos del recurso creado
        message (str): Mensaje descriptivo de la creacion

    Returns:
        tuple: (response_json, 201)

    Ejemplo de uso:
        return created_response(
            data={'producto': nuevo_producto.to_dict()},
            message="Producto creado exitosamente"
        )

    Respuesta generada:
        {
            "success": true,
            "message": "Producto creado exitosamente",
            "data": {...}
        }
    """
    return success_response(data, message, status_code=201)


def not_found_response(message="Recurso no encontrado"):
    """
    Genera una respuesta JSON de recurso no encontrado (404 Not Found)

    Args:
        message (str): Mensaje descriptivo del recurso no encontrado

    Returns:
        tuple: (response_json, 404)

    Ejemplo de uso:
        return not_found_response("Producto no encontrado")

    Respuesta generada:
        {
            "success": false,
            "message": "Producto no encontrado"
        }
    """
    return error_response(message, status_code=404)


def validation_error_response(errors, message="Error de validacion"):
    """
    Genera una respuesta JSON de error de validacion (422 Unprocessable Entity)

    Args:
        errors (dict): Diccionario con los errores de validacion
        message (str): Mensaje descriptivo del error

    Returns:
        tuple: (response_json, 422)

    Ejemplo de uso:
        return validation_error_response(
            errors={
                'codigo_barras': 'Campo requerido',
                'precio_venta': 'Debe ser mayor a 0'
            }
        )

    Respuesta generada:
        {
            "success": false,
            "message": "Error de validacion",
            "errors": {...}
        }
    """
    return error_response(message, status_code=422, errors=errors)


def unauthorized_response(message="No autorizado", errors=None):
    """
    Genera una respuesta JSON de no autorizado (401 Unauthorized)

    Args:
        message (str): Mensaje descriptivo de la falta de autorizacion
        errors (dict): Detalles adicionales del error (opcional)

    Returns:
        tuple: (response_json, 401)

    Ejemplo de uso:
        return unauthorized_response("Token invalido o expirado")

    Respuesta generada:
        {
            "success": false,
            "message": "Token invalido o expirado"
        }
    """
    return error_response(message, status_code=401, errors=errors)


def forbidden_response(message="Acceso prohibido", errors=None):
    """
    Genera una respuesta JSON de acceso prohibido (403 Forbidden)

    Args:
        message (str): Mensaje descriptivo del acceso prohibido
        errors (dict): Detalles adicionales del error (opcional)

    Returns:
        tuple: (response_json, 403)

    Ejemplo de uso:
        return forbidden_response("No tienes permisos para eliminar productos")

    Respuesta generada:
        {
            "success": false,
            "message": "No tienes permisos para eliminar productos"
        }
    """
    return error_response(message, status_code=403, errors=errors)


def conflict_response(message="Conflicto de recursos", errors=None):
    """
    Genera una respuesta JSON de conflicto (409 Conflict)

    Args:
        message (str): Mensaje descriptivo del conflicto
        errors (dict): Detalles adicionales del conflicto (opcional)

    Returns:
        tuple: (response_json, 409)

    Ejemplo de uso:
        return conflict_response(
            message="El codigo de barras ya existe",
            errors={'codigo_barras': '7501234567890'}
        )

    Respuesta generada:
        {
            "success": false,
            "message": "El codigo de barras ya existe",
            "errors": {...}
        }
    """
    return error_response(message, status_code=409, errors=errors)
