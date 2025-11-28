"""
Migración: Agregar cuadro_caja_id a ventas

Agrega la columna cuadro_caja_id a la tabla ventas para vincular
cada venta con el turno de caja en el que se realizó.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from sqlalchemy import text

def migrate():
    """Ejecuta la migración"""
    app = create_app()

    with app.app_context():
        try:
            # Verificar si la columna ya existe
            result = db.session.execute(text("""
                SELECT COUNT(*) as count
                FROM pragma_table_info('ventas')
                WHERE name = 'cuadro_caja_id'
            """))

            exists = result.fetchone()[0] > 0

            if exists:
                print("✓ La columna cuadro_caja_id ya existe en ventas")
                return

            # Agregar la columna
            db.session.execute(text("""
                ALTER TABLE ventas
                ADD COLUMN cuadro_caja_id INTEGER
                REFERENCES cuadros_caja(id)
            """))

            # Crear índice
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_ventas_cuadro_caja_id
                ON ventas(cuadro_caja_id)
            """))

            db.session.commit()
            print("✓ Columna cuadro_caja_id agregada exitosamente a ventas")
            print("✓ Índice creado exitosamente")

        except Exception as e:
            db.session.rollback()
            print(f"✗ Error en migración: {e}")
            raise

if __name__ == '__main__':
    migrate()
