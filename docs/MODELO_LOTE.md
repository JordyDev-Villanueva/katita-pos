# Documentación del Modelo Lote

## Descripción General

El modelo `Lote` es **CRÍTICO** para el sistema KATITA-POS. Gestiona el inventario por lotes con:
- **Control de fechas de vencimiento**
- **Sistema FIFO automático** (First In, First Out)
- **Trazabilidad completa** de inventario
- **Alertas de vencimiento**

Este modelo permite un control preciso del inventario, especialmente importante para productos con fecha de caducidad.

## Ubicación

```
app/models/lote.py
```

## Diagrama de la Tabla

```
┌──────────────────────────────────────────────────────────────┐
│                         LOTES                                │
├──────────────────────┬────────────────┬──────────────────────┤
│ Campo                │ Tipo           │ Restricciones        │
├──────────────────────┼────────────────┼──────────────────────┤
│ id                   │ INTEGER        │ PK, AUTO             │
│ producto_id          │ INTEGER        │ FK, NOT NULL, INDEX  │
│ codigo_lote          │ VARCHAR(50)    │ UNIQUE, NOT NULL     │
│ cantidad_inicial     │ INTEGER        │ NOT NULL, > 0        │
│ cantidad_actual      │ INTEGER        │ NOT NULL, >= 0       │
│ fecha_ingreso        │ DATETIME       │ DEFAULT NOW          │
│ fecha_vencimiento    │ DATE           │ NOT NULL, INDEX      │
│ precio_compra_lote   │ DECIMAL(10,2)  │ NOT NULL, > 0        │
│ proveedor            │ VARCHAR(200)   │ NULL                 │
│ ubicacion            │ VARCHAR(100)   │ NULL                 │
│ notas                │ TEXT           │ NULL                 │
│ activo               │ BOOLEAN        │ DEFAULT TRUE, INDEX  │
│ created_at           │ DATETIME       │ DEFAULT NOW          │
│ updated_at           │ DATETIME       │ ON UPDATE NOW        │
└──────────────────────┴────────────────┴──────────────────────┘
```

## Campos

### Campos de Identificación

#### `id` (Integer, PK)
- Identificador único del lote
- Autoincremental

#### `producto_id` (Integer, FK)
- ID del producto asociado
- Foreign Key a `products.id`
- **Indexado** para búsquedas rápidas
- ON DELETE CASCADE

#### `codigo_lote` (String(50))
- Código único del lote
- **Único**: No puede haber dos lotes con el mismo código
- **Indexado**
- Formato sugerido: `LT-YYYY-CODIGO`

### Campos de Cantidad

#### `cantidad_inicial` (Integer)
- Cantidad al ingresar el lote
- **Requerido**
- **Validación**: > 0

#### `cantidad_actual` (Integer)
- Cantidad disponible actualmente
- **Requerido**
- **Validaciones**:
  - >= 0
  - <= cantidad_inicial
- Se descuenta con cada venta
- Si llega a 0, el lote se marca como inactivo

### Campos de Fechas

#### `fecha_ingreso` (DateTime)
- Fecha y hora de ingreso al inventario
- **Automático**: Se establece al crear el lote
- Formato: UTC

#### `fecha_vencimiento` (Date)
- Fecha de vencimiento del lote
- **Requerido**
- **Indexado**: Para búsquedas de lotes próximos a vencer
- **Validación**: Debe ser posterior a fecha_ingreso
- Formato: YYYY-MM-DD

### Campos de Precio

#### `precio_compra_lote` (Decimal(10,2))
- Precio de compra de este lote específico
- **Requerido**
- **Validación**: > 0
- Permite diferentes precios por lote del mismo producto

### Campos de Logística

#### `proveedor` (String(200))
- Nombre del proveedor del lote
- **Opcional**
- Útil para trazabilidad

#### `ubicacion` (String(100))
- Ubicación física del lote
- **Opcional**
- Ejemplos: "Pasillo A, Estante 3", "Bodega 2"

