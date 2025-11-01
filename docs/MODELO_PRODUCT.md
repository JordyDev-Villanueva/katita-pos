# Documentación del Modelo Product

## Descripción General

El modelo `Product` representa un producto en el inventario del minimarket. Es el modelo central del sistema POS, ya que gestiona toda la información relacionada con los productos disponibles para la venta.

## Ubicación

```
app/models/product.py
```

## Diagrama de la Tabla

```
┌─────────────────────────────────────────────────────────┐
│                      PRODUCTS                           │
├─────────────────────┬───────────────┬───────────────────┤
│ Campo               │ Tipo          │ Restricciones     │
├─────────────────────┼───────────────┼───────────────────┤
│ id                  │ INTEGER       │ PK, AUTO          │
│ codigo_barras       │ VARCHAR(13)   │ UNIQUE, NOT NULL  │
│ nombre              │ VARCHAR(200)  │ NOT NULL, INDEX   │
│ descripcion         │ TEXT          │ NULL              │
│ categoria           │ VARCHAR(50)   │ NOT NULL, INDEX   │
│ precio_compra       │ DECIMAL(10,2) │ NOT NULL, > 0     │
│ precio_venta        │ DECIMAL(10,2) │ NOT NULL, > compra│
│ stock_total         │ INTEGER       │ DEFAULT 0, >= 0   │
│ stock_minimo        │ INTEGER       │ DEFAULT 5, >= 0   │
│ imagen_url          │ VARCHAR(500)  │ NULL              │
│ activo              │ BOOLEAN       │ DEFAULT TRUE      │
│ created_at          │ DATETIME      │ DEFAULT NOW       │
│ updated_at          │ DATETIME      │ ON UPDATE NOW     │
└─────────────────────┴───────────────┴───────────────────┘
```

## Campos

### Campos Principales

#### `id` (Integer, PK)
- Identificador único del producto
- Autoincremental
- Clave primaria

#### `codigo_barras` (String(13))
- Código de barras EAN-13 del producto
- **Único**: No puede haber dos productos con el mismo código
- **Indexado**: Para búsquedas rápidas
- **Validaciones**:
  - Debe ser numérico
  - Debe tener exactamente 13 caracteres
  - No puede estar vacío

#### `nombre` (String(200))
- Nombre descriptivo del producto
- **Indexado**: Para búsquedas rápidas por nombre
- **Requerido**: No puede estar vacío
- Ejemplo: "Coca Cola 2L"

#### `descripcion` (Text)
- Descripción detallada del producto
- **Opcional**
- Útil para información adicional

#### `categoria` (String(50))
- Categoría a la que pertenece el producto
- **Indexado**: Para filtrar por categoría
- **Requerido**: No puede estar vacío
- Ejemplos: "Bebidas", "Lácteos", "Panadería", "Snacks"

### Campos de Precios

#### `precio_compra` (Decimal(10,2))
- Precio al que se compra el producto
- Formato: Hasta 10 dígitos, 2 decimales
- **Requerido**
- **Validación**: Debe ser mayor a 0

#### `precio_venta` (Decimal(10,2))
- Precio de venta al público
- Formato: Hasta 10 dígitos, 2 decimales
- **Requerido**
- **Validación**: Debe ser mayor al precio de compra

### Campos de Stock

#### `stock_total` (Integer)
- Stock total actual del producto
- **Default**: 0
- **Validación**: No puede ser negativo
- Se calcula sumando todos los lotes (cuando se implemente)

#### `stock_minimo` (Integer)
- Stock mínimo para alerta de reabastecimiento
- **Default**: 5
- **Validación**: No puede ser negativo
- Cuando `stock_total < stock_minimo`, el producto necesita reabastecimiento

### Campos Adicionales

#### `imagen_url` (String(500))
- URL de la imagen del producto
- **Opcional**
- Puede ser URL local o externa

