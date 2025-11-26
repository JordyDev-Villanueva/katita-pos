"""
Blueprint de Usuarios para KATITA-POS

Gestiona CRUD completo de usuarios con horarios de trabajo.
Solo accesible para administradores.
"""

from flask import Blueprint, request, jsonify, g
from datetime import datetime
from app import db
from app.models.user import User
from app.decorators.auth_decorators import login_required, role_required
import re

usuarios_bp = Blueprint('usuarios', __name__, url_prefix='/api/usuarios')


# ===========================
# LISTAR TODOS LOS USUARIOS
# ===========================

@usuarios_bp.route('/', methods=['GET'])
@login_required
@role_required('admin')
def get_usuarios():
    """
    GET /api/usuarios/

    Lista todos los usuarios del sistema (solo admin)

    Query params:
    - rol: Filtrar por rol (admin/vendedor/bodeguero)
    - activo: Filtrar por estado (true/false)
    - search: Buscar por nombre o username
    """
    print("=" * 60)
    print("[DEBUG] GET /api/usuarios/ - INICIO")
    print(f"[DEBUG] Usuario actual: {g.current_user}")
    print("=" * 60)
    try:
        query = User.query

        # Filtro por rol
        rol = request.args.get('rol')
        if rol:
            query = query.filter_by(rol=rol)

        # Filtro por estado activo
        activo = request.args.get('activo')
        if activo is not None:
            activo_bool = activo.lower() == 'true'
            query = query.filter_by(activo=activo_bool)

        # Búsqueda por nombre o username
        search = request.args.get('search')
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                (User.nombre_completo.ilike(search_pattern)) |
                (User.username.ilike(search_pattern))
            )

        # Ordenar por fecha de creación (más recientes primero)
        usuarios = query.order_by(User.created_at.desc()).all()

        return jsonify({
            'success': True,
            'usuarios': [user.to_dict(include_sensitive=True) for user in usuarios],
            'total': len(usuarios)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al listar usuarios: {str(e)}'
        }), 500


# ===========================
# OBTENER USUARIO POR ID
# ===========================

@usuarios_bp.route('/<int:user_id>', methods=['GET'])
@login_required
@role_required('admin')
def get_usuario(user_id):
    """
    GET /api/usuarios/<id>

    Obtiene un usuario específico por ID (solo admin)
    """
    try:
        usuario = User.query.get(user_id)

        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404

        return jsonify({
            'success': True,
            'usuario': usuario.to_dict(include_sensitive=True)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error al obtener usuario: {str(e)}'
        }), 500


# ===========================
# CREAR NUEVO USUARIO
# ===========================

@usuarios_bp.route('/', methods=['POST'])
@login_required
@role_required('admin')
def crear_usuario():
    """
    POST /api/usuarios/

    Crea un nuevo usuario (solo admin)

    Body:
    {
        "username": "vendedor1",
        "password": "password123",
        "email": "vendedor1@katita.com",
        "nombre_completo": "Juan Pérez",
        "telefono": "987654321",
        "rol": "vendedor",
        "hora_entrada": "07:00",
        "hora_salida": "15:00",
        "dias_trabajo": "Lun-Vie"
    }
    """
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['username', 'password', 'email', 'nombre_completo', 'rol']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'El campo {field} es requerido'
                }), 400

        # Validar que username no exista
        if User.buscar_por_username(data['username']):
            return jsonify({
                'success': False,
                'error': 'El nombre de usuario ya está en uso'
            }), 400

        # Validar que email no exista
        if User.buscar_por_email(data['email']):
            return jsonify({
                'success': False,
                'error': 'El email ya está registrado'
            }), 400

        # Validar rol (solo admin y vendedor permitidos)
        if data['rol'] not in ['admin', 'vendedor']:
            return jsonify({
                'success': False,
                'error': 'Rol inválido. Debe ser: admin o vendedor'
            }), 400

        # Validar horarios si se proporcionan
        if 'hora_entrada' in data and data['hora_entrada']:
            if not validar_formato_hora(data['hora_entrada']):
                return jsonify({
                    'success': False,
                    'error': 'Formato de hora de entrada inválido. Use HH:MM'
                }), 400

        if 'hora_salida' in data and data['hora_salida']:
            if not validar_formato_hora(data['hora_salida']):
                return jsonify({
                    'success': False,
                    'error': 'Formato de hora de salida inválido. Use HH:MM'
                }), 400

        # Crear nuevo usuario
        nuevo_usuario = User(
            username=data['username'],
            email=data['email'],
            nombre_completo=data['nombre_completo'],
            telefono=data.get('telefono'),
            rol=data['rol'],
            hora_entrada=data.get('hora_entrada'),
            hora_salida=data.get('hora_salida'),
            dias_trabajo=data.get('dias_trabajo'),
            activo=True
        )

        # Establecer contraseña
        nuevo_usuario.set_password(data['password'])

        # Guardar en base de datos
        db.session.add(nuevo_usuario)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Usuario creado exitosamente',
            'usuario': nuevo_usuario.to_dict()
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al crear usuario: {str(e)}'
        }), 500


# ===========================
# ACTUALIZAR USUARIO
# ===========================