#### `notas` (Text)
- Notas adicionales del lote
- **Opcional**
- Información relevante sobre el lote

### Campos de Estado

#### `activo` (Boolean)
- Indica si el lote está activo
- **Default**: True
- Se marca como `False` cuando:
  - Se agota el stock (cantidad_actual = 0)
  - Se desactiva manualmente
- **Indexado** para filtrar lotes activos

### Campos de Auditoría

#### `created_at` (DateTime)
- Fecha de creación del registro
- **Automático**

#### `updated_at` (DateTime)
- Fecha de última actualización
- **Automático** en cada modificación

## Propiedades Calculadas (Hybrid Properties)

### `dias_hasta_vencimiento`
```python
lote.dias_hasta_vencimiento  # int
```
Calcula los días restantes hasta el vencimiento.
- Positivo: Días que faltan
- Negativo: Días que pasaron desde que venció

### `esta_vencido`
```python
lote.esta_vencido  # bool
```
Retorna `True` si la fecha de vencimiento ya pasó.

### `esta_por_vencer`
```python
lote.esta_por_vencer  # bool
```
Retorna `True` si vence en 30 días o menos.

### `cantidad_vendida`
```python
lote.cantidad_vendida  # int
```
Calcula la cantidad vendida: `cantidad_inicial - cantidad_actual`

### `porcentaje_vendido`
```python
lote.porcentaje_vendido  # float
```
Calcula el porcentaje vendido sobre la cantidad inicial.

### `tiene_stock`
```python
lote.tiene_stock  # bool
```
Retorna `True` si `cantidad_actual > 0`.

## Métodos de Instancia

### `validar()`
Valida todos los campos del lote antes de guardar.

```python
lote.validar()  # Lanza ValueError si hay errores
```

### `to_dict(include_producto=False)`
Convierte el lote a diccionario para JSON.

```python
data = lote.to_dict()
data_completo = lote.to_dict(include_producto=True)
```

### `descontar_stock(cantidad)`
Descuenta stock del lote (ventas).

```python
lote.descontar_stock(10)  # Descuenta 10 unidades
```

**Comportamiento:**
- Descuenta de `cantidad_actual`
- Actualiza `updated_at`
- Si `cantidad_actual` llega a 0, marca `activo = False`
- Lanza `ValueError` si no hay stock suficiente

### `aumentar_stock(cantidad)`
Aumenta el stock del lote (devoluciones, ajustes).

```python
lote.aumentar_stock(5)  # Devuelve 5 unidades
```

**Validaciones:**
- No puede exceder `cantidad_inicial`
- Si estaba inactivo por falta de stock, se reactiva

### `esta_disponible()`
Verifica si el lote está disponible para venta.

```python
if lote.esta_disponible():
    # Usar este lote
```

Retorna `True` si:
- `tiene_stock == True`
- `activo == True`
- `esta_vencido == False`

### `dias_en_inventario()`
Calcula los días que el lote lleva en el inventario.

```python
dias = lote.dias_en_inventario()
```

### `activar()` / `desactivar()`
Activa o desactiva el lote.

```python
lote.desactivar()
lote.activar()
```

## Métodos de Clase (Queries)

### `buscar_por_producto(producto_id, solo_activos=True)`
Busca todos los lotes de un producto.

```python
lotes = Lote.buscar_por_producto(producto_id).all()
```

### `proximos_a_vencer(dias=30, solo_activos=True)`
Retorna lotes que vencen pronto.

```python
lotes = Lote.proximos_a_vencer(dias=30)
```

**Uso:** Alertas de vencimiento, promociones.

### `lotes_vencidos(solo_con_stock=True)`
Retorna lotes que ya vencieron.

```python
vencidos = Lote.lotes_vencidos()
```

**Uso:** Identificar producto a retirar del inventario.

### `lotes_activos(con_stock=True)`
Retorna lotes activos.

