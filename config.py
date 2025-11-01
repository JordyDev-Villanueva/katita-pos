"""
KATITA-POS - Configuration Module
==================================
Gestiona las configuraciones del entorno (desarrollo, producción, testing)
Soporta base de datos híbrida: SQLite local y PostgreSQL en la nube
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


class Config:
    """Configuración base compartida por todos los entornos"""

    # Flask Core
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # Database Mode: 'local' (SQLite) o 'cloud' (PostgreSQL)
    DATABASE_MODE = os.environ.get('DATABASE_MODE', 'local')

    # SQLite Configuration (Offline-first)
    SQLITE_DATABASE_URI = os.environ.get('SQLITE_DATABASE_URI') or \
        f'sqlite:///{os.path.join(basedir, "instance", "katita_local.db")}'

    # PostgreSQL Configuration (Cloud - Supabase)
    POSTGRES_DATABASE_URI = os.environ.get('POSTGRES_DATABASE_URI') or \
        'postgresql://user:password@localhost/katita_pos'

    # Selección dinámica de base de datos
    SQLALCHEMY_DATABASE_URI = SQLITE_DATABASE_URI if DATABASE_MODE == 'local' else POSTGRES_DATABASE_URI
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(seconds=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 2592000)))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'

    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')

    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FILE = os.path.join(basedir, os.environ.get('LOG_FILE', 'logs/katita-pos.log'))

    # Sync Configuration
    SYNC_ENABLED = os.environ.get('SYNC_ENABLED', 'True').lower() == 'true'
    SYNC_INTERVAL = int(os.environ.get('SYNC_INTERVAL', 300))

    # Application Settings
    TIMEZONE = os.environ.get('TIMEZONE', 'America/Lima')
    PAGINATION_PER_PAGE = int(os.environ.get('PAGINATION_PER_PAGE', 20))


class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True  # Mostrar SQL queries en consola


class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False
    TESTING = False
    DATABASE_MODE = 'cloud'  # En producción siempre usar PostgreSQL
    SQLALCHEMY_DATABASE_URI = Config.POSTGRES_DATABASE_URI


class TestingConfig(Config):
    """Configuración para testing"""
    TESTING = True
    DEBUG = True
    # Usar base de datos en memoria para tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)


# Diccionario para seleccionar configuración según el entorno
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Obtiene la configuración según FLASK_ENV"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
