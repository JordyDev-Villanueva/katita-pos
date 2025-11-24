"""
Script para inicializar la base de datos de KATITA-POS
Crea las tablas y el usuario admin inicial
"""

import os
from app import create_app, db
from app.models.user import User

def init_database():
    """Inicializa la base de datos y crea usuario admin"""
    # FORZAR USO DE SUPABASE
    os.environ['DATABASE_MODE'] = 'cloud'
    os.environ['POSTGRES_DATABASE_URI'] = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'

    app = create_app()

    print(f"[INFO] Usando base de datos: {app.config.get('SQLALCHEMY_DATABASE_URI')[:50]}...")

    with app.app_context():
        print("[*] Creando tablas en la base de datos...")
        db.create_all()
        print("[OK] Tablas creadas exitosamente")

        # Verificar si ya existe el admin
        admin_exists = User.query.filter_by(username='admin').first()

        if admin_exists:
            print("[!] Usuario 'admin' ya existe")
            print(f"    Email: {admin_exists.email}")
            print(f"    Rol: {admin_exists.rol}")
        else:
            print("\n[+] Creando usuario admin...")
            admin = User(
                username='admin',
                email='admin@katita.com',
                nombre_completo='Administrador',
                rol='admin',
                activo=True
            )
            admin.set_password('admin123')  # CAMBIAR despues del primer login

            db.session.add(admin)
            db.session.commit()

            print("[OK] Usuario admin creado exitosamente")
            print("\n[INFO] Credenciales de acceso:")
            print("       Usuario: admin")
            print("       Password: admin123")
            print("\n[!] IMPORTANTE: Cambia la contrasena despues del primer login")

if __name__ == '__main__':
    init_database()
