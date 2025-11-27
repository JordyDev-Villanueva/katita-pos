#!/usr/bin/env python3
"""
Script de migración para actualizar constraint de estado en producción
Se ejecuta directamente en Railway con: python migrate_constraint.py
"""
import os
import sys

# Configurar variable de entorno para producción
os.environ['DATABASE_MODE'] = 'production'

from app import create_app, db
from sqlalchemy import text

def main():
    """Ejecuta la migración de constraint de estado"""
    app = create_app()

    with app.app_context():
        try:
            print("=" * 60)
            print("MIGRACION: Actualizar constraint de estado en cuadros_caja")
            print("=" * 60)
            print()

            # Verificar conexión a base de datos
            db_uri = app.config['SQLALCHEMY_DATABASE_URI']
            if 'sqlite' in db_uri:
                print("ERROR: Este script es solo para PostgreSQL (producción)")
                print("SQLite actualiza el constraint automáticamente")
                sys.exit(1)

            print(f"Base de datos: PostgreSQL (producción)")
            print()

            # 1. Eliminar constraint antiguo
            print("Paso 1: Eliminando constraint antiguo...")
            try:
                db.session.execute(text("""
                    ALTER TABLE cuadros_caja
                    DROP CONSTRAINT IF EXISTS check_estado_valido
                """))
                db.session.commit()
                print("✓ Constraint antiguo eliminado")
            except Exception as e:
                print(f"⚠ Advertencia al eliminar constraint: {e}")
                db.session.rollback()

            print()

            # 2. Crear nuevo constraint
            print("Paso 2: Creando nuevo constraint con 'pendiente_cierre'...")
            try:
                db.session.execute(text("""
                    ALTER TABLE cuadros_caja
                    ADD CONSTRAINT check_estado_valido
                    CHECK (estado IN ('abierto', 'cerrado', 'pendiente_cierre'))
                """))
                db.session.commit()
                print("✓ Nuevo constraint creado exitosamente")
            except Exception as e:
                print(f"✗ Error al crear constraint: {e}")
                db.session.rollback()
                sys.exit(1)

            print()
            print("=" * 60)
            print("MIGRACION COMPLETADA EXITOSAMENTE")
            print("=" * 60)
            print()
            print("Estados válidos ahora:")
            print("  - abierto")
            print("  - cerrado")
            print("  - pendiente_cierre")
            print()

        except Exception as e:
            print()
            print("=" * 60)
            print("ERROR DURANTE LA MIGRACION")
            print("=" * 60)
            print(f"Error: {str(e)}")
            print()
            db.session.rollback()
            sys.exit(1)

if __name__ == '__main__':
    main()