@usuarios_bp.route('/<int:user_id>', methods=['PUT'])
@login_required
@role_required('admin')
def actualizar_usuario(user_id):
    """
    PUT /api/usuarios/<id>

    Actualiza un usuario existente (solo admin)

    Body:
    {
        "username": "vendedor1_nuevo",
        "email": "nuevo@katita.com",
        "nombre_completo": "Juan Carlos Pérez",
        "telefono": "987654321",
        "hora_entrada": "08:00",
        "hora_salida": "16:00",
        "dias_trabajo": "Lun-Sab",
        "activo": true
    }
    """
    try:
        usuario = User.query.get(user_id)

        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404

        data = request.get_json()

        # Validar que no se cambie username a uno existente
        if 'username' in data and data['username'] != usuario.username:
            existing = User.buscar_por_username(data['username'])
            if existing and existing.id != user_id:
                return jsonify({
                    'success': False,
                    'error': 'El nombre de usuario ya está en uso'
                }), 400
            usuario.username = data['username']

        # Validar que no se cambie email a uno existente
        if 'email' in data and data['email'] != usuario.email:
            existing = User.buscar_por_email(data['email'])
            if existing and existing.id != user_id:
                return jsonify({
                    'success': False,
                    'error': 'El email ya está registrado'
                }), 400
            usuario.email = data['email']

        # Actualizar campos permitidos
        if 'nombre_completo' in data:
            usuario.nombre_completo = data['nombre_completo']

        if 'telefono' in data:
            usuario.telefono = data['telefono']

        if 'hora_entrada' in data:
            if data['hora_entrada'] and not validar_formato_hora(data['hora_entrada']):
                return jsonify({
                    'success': False,
                    'error': 'Formato de hora de entrada inválido'
                }), 400
            usuario.hora_entrada = data['hora_entrada']

        if 'hora_salida' in data:
            if data['hora_salida'] and not validar_formato_hora(data['hora_salida']):
                return jsonify({
                    'success': False,
                    'error': 'Formato de hora de salida inválido'
                }), 400
            usuario.hora_salida = data['hora_salida']

        if 'dias_trabajo' in data:
            usuario.dias_trabajo = data['dias_trabajo']

        if 'activo' in data:
            usuario.activo = data['activo']

        # NO permitir cambiar el rol por seguridad
        # Si necesitas cambiar rol, crear endpoint separado

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Usuario actualizado exitosamente',
            'usuario': usuario.to_dict()
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al actualizar usuario: {str(e)}'
        }), 500


# ===========================
# CAMBIAR CONTRASEÑA
# ===========================

@usuarios_bp.route('/<int:user_id>/password', methods=['PUT'])
@login_required
@role_required('admin')
def cambiar_password(user_id):
    """
    PUT /api/usuarios/<id>/password

    Cambia la contraseña de un usuario (solo admin)

    Body:
    {
        "new_password": "nuevaPassword123"
    }
    """
    try:
        usuario = User.query.get(user_id)

        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404

        data = request.get_json()

        if 'new_password' not in data or not data['new_password']:
            return jsonify({
                'success': False,
                'error': 'La nueva contraseña es requerida'
            }), 400

        # Cambiar contraseña
        usuario.set_password(data['new_password'])
        usuario.resetear_intentos()
        usuario.desbloquear()

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Contraseña actualizada exitosamente'
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al cambiar contraseña: {str(e)}'
        }), 500


# ===========================
# ACTIVAR/DESACTIVAR USUARIO
# ===========================

@usuarios_bp.route('/<int:user_id>/toggle', methods=['PUT'])
@login_required
@role_required('admin')
def toggle_usuario(user_id):
    """
    PUT /api/usuarios/<id>/toggle

    Activa o desactiva un usuario (solo admin)
    """
    try:
        usuario = User.query.get(user_id)

        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404

        # No permitir desactivarse a sí mismo
        if usuario.id == g.current_user['user_id']:
            return jsonify({
                'success': False,
                'error': 'No puedes desactivar tu propia cuenta'
            }), 400

        # Toggle estado
        usuario.activo = not usuario.activo

        db.session.commit()

        estado = 'activado' if usuario.activo else 'desactivado'

        return jsonify({
            'success': True,
            'message': f'Usuario {estado} exitosamente',
            'usuario': usuario.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al cambiar estado: {str(e)}'
        }), 500


# ===========================
# ELIMINAR USUARIO
# ===========================

@usuarios_bp.route('/<int:user_id>', methods=['DELETE'])
@login_required
@role_required('admin')
def eliminar_usuario(user_id):
    """
    DELETE /api/usuarios/<id>

    Elimina un usuario (solo admin)

    IMPORTANTE: Solo desactiva el usuario, no lo elimina físicamente
    para mantener integridad referencial con ventas
    """
    try:
        usuario = User.query.get(user_id)

        if not usuario:
            return jsonify({
                'success': False,
                'error': 'Usuario no encontrado'
            }), 404

        # No permitir eliminarse a sí mismo
        if usuario.id == g.current_user['user_id']:
            return jsonify({
                'success': False,
                'error': 'No puedes eliminar tu propia cuenta'
            }), 400

        # Soft delete: solo desactivar
        usuario.activo = False
        usuario.username = f"{usuario.username}_deleted_{usuario.id}"

        # Solo modificar email si existe - insertar sufijo ANTES del @
        if usuario.email and '@' in usuario.email:
            local, domain = usuario.email.rsplit('@', 1)
            usuario.email = f"{local}_deleted_{usuario.id}@{domain}"
        elif usuario.email:
            # Si no tiene @, agregar al final (caso raro pero cubrimos)
            usuario.email = f"{usuario.email}_deleted_{usuario.id}"

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Usuario eliminado exitosamente'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al eliminar usuario: {str(e)}'
        }), 500


# ===========================
# FUNCIONES AUXILIARES
# ===========================

def validar_formato_hora(hora_str):
    """
    Valida que la hora tenga formato HH:MM

    Args:
        hora_str: String con la hora (ej: "08:00")

    Returns:
        bool: True si es válido, False si no
    """
    if not hora_str:
        return True  # Permitir vacío

    # Regex para HH:MM
    patron = r'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
    return bool(re.match(patron, hora_str))