#### `activo` (Boolean)
- Indica si el producto está activo en el sistema
- **Default**: True
- Los productos inactivos no aparecen en búsquedas por defecto

#### `created_at` (DateTime)
- Fecha y hora de creación del registro
- **Automático**: Se establece al crear el producto
- Formato: UTC

#### `updated_at` (DateTime)
- Fecha y hora de última actualización
- **Automático**: Se actualiza cada vez que se modifica el producto
- Formato: UTC

## Propiedades Calculadas (Hybrid Properties)

### `stock_disponible`
```python
product.stock_disponible  # Retorna el stock total actual
```
Retorna el stock disponible del producto (actualmente igual a `stock_total`).

### `necesita_reabastecimiento`
```python
product.necesita_reabastecimiento  # True o False
```
Retorna `True` si el stock está por debajo del mínimo.

### `margen_ganancia`
```python
product.margen_ganancia  # Decimal
```
Calcula la diferencia entre precio de venta y compra.

### `porcentaje_ganancia`
```python
product.porcentaje_ganancia  # Float (%)
```
Calcula el porcentaje de ganancia sobre el precio de compra.

**Ejemplo:**
```python
# Precio compra: S/ 10.00
# Precio venta: S/ 15.00
# Margen: S/ 5.00
# Porcentaje: 50%
```

## Métodos de Instancia

### `validar()`
Valida todos los campos del producto antes de guardar.

```python
product.validar()  # Lanza ValueError si hay errores
```

### `to_dict(include_relationships=False)`
Convierte el producto a diccionario para respuestas JSON.

```python
data = product.to_dict()
# {
#     'id': 1,
#     'codigo_barras': '7501234567890',
#     'nombre': 'Coca Cola 2L',
#     'precio_venta': 12.00,
#     ...
# }
```

### `actualizar_stock(cantidad, operacion='suma')`
Actualiza el stock del producto.

```python
product.actualizar_stock(10, 'suma')   # Agregar 10 unidades
product.actualizar_stock(5, 'resta')   # Restar 5 unidades
```

**Lanza ValueError si:**
- La operación resulta en stock negativo
- La operación no es válida

### `activar()` / `desactivar()`
Activa o desactiva el producto.

```python
product.desactivar()  # Marca como inactivo
product.activar()     # Marca como activo
```

## Métodos de Clase (Queries)

### `buscar_por_codigo(codigo_barras)`
Busca un producto por su código de barras.

```python
product = Product.buscar_por_codigo('7501234567890')
```

### `buscar_activos()`
Retorna query de productos activos.

```python
activos = Product.buscar_activos().all()
```

### `buscar_por_categoria(categoria, solo_activos=True)`
Busca productos por categoría.

```python
bebidas = Product.buscar_por_categoria('Bebidas').all()
```

### `productos_bajo_stock()`
Retorna productos que necesitan reabastecimiento.

```python
bajo_stock = Product.productos_bajo_stock()
for product in bajo_stock:
    print(f'{product.nombre}: {product.stock_total}/{product.stock_minimo}')
```

### `buscar_por_nombre(termino, solo_activos=True)`
Búsqueda parcial por nombre (case-insensitive).

```python
# Busca productos que contengan "coca"
productos = Product.buscar_por_nombre('coca').all()
```

## Métodos Estáticos de Validación

### `validar_codigo_barras(codigo_barras)`
```python
Product.validar_codigo_barras('7501234567890')  # True
Product.validar_codigo_barras('ABC123')         # ValueError
```

### `validar_precios(precio_compra, precio_venta)`
```python
Product.validar_precios(Decimal('10.00'), Decimal('15.00'))  # True
Product.validar_precios(Decimal('15.00'), Decimal('10.00'))  # ValueError
```

### `validar_stock_minimo(stock_minimo)`
```python
Product.validar_stock_minimo(5)   # True
Product.validar_stock_minimo(-1)  # ValueError
```

## Constraints de Base de Datos

### Check Constraints

