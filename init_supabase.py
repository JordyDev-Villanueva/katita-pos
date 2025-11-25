"""
Script para inicializar Supabase directamente
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app import db
import bcrypt

# URL de Supabase
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

print("[*] Creando tablas en Supabase...")

# Crear tablas manualmente
try:
    # Importar todos los modelos
    from app.models.product import Product
    from app.models.lote import Lote
    from app.models.venta import Venta
    from app.models.detalle_venta import DetalleVenta
    from app.models.movimiento_stock import MovimientoStock
    from app.models.sync_queue import SyncQueue

    # Crear todas las tablas
    db.metadata.create_all(engine)
    print("[OK] Tablas creadas exitosamente")

    # Crear usuario admin
    print("\n[+] Creando usuario admin...")

    # Hashear password
    password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Insertar usuario
    query = text("""
        INSERT INTO users (username, email, password_hash, nombre_completo, rol, activo, intentos_login_fallidos, created_at, updated_at)
        VALUES (:username, :email, :password, :nombre, :rol, :activo, :intentos, NOW(), NOW())
        ON CONFLICT (username) DO NOTHING
    """)

    result = session.execute(query, {
        'username': 'admin',
        'email': 'admin@katita.com',
        'password': password_hash,
        'nombre': 'Administrador',
        'rol': 'admin',
        'activo': True,
        'intentos': 0
    })

    session.commit()

    if result.rowcount > 0:
        print("[OK] Usuario admin creado exitosamente")
        print("\n[INFO] Credenciales de acceso:")
        print("       Usuario: admin")
        print("       Password: admin123")
        print("\n[!] IMPORTANTE: Cambia la contrasena despues del primer login")
    else:
        print("[!] Usuario 'admin' ya existe")

except Exception as e:
    print(f"[ERROR] {e}")
    session.rollback()
finally:
    session.close()
