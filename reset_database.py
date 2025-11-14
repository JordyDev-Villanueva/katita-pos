"""
KATITA-POS - Script de Reset de Base de Datos
==============================================
Este script elimina TODOS los datos excepto los usuarios.
Mantiene: admin1, vendedor1, bodeguero1
Elimina: Productos, Lotes, Ventas, Detalles, Movimientos

ADVERTENCIA: Esta acción es IRREVERSIBLE
"""

import sys
import os
import io

# Fix encoding para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Agregar el directorio backend al path para poder importar app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User
from app.models.product import Product
from app.models.venta import Venta
from app.models.detalle_venta import DetalleVenta
from sqlalchemy import text

def confirmar_reset():
    """Solicita confirmación del usuario antes de proceder"""
    print('\n' + '='*70)
    print('⚠️  ADVERTENCIA: RESET COMPLETO DE BASE DE DATOS')
    print('='*70)
    print('\n📋 Este script eliminará:')
    print('   ❌ Todos los productos')
    print('   ❌ Todos los lotes')
    print('   ❌ Todas las ventas y sus detalles')
    print('   ❌ Todos los movimientos de stock')
    print('   ❌ Cola de sincronización')
    print('\n✅ Mantendrá:')
    print('   ✓ Los 3 usuarios (admin1, vendedor1, bodeguero1)')
    print('   ✓ La estructura de las tablas')
    print('\n' + '='*70)

    confirmacion = input('\n¿Estás SEGURO que deseas continuar? Escribe "SI" para confirmar: ')

    if confirmacion.strip().upper() != 'SI':
        print('\n❌ Operación cancelada.')
        return False

    return True

def mostrar_estado_inicial(app):
    """Muestra el estado actual de la base de datos"""
    with app.app_context():
        print('\n' + '='*70)
        print('📊 ESTADO ACTUAL DE LA BASE DE DATOS')
        print('='*70)

        try:
            usuarios = User.query.count()
            productos = Product.query.count()
            ventas = Venta.query.count()
            detalles = DetalleVenta.query.count()

            # Verificar si existen las tablas de lotes y movimientos
            try:
                result = db.session.execute(text("SELECT COUNT(*) FROM lotes"))
                lotes = result.scalar()
            except:
                lotes = 0

            try:
                result = db.session.execute(text("SELECT COUNT(*) FROM movimientos_stock"))
                movimientos = result.scalar()
            except:
                movimientos = 0

            try:
                result = db.session.execute(text("SELECT COUNT(*) FROM sync_queue"))
                sync_queue = result.scalar()
            except:
                sync_queue = 0

            print(f'\n👥 Usuarios: {usuarios}')
            print(f'📦 Productos: {productos}')
            print(f'📋 Lotes: {lotes}')
            print(f'🛒 Ventas: {ventas}')
            print(f'📄 Detalles de Venta: {detalles}')
            print(f'📊 Movimientos de Stock: {movimientos}')
            print(f'🔄 Cola de Sincronización: {sync_queue}')
            print('='*70)

            return {
                'usuarios': usuarios,
                'productos': productos,
                'lotes': lotes,
                'ventas': ventas,
                'detalles': detalles,
                'movimientos': movimientos,
                'sync_queue': sync_queue
            }
        except Exception as e:
            print(f'❌ Error al obtener estado: {str(e)}')
            return None

