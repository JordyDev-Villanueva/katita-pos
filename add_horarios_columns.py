"""
Script para agregar columnas de horarios a la tabla users en Supabase
"""
from config import get_config
from sqlalchemy import create_engine, text, inspect
import os

def add_horarios_columns():
    """Agrega columnas de horarios a la tabla users"""
    config = get_config()

    # Crear engine de SQLAlchemy
    engine = create_engine(config.SQLALCHEMY_DATABASE_URI)

    # Inspeccionar tabla
    inspector = inspect(engine)
    existing_columns = [col['name'] for col in inspector.get_columns('users')]

    with engine.connect() as conn:
        # Agregar columnas si no existen
        try:
            if 'hora_entrada' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN hora_entrada VARCHAR(5);
                """))
                conn.commit()
                print("Columna hora_entrada agregada")
            else:
                print("Columna hora_entrada ya existe")

            if 'hora_salida' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN hora_salida VARCHAR(5);
                """))
                conn.commit()
                print("Columna hora_salida agregada")
            else:
                print("Columna hora_salida ya existe")

            if 'dias_trabajo' not in existing_columns:
                conn.execute(text("""
                    ALTER TABLE users
                    ADD COLUMN dias_trabajo VARCHAR(50);
                """))
                conn.commit()
                print("Columna dias_trabajo agregada")
            else:
                print("Columna dias_trabajo ya existe")

            print("\nTodas las columnas de horarios estan listas!")

        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()

if __name__ == "__main__":
    add_horarios_columns()
