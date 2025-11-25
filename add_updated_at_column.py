"""
Script para agregar la columna updated_at a movimientos_stock en Supabase
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# URL de Supabase (forzar la correcta)
SUPABASE_URL = 'postgresql://postgres.sovoxkfvvwicqqfpaove:Scarlett122024GJ@aws-1-sa-east-1.pooler.supabase.com:6543/postgres'

print("[*] Conectando a Supabase...")
engine = create_engine(SUPABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as connection:
        print("[*] Verificando columna updated_at en movimientos_stock...")

        # Verificar si la columna ya existe
        result = connection.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'movimientos_stock'
            AND column_name = 'updated_at';
        """))

        columna_existe = result.fetchone() is not None

        if columna_existe:
            print("[!] La columna 'updated_at' ya existe en movimientos_stock")
        else:
            print("[+] Agregando columna 'updated_at' a movimientos_stock...")

            # Agregar la columna con valor por defecto
            connection.execute(text("""
                ALTER TABLE movimientos_stock
                ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
            """))

            connection.commit()
            print("[OK] Columna 'updated_at' agregada exitosamente!")

        # Verificar el esquema actualizado
        print("\n[*] Verificando esquema de movimientos_stock...")
        result = connection.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'movimientos_stock'
            ORDER BY ordinal_position;
        """))

        print("\nColumnas en movimientos_stock:")
        for row in result:
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            print(f"  - {row[0]}: {row[1]} {nullable}")

except Exception as e:
    print(f"\n[ERROR] {type(e).__name__}: {e}")
    exit(1)

print("\n[OK] Migración completada!")
