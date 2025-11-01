# Instrucciones de Instalación y Verificación

## Paso 1: Crear Entorno Virtual

```bash
# Crear entorno virtual
python -m venv venv
```

## Paso 2: Activar Entorno Virtual

### Windows (CMD)
```bash
venv\Scripts\activate
```

### Windows (PowerShell)
```bash
venv\Scripts\Activate.ps1
```

### Linux/MacOS
```bash
source venv/bin/activate
```

**Verificar que esté activo:**
Deberías ver `(venv)` al inicio de tu línea de comandos.

## Paso 3: Instalar Dependencias

```bash
pip install -r requirements.txt
```

Esto instalará:
- Flask 3.0.0
- SQLAlchemy 2.0.23
- Flask-JWT-Extended 4.6.0
- Flask-CORS 4.0.0
- pytest 7.4.3
- Y todas las demás dependencias

**Tiempo estimado:** 1-2 minutos

## Paso 4: Verificar Instalación

```bash
# Verificar Python
python --version
# Debería mostrar: Python 3.12.3

# Verificar Flask
python -c "import flask; print(f'Flask {flask.__version__}')"
# Debería mostrar: Flask 3.0.0

# Verificar SQLAlchemy
python -c "import sqlalchemy; print(f'SQLAlchemy {sqlalchemy.__version__}')"
# Debería mostrar: SQLAlchemy 2.0.23
```

## Paso 5: Verificar el Modelo Product

```bash
# Importar el modelo
python -c "from app.models.product import Product; print('✅ Modelo Product importado correctamente')"
```

Si no hay errores, el modelo está listo.

## Paso 6: Ejecutar el Servidor

```bash
python run.py
```

**Deberías ver:**
```
╔═══════════════════════════════════════╗
║       KATITA-POS - Backend API        ║
╚═══════════════════════════════════════╝

🚀 Server running on: http://127.0.0.1:5000
📊 Database Mode: local
🔧 Environment: development

Press CTRL+C to quit
```

## Paso 7: Verificar que Funciona

Abre tu navegador y ve a:

```
http://localhost:5000/health
```

**Deberías ver:**
```json
{
  "status": "healthy",
  "service": "KATITA-POS API",
  "database_mode": "local",
  "version": "1.0.0"
}
```

✅ **¡El servidor está funcionando!**

## Paso 8: Verificar la Base de Datos

La base de datos SQLite se crea automáticamente en:
```
instance/katita_pos.db
```

**Verificar que existe:**

### Windows (CMD)
```bash
dir instance
```

### Linux/MacOS
```bash
ls -la instance/
```

Deberías ver el archivo `katita_pos.db`.

## Paso 9: Ejecutar Tests

```bash
# Ejecutar todos los tests del modelo Product
pytest tests/unit/test_product_model.py -v
```

**Deberías ver:**
```
tests/unit/test_product_model.py::TestProductModel::test_crear_producto_basico PASSED
tests/unit/test_product_model.py::TestProductModel::test_producto_valores_por_defecto PASSED
tests/unit/test_product_model.py::TestProductModel::test_codigo_barras_unico PASSED
...
======================== 26 passed in X.XXs ========================
```

### Ejecutar tests con cobertura

```bash
pytest tests/unit/test_product_model.py --cov=app.models.product --cov-report=term-missing
```

## Paso 10: Probar Crear un Producto

Crea un archivo de prueba `test_crear_producto.py`:

```python
from app import create_app, db
from app.models.product import Product
from decimal import Decimal

app = create_app('development')

with app.app_context():
    # Crear producto
    product = Product(
        codigo_barras='7501234567890',
        nombre='Coca Cola 2L',
        categoria='Bebidas',
        precio_compra=Decimal('8.50'),
        precio_venta=Decimal('12.00'),
        stock_total=50,
        stock_minimo=10
    )

    # Validar
    product.validar()

    # Guardar
    db.session.add(product)
    db.session.commit()

    print(f'✅ Producto creado: {product}')
    print(f'   ID: {product.id}')
    print(f'   Margen: S/ {product.margen_ganancia}')
    print(f'   Ganancia: {product.porcentaje_ganancia}%')

    # Buscar
    found = Product.buscar_por_codigo('7501234567890')
    print(f'\n✅ Producto encontrado: {found.nombre}')
```

