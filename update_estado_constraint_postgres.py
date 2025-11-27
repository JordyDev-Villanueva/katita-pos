"""
Script de migracion para actualizar el constraint de estado en cuadros_caja (PostgreSQL)
Añade 'pendiente_cierre' como estado valido

EJECUTAR EN PRODUCCION con:
python update_estado_constraint_postgres.py
"""
from app import create_app, db
from sqlalchemy import text

def update_estado_constraint_postgres():
    app = create_app()

    with app.app_context():
        try:
            print("Iniciando actualizacion de constraint de estado en PostgreSQL...")

            # 1. Eliminar el constraint antiguo
            print("1. Eliminando constraint antiguo...")
            db.session.execute(text("""
                ALTER TABLE cuadros_caja
                DROP CONSTRAINT IF EXISTS check_estado_valido
            """))
            db.session.commit()
            print("   Constraint antiguo eliminado")

            # 2. Crear el nuevo constraint con pendiente_cierre
            print("2. Creando nuevo constraint con pendiente_cierre...")
            db.session.execute(text("""
                ALTER TABLE cuadros_caja
                ADD CONSTRAINT check_estado_valido
                CHECK (estado IN ('abierto', 'cerrado', 'pendiente_cierre'))
            """))
            db.session.commit()
            print("   Nuevo constraint creado")

            print("\nMigracion completada exitosamente")
            print("Estados validos: abierto, cerrado, pendiente_cierre")

        except Exception as e:
            print(f"\nError durante la migracion: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    update_estado_constraint_postgres()
