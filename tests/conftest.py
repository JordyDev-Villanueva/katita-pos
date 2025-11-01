"""
KATITA-POS - Pytest Configuration
=================================
Configuración global de pytest y fixtures compartidos
"""

import pytest
from app import create_app, db


@pytest.fixture
def app():
    """
    Fixture que crea una instancia de la aplicación en modo testing
    """
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """
    Fixture que proporciona un cliente de prueba para hacer requests
    """
    return app.test_client()


@pytest.fixture
def runner(app):
    """
    Fixture que proporciona un runner CLI para tests
    """
    return app.test_cli_runner()