**Ejecutar:**
```bash
python test_crear_producto.py
```

## Troubleshooting (Solución de Problemas)

### Error: "No module named 'flask'"

**Solución:** El entorno virtual no está activo.
```bash
# Windows
venv\Scripts\activate

# Linux/MacOS
source venv/bin/activate
```

### Error: "ModuleNotFoundError: No module named 'app'"

**Solución:** Asegúrate de estar en el directorio raíz del proyecto.
```bash
cd e:\PROYECTO PYTHON PORTAFOLIO\katita-pos
```

### Error: "IntegrityError: UNIQUE constraint failed"

**Solución:** El código de barras ya existe en la BD. Usa otro código o elimina la BD:
```bash
# Windows
del instance\katita_pos.db

# Linux/MacOS
rm instance/katita_pos.db
```

### Error: "Port 5000 is already in use"

**Solución:** El puerto 5000 está ocupado. Cambia el puerto en `.env`:
```env
FLASK_PORT=5001
```

### Tests no se ejecutan

**Solución:** Verifica que pytest esté instalado:
```bash
pip install pytest pytest-flask pytest-cov
```

## Comandos Útiles de Desarrollo

### Ver paquetes instalados
```bash
pip list
```

### Ver estructura del proyecto
```bash
# Windows
tree /F

# Linux/MacOS
find . -type f | grep -v "__pycache__" | grep -v "venv"
```

### Limpiar base de datos
```bash
# Windows
del instance\katita_pos.db

# Linux/MacOS
rm instance/katita_pos.db
```

### Limpiar __pycache__
```bash
# Windows
for /d /r . %d in (__pycache__) do @if exist "%d" rd /s /q "%d"

# Linux/MacOS
find . -type d -name __pycache__ -exec rm -rf {} +
```

### Formatear código con Black
```bash
black app/ tests/
```

### Linting con Flake8
```bash
flake8 app/ tests/
```

## Verificación Final: Checklist

Marca cada item cuando esté completo:

- [ ] Entorno virtual creado y activado
- [ ] Dependencias instaladas (`pip list` muestra Flask, SQLAlchemy, etc.)
- [ ] Servidor ejecutándose (`python run.py`)
- [ ] Endpoint `/health` responde OK
- [ ] Base de datos creada (`instance/katita_pos.db` existe)
- [ ] Tests pasan (`pytest tests/unit/test_product_model.py`)
- [ ] Modelo Product se puede importar
- [ ] Se puede crear y guardar un producto
- [ ] Se puede buscar un producto

## Próximos Pasos

Una vez que todo funcione:

1. **Explorar ejemplos:**
   ```bash
   python ejemplos_product.py
   ```
   (Edita el archivo y descomenta los ejemplos)

2. **Leer documentación:**
   - [README.md](README.md) - Overview del proyecto
   - [STRUCTURE.md](STRUCTURE.md) - Estructura del código
   - [docs/MODELO_PRODUCT.md](docs/MODELO_PRODUCT.md) - Documentación del modelo
   - [PRODUCT_MODEL_SUMMARY.md](PRODUCT_MODEL_SUMMARY.md) - Resumen del modelo

3. **Crear más modelos:**
   - User (usuarios del sistema)
   - Sale (ventas)
   - Category (categorías)
   - Lote (lotes de inventario)

4. **Crear blueprint de Products:**
   - `app/blueprints/products.py`
   - Endpoints REST para CRUD de productos

5. **Frontend:**
   - React + Tailwind CSS
   - Integración con la API

---

**¡Listo para desarrollar!** 🚀

Si tienes problemas, revisa:
- [commands.md](commands.md) - Comandos útiles
- Logs en `logs/katita-pos.log`
- Documentación de Flask: https://flask.palletsprojects.com/

---

**KATITA-POS** - Sistema POS híbrido para minimarket