```python
activos = Lote.lotes_activos().all()
```

### `lotes_fifo(producto_id)` ⭐ CRÍTICO
Retorna lotes ordenados por FIFO.

```python
lotes_fifo = Lote.lotes_fifo(producto_id).all()
```

**Ordenamiento:**
1. Primero los que vencen antes
2. Solo lotes activos
3. Solo con stock
4. Solo no vencidos

**Uso:** **SIEMPRE** usar este método al vender productos.

### `buscar_por_codigo(codigo_lote)`
Busca un lote por su código.

```python
lote = Lote.buscar_por_codigo('LT-2024-001')
```

### `buscar_por_proveedor(proveedor, solo_activos=True)`
Busca lotes por proveedor.

```python
lotes = Lote.buscar_por_proveedor('Proveedor ABC').all()
```

### `lotes_por_ubicacion(ubicacion)`
Busca lotes por ubicación física.

```python
lotes = Lote.lotes_por_ubicacion('Pasillo A').all()
```

### `estadisticas_por_producto(producto_id)`
Obtiene estadísticas de lotes de un producto.

```python
stats = Lote.estadisticas_por_producto(producto_id)
# {
#     'total_lotes': 5,
#     'lotes_activos': 3,
#     'stock_total': 150,
#     'lotes_vencidos': 1,
#     'lotes_por_vencer': 2
# }
```

## Relaciones

### `producto` (Many-to-One)
Relación con el modelo `Product`.

```python
# Desde el lote
lote.producto.nombre

# Desde el producto
producto.lotes.all()
```

## Constraints de Base de Datos

### Check Constraints

1. **cantidad_actual >= 0**
   - No se permite stock negativo

2. **cantidad_actual <= cantidad_inicial**
   - Stock actual nunca puede superar el inicial

3. **precio_compra_lote > 0**
   - Precio debe ser positivo

4. **cantidad_inicial > 0**
   - Cantidad inicial debe ser positiva

### Índices

1. **producto_id** (INDEX)
2. **fecha_vencimiento** (INDEX)
3. **activo** (INDEX)
4. **codigo_lote** (UNIQUE, INDEX)
5. **idx_producto_vencimiento** (COMPOSITE)
   - Optimiza búsquedas FIFO
6. **idx_producto_activo** (COMPOSITE)
   - Optimiza filtros por producto y estado

## Sistema FIFO (First In, First Out)

### ¿Qué es FIFO?

FIFO = **First In, First Out** (Primero en entrar, primero en salir)

En el contexto de inventario:
- Los productos que vencen **primero** se venden **primero**
- Minimiza pérdidas por vencimiento
- Mejora rotación de inventario

### Implementación en KATITA-POS

```python
# 1. Obtener lotes ordenados por FIFO
lotes = Lote.lotes_fifo(producto_id).all()

# 2. Vender usando FIFO
cantidad_a_vender = 50

for lote in lotes:
    if cantidad_a_vender <= 0:
        break

    if lote.cantidad_actual >= cantidad_a_vender:
        # Este lote tiene suficiente
        lote.descontar_stock(cantidad_a_vender)
        cantidad_a_vender = 0
    else:
        # Agotar este lote y continuar
        cantidad = lote.cantidad_actual
        lote.descontar_stock(cantidad)
        cantidad_a_vender -= cantidad
```

### Ejemplo Práctico

```
Producto: Coca Cola 2L

Lotes disponibles:
1. LT-001: 30 unidades, vence en 20 días  ← PRIMERO
2. LT-002: 50 unidades, vence en 45 días
3. LT-003: 40 unidades, vence en 90 días

Cliente compra 50 unidades:
- Tomar 30 de LT-001 (se agota)
- Tomar 20 de LT-002
```

## Alertas de Vencimiento

### Niveles de Alerta

