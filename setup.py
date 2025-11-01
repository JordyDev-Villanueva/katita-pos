"""
KATITA-POS - Setup Script
=========================
Script de ayuda para la configuración inicial del proyecto
"""

import os
import secrets
from pathlib import Path


def generate_secret_key():
    """Genera una clave secreta segura"""
    return secrets.token_urlsafe(32)


def create_env_file():
    """Crea el archivo .env desde .env.example con claves generadas"""
    env_example = Path('.env.example')
    env_file = Path('.env')

    if env_file.exists():
        print('⚠️  El archivo .env ya existe.')
        response = input('¿Deseas sobrescribirlo? (s/n): ')
        if response.lower() != 's':
            print('❌ Operación cancelada.')
            return

    if not env_example.exists():
        print('❌ No se encontró el archivo .env.example')
        return

    # Leer .env.example
    with open(env_example, 'r', encoding='utf-8') as f:
        content = f.read()

    # Reemplazar valores predeterminados con valores generados
    secret_key = generate_secret_key()
    jwt_secret = generate_secret_key()

    content = content.replace('your-secret-key-change-in-production', secret_key)
    content = content.replace('your-jwt-secret-key-change-in-production', jwt_secret)

    # Escribir .env
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print('✅ Archivo .env creado exitosamente')
    print('🔑 Claves secretas generadas automáticamente')
    print('\n⚠️  IMPORTANTE: Configura las variables de PostgreSQL si usarás modo cloud')


def create_directories():
    """Crea los directorios necesarios que no están en git"""
    directories = ['instance', 'logs']

    for directory in directories:
        path = Path(directory)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            print(f'✅ Directorio creado: {directory}/')


def main():
    """Función principal del setup"""
    print("""
    ╔═══════════════════════════════════════╗
    ║    KATITA-POS - Setup Inicial         ║
    ╚═══════════════════════════════════════╝
    """)

    print('📁 Creando directorios necesarios...')
    create_directories()

    print('\n🔐 Configurando variables de entorno...')
    create_env_file()

    print("""
    \n✅ Setup completado!

    📋 Próximos pasos:

    1. Activar el entorno virtual:
       Windows: venv\\Scripts\\activate
       Linux/MacOS: source venv/bin/activate

    2. Instalar dependencias:
       pip install -r requirements.txt

    3. Editar .env si es necesario (configuración de PostgreSQL)

    4. Ejecutar la aplicación:
       python run.py

    5. Verificar que funciona:
       http://localhost:5000/health

    ¡Listo para desarrollar! 🚀
    """)


if __name__ == '__main__':
    main()