1. **precio_venta > precio_compra**
   - Garantiza que siempre haya margen de ganancia

2. **stock_minimo >= 0**
   - El stock mínimo no puede ser negativo

3. **stock_total >= 0**
   - El stock no puede ser negativo

### Índices

1. **codigo_barras** (UNIQUE, INDEX)
   - Búsqueda rápida por código de barras
   - Garantiza unicidad

2. **nombre** (INDEX)
   - Búsqueda rápida por nombre

3. **categoria** (INDEX)
   - Filtrado rápido por categoría

4. **activo** (INDEX)
   - Filtrado rápido por estado

5. **idx_categoria_activo** (COMPOSITE)
   - Índice compuesto para búsquedas por categoría + estado

## Relaciones (Futuras)

### `lotes` (One-to-Many)
Relación con el modelo `Lote` para gestión de inventario por lotes.

```python
# product.lotes.all()
```

### `movimientos` (One-to-Many)
Relación con `MovimientoStock` para historial de movimientos.

```python
# product.movimientos.all()
```

## Ejemplos de Uso

### Crear un Producto

```python
from app.models.product import Product
from decimal import Decimal

product = Product(
    codigo_barras='7501234567890',
    nombre='Coca Cola 2L',
    descripcion='Bebida gaseosa sabor cola',
    categoria='Bebidas',
    precio_compra=Decimal('8.50'),
    precio_venta=Decimal('12.00'),
    stock_total=50,
    stock_minimo=10,
    imagen_url='https://example.com/coca.jpg'
)

product.validar()
db.session.add(product)
db.session.commit()
```

### Buscar y Actualizar Stock

```python
product = Product.buscar_por_codigo('7501234567890')

if product:
    # Venta de 5 unidades
    product.actualizar_stock(5, 'resta')
    db.session.commit()
```

### Obtener Productos Bajo Stock

```python
productos = Product.productos_bajo_stock()

for p in productos:
    print(f'⚠️  {p.nombre}: Stock {p.stock_total}/{p.stock_minimo}')
```

### Convertir a JSON

```python
product = Product.buscar_por_codigo('7501234567890')
data = product.to_dict()

# Usar en API REST
return jsonify(data), 200
```

## Buenas Prácticas

### 1. Siempre Validar Antes de Guardar
```python
product.validar()
db.session.add(product)
db.session.commit()
```

### 2. Usar Decimal para Precios
```python
from decimal import Decimal

# ✅ Correcto
precio = Decimal('12.50')

# ❌ Incorrecto (problemas de precisión)
precio = 12.50
```

### 3. Verificar Stock Antes de Restar
```python
try:
    product.actualizar_stock(cantidad, 'resta')
except ValueError as e:
    # Manejar stock insuficiente
    print(f'Error: {e}')
```

### 4. Usar Métodos de Búsqueda de Clase
```python
# ✅ Correcto
product = Product.buscar_por_codigo('7501234567890')

# ❌ Menos eficiente
product = Product.query.filter_by(codigo_barras='7501234567890').first()
```

## Testing

Ubicación de tests: `tests/unit/test_product_model.py`

Ejecutar tests:
```bash
pytest tests/unit/test_product_model.py -v
```

## Notas de Implementación

- **Timestamps**: Se usan en UTC, convertir a timezone local en la presentación
- **Soft Delete**: Los productos se marcan como inactivos, no se eliminan
- **Stock Calculation**: El stock se calculará dinámicamente de los lotes en versiones futuras
- **Thread Safety**: Las operaciones de stock deben manejarse con transacciones

## Roadmap

- [ ] Implementar modelo `Lote` para gestión de inventario
- [ ] Implementar modelo `MovimientoStock` para historial
- [ ] Agregar soporte para múltiples unidades de medida
- [ ] Implementar sistema de descuentos por producto
- [ ] Agregar soporte para productos compuestos

---

**KATITA-POS** - Sistema POS híbrido para minimarket
