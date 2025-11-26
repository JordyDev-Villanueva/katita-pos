#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Migración: Crear tabla cuadros_caja para gestión de turnos de caja

Este script crea la tabla 'cuadros_caja' en la base de datos de producción.
Permite gestionar turnos de caja con:
- Apertura de turno con monto inicial
- Seguimiento de ventas por método de pago
- Registro de egresos (gastos)
- Cierre con arqueo de caja

Ejecutar: python add_cuadro_caja_table.py
"""

import os
import sys
from datetime import datetime, timezone, timedelta

# Zona horaria de Perú
PERU_TZ = timezone(timedelta(hours=-5))

def main():
    print("=" * 70)
    print("MIGRACIÓN: Crear tabla cuadros_caja")
    print("=" * 70)

    # Configurar para usar base de datos de producción
    os.environ['DATABASE_MODE'] = 'postgres'

    from app import create_app, db
    from app.models import CuadroCaja

    app = create_app()

    with app.app_context():
        print(f"\n📊 Base de datos: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
        print(f"🗄️  Modo: {app.config['DATABASE_MODE']}")

        # Verificar si la tabla ya existe
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if 'cuadros_caja' in existing_tables:
            print("\n⚠️  ADVERTENCIA: La tabla 'cuadros_caja' ya existe")
            respuesta = input("¿Desea recrearla? Esto ELIMINARÁ todos los datos existentes (s/n): ")

            if respuesta.lower() != 's':
                print("\n❌ Migración cancelada")
                return

            print("\n🗑️  Eliminando tabla existente...")
            db.session.execute(db.text("DROP TABLE IF EXISTS cuadros_caja CASCADE"))
            db.session.commit()

        # Crear tabla
        print("\n✨ Creando tabla 'cuadros_caja'...")
        db.create_all()

        # Verificar creación
        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if 'cuadros_caja' in existing_tables:
            print("✅ Tabla 'cuadros_caja' creada exitosamente")

            # Mostrar columnas
            columns = inspector.get_columns('cuadros_caja')
            print("\n📋 Columnas creadas:")
            for col in columns:
                print(f"   - {col['name']}: {col['type']}")
        else:
            print("❌ ERROR: La tabla no se creó correctamente")
            return

        print("\n" + "=" * 70)
        print("✅ MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 70)
        print("\n📌 Funcionalidades habilitadas:")
        print("   • Apertura de turnos de caja con monto inicial")
        print("   • Registro automático de ventas por método de pago")
        print("   • Registro de egresos (gastos del turno)")
        print("   • Cierre de turno con arqueo de caja")
        print("   • Cálculo automático de diferencias")
        print("\n👥 Acceso:")
        print("   • Admin: Puede ver todos los turnos")
        print("   • Vendedores: Solo ven sus propios turnos")
        print("\n🌐 Nueva ruta disponible: /cuadro-caja")
        print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Migración cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR durante la migración:")
        print(f"   {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