```python
if lote.dias_hasta_vencimiento <= 7:
    nivel = "🚨 CRÍTICO"
elif lote.dias_hasta_vencimiento <= 15:
    nivel = "⚠️  URGENTE"
elif lote.dias_hasta_vencimiento <= 30:
    nivel = "⏰ ATENCIÓN"
```

### Monitoreo Automático

```python
# Lotes que vencen en 30 días
proximos = Lote.proximos_a_vencer(dias=30)

# Lotes ya vencidos con stock
vencidos = Lote.lotes_vencidos(solo_con_stock=True)
```

## Ejemplos de Uso

### Crear un Lote

```python
from app.models.lote import Lote
from decimal import Decimal
from datetime import date, timedelta

lote = Lote(
    producto_id=1,
    codigo_lote='LT-2024-COCA-001',
    cantidad_inicial=100,
    cantidad_actual=100,
    fecha_vencimiento=date.today() + timedelta(days=180),
    precio_compra_lote=Decimal('8.50'),
    proveedor='Proveedor ABC',
    ubicacion='Pasillo A, Estante 3'
)

lote.validar()
db.session.add(lote)
db.session.commit()
```

### Venta con FIFO

```python
def vender_producto_fifo(producto_id, cantidad):
    """Vende usando FIFO"""
    lotes = Lote.lotes_fifo(producto_id).all()

    cantidad_restante = cantidad
    lotes_usados = []

    for lote in lotes:
        if cantidad_restante <= 0:
            break

        if lote.cantidad_actual >= cantidad_restante:
            lote.descontar_stock(cantidad_restante)
            lotes_usados.append({
                'lote_id': lote.id,
                'cantidad': cantidad_restante
            })
            cantidad_restante = 0
        else:
            cantidad = lote.cantidad_actual
            lote.descontar_stock(cantidad)
            lotes_usados.append({
                'lote_id': lote.id,
                'cantidad': cantidad
            })
            cantidad_restante -= cantidad

    if cantidad_restante > 0:
        raise ValueError('Stock insuficiente')

    db.session.commit()
    return lotes_usados
```

### Alertas de Vencimiento

```python
# Dashboard de alertas
def dashboard_vencimientos():
    criticos = []  # < 7 días
    urgentes = []  # < 15 días
    atencion = []  # < 30 días

    lotes = Lote.proximos_a_vencer(dias=30)

    for lote in lotes:
        if lote.dias_hasta_vencimiento <= 7:
            criticos.append(lote)
        elif lote.dias_hasta_vencimiento <= 15:
            urgentes.append(lote)
        else:
            atencion.append(lote)

    return {
        'criticos': criticos,
        'urgentes': urgentes,
        'atencion': atencion
    }
```

## Buenas Prácticas

### 1. Siempre Usar FIFO

```python
# ✅ Correcto
lotes = Lote.lotes_fifo(producto_id)

# ❌ Incorrecto
lotes = Lote.buscar_por_producto(producto_id)
```

### 2. Validar Antes de Guardar

```python
lote.validar()
db.session.add(lote)
db.session.commit()
```

### 3. Monitorear Vencimientos

```python
# Ejecutar diariamente
lotes_vencidos = Lote.lotes_vencidos()
lotes_proximos = Lote.proximos_a_vencer(dias=15)
```

### 4. Códigos de Lote Descriptivos

```python
# ✅ Bueno
'LT-2024-COCA-001'
'LT-2024-01-SPRITE'

# ❌ Malo
'L1'
'ABC'
```

## Testing

Ubicación: `tests/unit/test_lote_model.py`

Ejecutar tests:
```bash
pytest tests/unit/test_lote_model.py -v
```

## Roadmap

- [ ] Integrar con `MovimientoStock` para historial
- [ ] Alertas automáticas por email/SMS
- [ ] Dashboard de vencimientos
- [ ] Sugerencias de descuentos para lotes próximos a vencer
- [ ] Reportes de rotación de inventario

---

**KATITA-POS** - Sistema POS híbrido para minimarket
