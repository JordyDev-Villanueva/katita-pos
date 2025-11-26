"""
Script para migrar columnas de horarios en PRODUCCIÓN (Supabase)

INSTRUCCIONES:
1. Este script se debe ejecutar EN RAILWAY (no localmente)
2. Railway automáticamente usa las variables de entorno de producción
3. Ejecutar SOLO UNA VEZ

Para ejecutar en Railway:
railway run python migrate_usuarios_production.py
"""

import os
from sqlalchemy import create_engine, text, inspect
import sys

def migrate_usuarios_horarios():
    """Agrega columnas de horarios a la tabla users en producción"""

    # Obtener DATABASE_URI desde variables de entorno (Railway lo provee)
    database_uri = os.getenv('POSTGRES_DATABASE_URI')

    if not database_uri:
        print("❌ ERROR: No se encontró POSTGRES_DATABASE_URI")
        print("Este script debe ejecutarse en Railway con: railway run python migrate_usuarios_production.py")
        sys.exit(1)

    # Verificar que sea base de datos de producción (PostgreSQL)
    if 'postgresql' not in database_uri.lower() and 'postgres' not in database_uri.lower():
        print("❌ ERROR: Esta no es una base de datos PostgreSQL")
        print(f"DATABASE_URI encontrado: {database_uri[:30]}...")
        sys.exit(1)

    print("✅ Conectando a base de datos de producción...")
    print(f"🔗 Host: {database_uri.split('@')[1].split(':')[0] if '@' in database_uri else 'unknown'}")

    try:
        engine = create_engine(database_uri)
        inspector = inspect(engine)

        # Verificar que existe la tabla users
        if 'users' not in inspector.get_table_names():
            print("❌ ERROR: La tabla 'users' no existe")
            sys.exit(1)

        print("✅ Tabla 'users' encontrada")

        # Obtener columnas existentes
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        print(f"📋 Columnas existentes: {len(existing_columns)}")

        columns_to_add = [
            ('hora_entrada', 'VARCHAR(5)'),
            ('hora_salida', 'VARCHAR(5)'),
            ('dias_trabajo', 'VARCHAR(50)')
        ]

        added_count = 0

        with engine.connect() as conn:
            for col_name, col_type in columns_to_add:
                if col_name not in existing_columns:
                    print(f"➕ Agregando columna: {col_name} {col_type}")
                    sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_type};"
                    conn.execute(text(sql))
                    conn.commit()
                    added_count += 1
                    print(f"   ✅ Columna '{col_name}' agregada exitosamente")
                else:
                    print(f"   ⏭️  Columna '{col_name}' ya existe, omitiendo")

        print("\n" + "="*60)
        if added_count > 0:
            print(f"✅ MIGRACIÓN EXITOSA: {added_count} columnas agregadas")
        else:
            print("✅ MIGRACIÓN COMPLETA: Todas las columnas ya existían")
        print("="*60)

        # Verificar columnas finales
        inspector = inspect(engine)
        final_columns = [col['name'] for col in inspector.get_columns('users')]

        print(f"\n📊 Total de columnas en 'users': {len(final_columns)}")

        # Verificar que las 3 columnas estén presentes
        missing = [col for col, _ in columns_to_add if col not in final_columns]
        if missing:
            print(f"⚠️  ADVERTENCIA: Faltan columnas: {missing}")
        else:
            print("✅ Todas las columnas de horarios están presentes")

        print("\n🎉 Migración completada. Ahora el endpoint /api/usuarios/ debería funcionar.")

    except Exception as e:
        print(f"\n❌ ERROR durante la migración:")
        print(f"   {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    print("="*60)
    print("🔧 MIGRACIÓN DE USUARIOS - PRODUCCIÓN")
    print("="*60)
    print()

    migrate_usuarios_horarios()
