#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Migración: Agregar campo observaciones_rechazo a cuadros_caja

Este script agrega:
- observaciones_rechazo: Razón si admin rechaza el cierre
- Actualiza el comentario del campo estado para incluir 'pendiente_cierre'

Ejecutar: python add_pendiente_cierre_column.py
"""

import os
import sys

def main():
    print("=" * 70)
    print("MIGRACIÓN: Agregar soporte para aprobación de cierres")
    print("=" * 70)

    # Configurar para usar base de datos de producción
    os.environ['DATABASE_MODE'] = 'postgres'

    from app import create_app, db

    app = create_app()

    with app.app_context():
        print(f"\nBase de datos: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
        print(f"Modo: {app.config['DATABASE_MODE']}")

        # Verificar si la columna ya existe
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('cuadros_caja')]

        if 'observaciones_rechazo' in columns:
            print("\nLa columna 'observaciones_rechazo' ya existe")
            print("No se requiere migracion")
            return

        print("\nAgregando columna 'observaciones_rechazo'...")

        # Agregar columna observaciones_rechazo
        db.session.execute(db.text("""
            ALTER TABLE cuadros_caja
            ADD COLUMN IF NOT EXISTS observaciones_rechazo TEXT NULL
        """))

        db.session.commit()

        # Verificar que se creó
        inspector = db.inspect(db.engine)
        columns_after = [col['name'] for col in inspector.get_columns('cuadros_caja')]

        if 'observaciones_rechazo' in columns_after:
            print("Columna 'observaciones_rechazo' agregada exitosamente")
        else:
            print("ERROR: La columna no se creo correctamente")
            return

        print("\n" + "=" * 70)
        print("MIGRACION COMPLETADA EXITOSAMENTE")
        print("=" * 70)
        print("\nNuevas funcionalidades habilitadas:")
        print("   - Vendedor solicita cierre de turno")
        print("   - Admin aprueba o rechaza cierre")
        print("   - Sistema guarda razon de rechazo")
        print("\nEstados de turno actualizados:")
        print("   - abierto: Turno activo")
        print("   - pendiente_cierre: Esperando aprobacion de admin")
        print("   - cerrado: Turno finalizado")
        print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nMigracion cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR durante la migracion:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
