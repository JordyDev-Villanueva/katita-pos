"""
Script de verificación de productos en la base de datos
========================================================
Este script verifica directamente la base de datos para confirmar
si existen productos creados.
"""

from app import create_app, db
from app.models.product import Product
from sqlalchemy import text

def main():
    print("=" * 70)
    print("VERIFICACIÓN DE PRODUCTOS EN BASE DE DATOS")
    print("=" * 70)

    # Crear aplicación Flask
    app = create_app()

    with app.app_context():
        try:
            # Verificar conexión a la base de datos
            print("\n1. Verificando conexion a la base de datos...")
            result = db.session.execute(text("SELECT 1"))
            print("   OK - Conexion exitosa")

            # Contar productos
            print("\n2. Contando productos en la tabla 'products'...")
            total_productos = Product.query.count()
            print(f"   Total de productos: {total_productos}")

            if total_productos == 0:
                print("   ADVERTENCIA - No hay productos en la base de datos")
                return

            # Listar todos los productos
            print("\n3. Listando todos los productos:")
            print("-" * 70)

            productos = Product.query.order_by(Product.created_at.desc()).all()

            for i, producto in enumerate(productos, 1):
                print(f"\n   Producto #{i}:")
                print(f"   - ID: {producto.id}")
                print(f"   - Código de barras: {producto.codigo_barras}")
                print(f"   - Nombre: {producto.nombre}")
                print(f"   - Categoría: {producto.categoria}")
                print(f"   - Precio compra: S/ {producto.precio_compra}")
                print(f"   - Precio venta: S/ {producto.precio_venta}")
                print(f"   - Stock total: {producto.stock_total}")
                print(f"   - Stock mínimo: {producto.stock_minimo}")
                print(f"   - Activo: {'Si' if producto.activo else 'No'}")
                print(f"   - Creado: {producto.created_at}")
                if producto.imagen_url:
                    print(f"   - Imagen: {producto.imagen_url}")
                print("-" * 70)

            # Contar por estado
            print("\n4. Estadísticas:")
            activos = Product.query.filter_by(activo=True).count()
            inactivos = Product.query.filter_by(activo=False).count()
            print(f"   - Productos activos: {activos}")
            print(f"   - Productos inactivos: {inactivos}")

            # Verificar el último producto creado
            print("\n5. Último producto creado:")
            ultimo = Product.query.order_by(Product.created_at.desc()).first()
            if ultimo:
                print(f"   - {ultimo.nombre} ({ultimo.codigo_barras})")
                print(f"   - Creado hace: {ultimo.created_at}")

            print("\n" + "=" * 70)
            print("VERIFICACIÓN COMPLETADA")
            print("=" * 70)

        except Exception as e:
            print(f"\nERROR: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    main()
