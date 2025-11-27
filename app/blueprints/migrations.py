"""
Blueprint para ejecutar migraciones de base de datos
Solo accesible para administradores
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from sqlalchemy import text

migrations_bp = Blueprint('migrations', __name__, url_prefix='/api/migrations')

@migrations_bp.route('/update-estado-constraint', methods=['POST'])
@jwt_required()
def update_estado_constraint():
    """
    Actualiza el constraint de estado en cuadros_caja para incluir 'pendiente_cierre'
    Solo accesible para administradores
    """
    try:
        # Verificar que el usuario es admin
        current_user_id = get_jwt_identity()
        usuario = User.query.get(current_user_id)

        if not usuario or usuario.rol != 'admin':
            return jsonify({'error': 'No autorizado. Solo administradores pueden ejecutar migraciones.'}), 403

        # 1. Eliminar el constraint antiguo
        db.session.execute(text("""
            ALTER TABLE cuadros_caja
            DROP CONSTRAINT IF EXISTS check_estado_valido
        """))
        db.session.commit()

        # 2. Crear el nuevo constraint con pendiente_cierre
        db.session.execute(text("""
            ALTER TABLE cuadros_caja
            ADD CONSTRAINT check_estado_valido
            CHECK (estado IN ('abierto', 'cerrado', 'pendiente_cierre'))
        """))
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Constraint actualizado exitosamente',
            'estados_validos': ['abierto', 'cerrado', 'pendiente_cierre']
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Error al actualizar constraint: {str(e)}'
        }), 500
