"""
KATITA-POS - Application Factory
=================================
Implementa el patrón Application Factory para Flask
Inicializa extensiones y registra blueprints de forma modular
"""

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import get_config
from datetime import timedelta
import logging
from logging.handlers import RotatingFileHandler
import os

# Inicializar extensiones (sin vincular a la app aún)
db = SQLAlchemy()
jwt = JWTManager()


def create_app(config_name=None):
    """
    Application Factory Pattern

    Crea y configura la aplicación Flask de forma modular.
    Permite crear múltiples instancias de la app con diferentes configuraciones.

    Args:
        config_name (str): Nombre del entorno ('development', 'production', 'testing')

    Returns:
        Flask: Instancia configurada de la aplicación
    """
    app = Flask(__name__, instance_relative_config=True)

    # Cargar configuración
    if config_name:
        app.config.from_object(f'config.{config_name.capitalize()}Config')
    else:
        app.config.from_object(get_config())

    # Asegurar que existe el directorio instance para SQLite
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass

    # Inicializar extensiones con la app
    db.init_app(app)
    jwt.init_app(app)

    # Configurar callbacks de JWT
    configure_jwt_callbacks(app)

    # Configurar CORS de forma robusta para permitir peticiones del frontend
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        supports_credentials=False
    )

    # Configurar logging
    configure_logging(app)

    # Registrar blueprints (aquí irán los módulos de la aplicación)
    register_blueprints(app)

    # Registrar handlers de errores
    register_error_handlers(app)

    # Crear tablas de base de datos (solo en desarrollo, NO en testing)
    with app.app_context():
        if app.config['DEBUG'] and not app.config['TESTING']:
            db.create_all()
            app.logger.info(f"Database initialized: {app.config['SQLALCHEMY_DATABASE_URI']}")

        # AUTO-MIGRACIÓN: Actualizar constraint de estado si es necesario
        # Ejecutar en producción (cloud) y también en modo production
        if app.config['DATABASE_MODE'] in ['production', 'cloud']:
            try:
                from sqlalchemy import text
                app.logger.info("Verificando constraint de estado...")

                # Intentar actualizar constraint (idempotente - no falla si ya existe)
                try:
                    db.session.execute(text("""
                        ALTER TABLE cuadros_caja
                        DROP CONSTRAINT IF EXISTS check_estado_valido
                    """))
                    db.session.commit()
                    app.logger.info("Constraint antiguo eliminado")
                except Exception as e:
                    app.logger.warning(f"No se pudo eliminar constraint: {e}")
                    db.session.rollback()

                try:
                    db.session.execute(text("""
                        ALTER TABLE cuadros_caja
                        ADD CONSTRAINT check_estado_valido
                        CHECK (estado IN ('abierto', 'cerrado', 'pendiente_cierre'))
                    """))
                    db.session.commit()
                    app.logger.info("✓ Constraint actualizado: estados = ['abierto', 'cerrado', 'pendiente_cierre']")
                except Exception as e:
                    if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
                        app.logger.info("✓ Constraint ya existe con configuración correcta")
                    else:
                        app.logger.warning(f"Advertencia al crear constraint: {e}")
                    db.session.rollback()

            except Exception as e:
                app.logger.error(f"Error en auto-migración: {e}")
                db.session.rollback()

    # Ruta de health check
    @app.route('/health')
    def health_check():
        """Endpoint para verificar que el servidor está funcionando"""
        return jsonify({
            'status': 'healthy',
            'service': 'KATITA-POS API',
            'database_mode': app.config['DATABASE_MODE'],
            'version': '1.0.7',
            'optimized_dashboard': True,
            'auto_migration': 'enabled'
        }), 200

    app.logger.info(f"KATITA-POS started in {app.config['DATABASE_MODE']} mode")

    return app


def configure_jwt_callbacks(app):
    """
    Configura callbacks personalizados para JWT

    Args:
        app (Flask): Instancia de la aplicación
    """
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        """Callback cuando el token ha expirado"""
        return jsonify({
            'success': False,
            'message': 'El token ha expirado',
            'error': 'token_expired'
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        """Callback cuando el token es inválido"""
        return jsonify({
            'success': False,
            'message': 'Token inválido',
            'error': 'invalid_token'
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        """Callback cuando no se proporciona token"""
        return jsonify({
            'success': False,
            'message': 'Token de autenticación requerido',
            'error': 'authorization_required'
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        """Callback cuando el token ha sido revocado"""
        return jsonify({
            'success': False,
            'message': 'El token ha sido revocado',
            'error': 'token_revoked'
        }), 401


def configure_logging(app):
    """
    Configura el sistema de logging de la aplicación

    Args:
        app (Flask): Instancia de la aplicación
    """
    if not app.debug and not app.testing:
        # Crear directorio de logs si no existe
        log_dir = os.path.dirname(app.config['LOG_FILE'])
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        # Configurar handler de archivo con rotación
        file_handler = RotatingFileHandler(
            app.config['LOG_FILE'],
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(getattr(logging, app.config['LOG_LEVEL']))
        app.logger.addHandler(file_handler)

    app.logger.setLevel(getattr(logging, app.config.get('LOG_LEVEL', 'INFO')))


def register_blueprints(app):
    """
    Registra todos los blueprints de la aplicación

    Args:
        app (Flask): Instancia de la aplicación
    """
    # Registrar blueprint de autenticacion (primero, sin proteccion)
    from app.blueprints.auth import auth_bp
    app.register_blueprint(auth_bp)

    # Registrar blueprint de productos
    from app.blueprints.products import products_bp
    app.register_blueprint(products_bp)

    # Registrar blueprint de lotes
    from app.blueprints.lotes import lotes_bp
    app.register_blueprint(lotes_bp)

    # Registrar blueprint de ventas
    from app.blueprints.ventas import ventas_bp
    app.register_blueprint(ventas_bp)

    # Registrar blueprint de dashboard (optimizado)
    from app.blueprints.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp)

    # Registrar blueprint de usuarios
    from app.blueprints.usuarios import usuarios_bp
    app.register_blueprint(usuarios_bp)

    # Registrar blueprint de cuadro de caja
    from app.blueprints.cuadro_caja import cuadro_caja_bp
    app.register_blueprint(cuadro_caja_bp)


def register_error_handlers(app):
    """
    Registra manejadores personalizados de errores HTTP

    Args:
        app (Flask): Instancia de la aplicación
    """

    @app.errorhandler(404)
    def not_found_error(error):
        """Maneja errores 404 - Recurso no encontrado"""
        return jsonify({
            'error': 'Not Found',
            'message': 'El recurso solicitado no existe'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        """Maneja errores 500 - Error interno del servidor"""
        db.session.rollback()
        app.logger.error(f'Server Error: {error}')
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'Ocurrió un error en el servidor'
        }), 500

    @app.errorhandler(403)
    def forbidden_error(error):
        """Maneja errores 403 - Acceso prohibido"""
        return jsonify({
            'error': 'Forbidden',
            'message': 'No tienes permisos para acceder a este recurso'
        }), 403

    @app.errorhandler(400)
    def bad_request_error(error):
        """Maneja errores 400 - Solicitud incorrecta"""
        return jsonify({
            'error': 'Bad Request',
            'message': 'La solicitud no es válida'
        }), 400
