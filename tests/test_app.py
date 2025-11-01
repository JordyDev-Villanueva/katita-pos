"""
KATITA-POS - Application Tests
==============================
Tests básicos para verificar la configuración de la aplicación
"""

import pytest
from app import create_app


def test_app_creation():
    """Test que la aplicación se crea correctamente"""
    app = create_app('testing')
    assert app is not None
    assert app.testing is True


def test_config_testing():
    """Test que la configuración de testing se carga correctamente"""
    app = create_app('testing')
    assert app.config['TESTING'] is True
    assert 'sqlite:///:memory:' in app.config['SQLALCHEMY_DATABASE_URI']


def test_health_endpoint(client):
    """Test del endpoint de health check"""
    response = client.get('/health')
    assert response.status_code == 200

    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['service'] == 'KATITA-POS API'
    assert 'database_mode' in data
    assert 'version' in data


def test_404_error(client):
    """Test que el manejo de errores 404 funciona"""
    response = client.get('/ruta-que-no-existe')
    assert response.status_code == 404

    data = response.get_json()
    assert 'error' in data
    assert data['error'] == 'Not Found'
