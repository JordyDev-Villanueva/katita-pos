"""
KATITA-POS - Application Entry Point
====================================
Punto de entrada principal de la aplicación Flask
"""

from app import create_app
import os

# Crear la aplicación usando el Application Factory
app = create_app()

if __name__ == '__main__':
    # Obtener configuraciones del entorno
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    port = int(os.environ.get('FLASK_PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'

    print(f"""
    ==========================================
          KATITA-POS - Backend API
    ==========================================

    Server running on: http://{host}:{port}
    Database Mode: {app.config['DATABASE_MODE']}
    Environment: {os.environ.get('FLASK_ENV', 'development')}

    Press CTRL+C to quit
    """)

    app.run(host=host, port=port, debug=debug)
