"""
Script para crear el segundo vendedor (Turno Tarde)
Ejecutar: python crear_vendedor2.py
"""

import sys
import os

# Agregar directorio raíz al path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, db
from app.models.user import User

def crear_vendedor2():
    """Crea el usuario vendedor2 para turno tarde."""

    app = create_app()

    with app.app_context():
        print('\n' + '='*70)
        print('🏪 CREANDO VENDEDOR 2 (TURNO TARDE)')
        print('='*70)

        # Verificar si ya existe
        existing = User.query.filter_by(username='vendedor2').first()

        if existing:
            print('\n⚠️  El usuario "vendedor2" ya existe')
            print(f'   ID: {existing.id}')
            print(f'   Nombre: {existing.nombre_completo}')
            print(f'   Rol: {existing.rol}')
            print(f'   Activo: {existing.activo}')

            respuesta = input('\n¿Deseas reactivarlo/actualizarlo? (SI/NO): ')

            if respuesta.upper() == 'SI':
                existing.activo = True
                existing.nombre_completo = 'Carlos Mendoza'
                existing.email = 'vendedor2@katita.com'
                existing.set_password('vendedor456')

                db.session.commit()
                print('\n✅ Usuario "vendedor2" actualizado exitosamente')
            else:
                print('\n❌ Operación cancelada')

            return

        # Crear nuevo vendedor
        print('\n📝 Creando nuevo usuario...')

        nuevo_vendedor = User(
            username='vendedor2',
            email='vendedor2@katita.com',
            nombre_completo='Carlos Mendoza',
            telefono='987654321',
            rol='vendedor',
            activo=True
        )

        # Establecer contraseña
        nuevo_vendedor.set_password('vendedor456')

        # Guardar en base de datos
        db.session.add(nuevo_vendedor)
        db.session.commit()

        print('\n' + '='*70)
        print('✅ VENDEDOR 2 CREADO EXITOSAMENTE')
        print('='*70)
        print('\n📋 Detalles del nuevo usuario:')
        print(f'   Username: vendedor2')
        print(f'   Password: vendedor456')
        print(f'   Nombre: Carlos Mendoza')
        print(f'   Email: vendedor2@katita.com')
        print(f'   Rol: vendedor')
        print(f'   Turno: Tarde (2 PM - 10 PM)')
        print('\n💡 Este usuario puede:')
        print('   ✅ Hacer login')
        print('   ✅ Acceder al POS (Punto de Venta)')
        print('   ✅ Realizar ventas')
        print('   ✅ Ver Dashboard básico')
        print('\n❌ Este usuario NO puede:')
        print('   ❌ Ver Reportes')
        print('   ❌ Gestionar Productos')
        print('   ❌ Gestionar Lotes')
        print('   ❌ Ver datos de otros vendedores')

        print('\n🎯 Usuarios del sistema:')
        todos_usuarios = User.query.all()
        for user in todos_usuarios:
            print(f'   - {user.username} ({user.rol}) - {user.nombre_completo}')

        print('\n' + '='*70 + '\n')

if __name__ == '__main__':
    crear_vendedor2()