def ejecutar_reset(app):
    """Ejecuta el reset de la base de datos"""
    with app.app_context():
        print('\n' + '='*70)
        print('🔄 EJECUTANDO RESET...')
        print('='*70)

        try:
            # Paso 1: Eliminar cola de sincronización
            print('\n🗑️  Eliminando cola de sincronización...')
            try:
                db.session.execute(text("DELETE FROM sync_queue"))
                print('   ✅ Cola de sincronización eliminada')
            except Exception as e:
                print(f'   ⚠️  No se pudo eliminar sync_queue (puede no existir): {str(e)}')

            # Paso 2: Eliminar movimientos de stock
            print('\n🗑️  Eliminando movimientos de stock...')
            try:
                db.session.execute(text("DELETE FROM movimientos_stock"))
                print('   ✅ Movimientos de stock eliminados')
            except Exception as e:
                print(f'   ⚠️  No se pudo eliminar movimientos_stock (puede no existir): {str(e)}')

            # Paso 3: Eliminar detalles de venta
            print('\n🗑️  Eliminando detalles de venta...')
            detalles_count = DetalleVenta.query.count()
            DetalleVenta.query.delete()
            print(f'   ✅ {detalles_count} detalles de venta eliminados')

            # Paso 4: Eliminar ventas
            print('\n🗑️  Eliminando ventas...')
            ventas_count = Venta.query.count()
            Venta.query.delete()
            print(f'   ✅ {ventas_count} ventas eliminadas')

            # Paso 5: Eliminar lotes
            print('\n🗑️  Eliminando lotes...')
            try:
                result = db.session.execute(text("SELECT COUNT(*) FROM lotes"))
                lotes_count = result.scalar()
                db.session.execute(text("DELETE FROM lotes"))
                print(f'   ✅ {lotes_count} lotes eliminados')
            except Exception as e:
                print(f'   ⚠️  No se pudo eliminar lotes (puede no existir): {str(e)}')

            # Paso 6: Eliminar productos
            print('\n🗑️  Eliminando productos...')
            productos_count = Product.query.count()
            Product.query.delete()
            print(f'   ✅ {productos_count} productos eliminados')

            # Commit de todos los cambios
            print('\n💾 Guardando cambios...')
            db.session.commit()
            print('   ✅ Cambios guardados exitosamente')

            return True

        except Exception as e:
            print(f'\n❌ ERROR durante el reset: {str(e)}')
            db.session.rollback()
            print('   🔄 Cambios revertidos')
            return False

def verificar_usuarios(app):
    """Verifica que los usuarios sigan intactos"""
    with app.app_context():
        print('\n' + '='*70)
        print('👥 VERIFICANDO USUARIOS...')
        print('='*70)

        try:
            usuarios = User.query.all()

            if len(usuarios) == 0:
                print('❌ ERROR: No hay usuarios en la base de datos')
                return False

            print(f'\n✅ Se encontraron {len(usuarios)} usuarios:')
            for user in usuarios:
                print(f'   • {user.username} ({user.rol})')

            return True

        except Exception as e:
            print(f'❌ Error al verificar usuarios: {str(e)}')
            return False

def mostrar_estado_final(app):
    """Muestra el estado final de la base de datos"""
    estado = mostrar_estado_inicial(app)

    if estado:
        print('\n' + '='*70)
        print('✅ RESET COMPLETADO EXITOSAMENTE')
        print('='*70)
        print('\n📊 Resumen:')
        print(f'   ✅ Usuarios mantenidos: {estado["usuarios"]}')
        print(f'   ❌ Productos eliminados: Ahora hay {estado["productos"]}')
        print(f'   ❌ Lotes eliminados: Ahora hay {estado["lotes"]}')
        print(f'   ❌ Ventas eliminadas: Ahora hay {estado["ventas"]}')
        print(f'   ❌ Detalles eliminados: Ahora hay {estado["detalles"]}')
        print('='*70)
        print('\n🎉 La base de datos está lista para empezar desde cero!')
        print('   Ahora puedes agregar productos con precio_compra configurado correctamente.')
        print('='*70 + '\n')

def main():
    """Función principal del script"""
    print('\n🚀 KATITA-POS - Script de Reset de Base de Datos')

    # Crear aplicación Flask
    app = create_app()

    # Mostrar estado inicial
    estado_inicial = mostrar_estado_inicial(app)

    if not estado_inicial:
        print('\n❌ No se pudo obtener el estado de la base de datos. Abortando.')
        sys.exit(1)

    # Verificar si hay datos para eliminar
    if (estado_inicial['productos'] == 0 and
        estado_inicial['lotes'] == 0 and
        estado_inicial['ventas'] == 0):
        print('\n✅ La base de datos ya está vacía (excepto usuarios).')
        print('   No hay nada que eliminar.')
        sys.exit(0)

    # Solicitar confirmación
    if not confirmar_reset():
        sys.exit(0)

    # Ejecutar reset
    if ejecutar_reset(app):
        # Verificar usuarios
        if verificar_usuarios(app):
            # Mostrar estado final
            mostrar_estado_final(app)
            sys.exit(0)
        else:
            print('\n❌ ERROR: Los usuarios no están intactos después del reset')
            sys.exit(1)
    else:
        print('\n❌ ERROR: El reset no se completó correctamente')
        sys.exit(1)

if __name__ == '__main__':
    main()
