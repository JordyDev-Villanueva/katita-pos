# Corrección Final: Tests de Lotes Vencidos

## Problema Encontrado

Después de implementar la validación de fechas en `__init__`, 4 tests fallaron:
- `test_esta_vencido`
- `test_esta_disponible`
- `test_lotes_vencidos`
- `test_estadisticas_por_producto`

---

## ¿Por Qué Fallaban?

### El Problema de la Validación Automática

La validación en `__init__` verifica que `fecha_vencimiento > fecha_ingreso`:

```python
def __init__(self, **kwargs):
    super(Lote, self).__init__(**kwargs)

    # Si fecha_ingreso no se proporciona, usar la fecha actual
    if self.fecha_ingreso is None:
        self.fecha_ingreso = datetime.now(timezone.utc)  # ← HOY

    # Validación de fechas
    if self.fecha_vencimiento and self.fecha_ingreso:
        fecha_ingreso_date = self.fecha_ingreso.date()
        if self.fecha_vencimiento <= fecha_ingreso_date:
            raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')
```

### El Problema en los Tests

Los tests querían crear lotes **ya vencidos** (con `fecha_vencimiento` en el pasado):

```python
# Test original (FALLA)
lote_vencido = Lote(
    codigo_lote='LT-2024-009',
    cantidad_inicial=50,
    cantidad_actual=20,
    fecha_vencimiento=date.today() - timedelta(days=10),  # ← Hace 10 días
    precio_compra_lote=Decimal('8.00')
)
# fecha_ingreso no se proporciona → se asigna HOY
# fecha_vencimiento (hace 10 días) < fecha_ingreso (hoy)
# ❌ ValueError: La fecha de vencimiento debe ser posterior a la fecha de ingreso
```

**Problema:** Los tests no proporcionaban `fecha_ingreso`, por lo que se asignaba la fecha actual (hoy). Esto hacía que `fecha_vencimiento` (en el pasado) fuera menor que `fecha_ingreso` (hoy), lo cual es inválido.

---

## La Solución

Para crear lotes vencidos **válidos**, debemos proporcionar explícitamente una `fecha_ingreso` que sea **anterior** a la `fecha_vencimiento`:

```python
# Test corregido (✅ FUNCIONA)
lote_vencido = Lote(
    codigo_lote='LT-2024-009',
    cantidad_inicial=50,
    cantidad_actual=20,
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # ← Hace 100 días
    fecha_vencimiento=date.today() - timedelta(days=10),  # ← Hace 10 días
    precio_compra_lote=Decimal('8.00')
)
# fecha_ingreso (hace 100 días) < fecha_vencimiento (hace 10 días) < hoy
# ✅ Lote válido: ingresó hace 100 días, venció hace 10 días
```

**Lógica:**
1. El lote ingresó hace 100 días
2. Venció hace 10 días
3. Hoy está vencido (pero fue válido cuando ingresó)

---

## Tests Corregidos

### 1. **test_esta_vencido** - [línea 179-194](tests/unit/test_lote_model.py:179-194)

#### ANTES (Falla)
```python
lote_vencido = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-009',
    cantidad_inicial=50,
    cantidad_actual=20,
    fecha_vencimiento=date.today() - timedelta(days=10),  # ❌ Sin fecha_ingreso
    precio_compra_lote=Decimal('8.00')
)
```

#### DESPUÉS (Funciona)
```python
lote_vencido = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-009',
    cantidad_inicial=50,
    cantidad_actual=20,
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # ✅ Hace 100 días
    fecha_vencimiento=date.today() - timedelta(days=10),  # ✅ Hace 10 días
    precio_compra_lote=Decimal('8.00')
)
```

---

### 2. **test_esta_disponible** - [línea 359-370](tests/unit/test_lote_model.py:359-370)

#### ANTES (Falla)
```python
lote_vencido = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-020',
    cantidad_inicial=50,
    cantidad_actual=30,
    fecha_vencimiento=date.today() - timedelta(days=10),  # ❌ Sin fecha_ingreso
    precio_compra_lote=Decimal('8.00'),
    activo=True
)
```

#### DESPUÉS (Funciona)
```python
lote_vencido = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-020',
    cantidad_inicial=50,
    cantidad_actual=30,
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # ✅ Hace 100 días
    fecha_vencimiento=date.today() - timedelta(days=10),  # ✅ Hace 10 días
    precio_compra_lote=Decimal('8.00'),
    activo=True
)
```

---

### 3. **test_lotes_vencidos** - [línea 457-465](tests/unit/test_lote_model.py:457-465)

#### ANTES (Falla)
```python
lote_vencido = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-026',
    cantidad_inicial=50,
    cantidad_actual=20,
    fecha_vencimiento=date.today() - timedelta(days=30),  # ❌ Sin fecha_ingreso
    precio_compra_lote=Decimal('8.00')
)
```

#### DESPUÉS (Funciona)
```python
lote_vencido = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-026',
    cantidad_inicial=50,
    cantidad_actual=20,
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # ✅ Hace 100 días
    fecha_vencimiento=date.today() - timedelta(days=30),  # ✅ Hace 30 días
    precio_compra_lote=Decimal('8.00')
)
```

---

### 4. **test_estadisticas_por_producto** - [línea 637-646](tests/unit/test_lote_model.py:637-646)

#### ANTES (Falla)
```python
lote2 = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-036',
    cantidad_inicial=30,
    cantidad_actual=0,
    fecha_vencimiento=date.today() - timedelta(days=10),  # ❌ Sin fecha_ingreso
    precio_compra_lote=Decimal('8.50'),
    activo=False
)
```

#### DESPUÉS (Funciona)
```python
lote2 = Lote(
    producto_id=product.id,
    codigo_lote='LT-2024-036',
    cantidad_inicial=30,
    cantidad_actual=0,
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # ✅ Hace 100 días
    fecha_vencimiento=date.today() - timedelta(days=10),  # ✅ Hace 10 días
    precio_compra_lote=Decimal('8.50'),
    activo=False
)
```

---

## Patrón de Corrección

Para crear lotes vencidos en tests:

```python
# ✅ PATRÓN CORRECTO
lote_vencido = Lote(
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),  # Pasado remoto
    fecha_vencimiento=date.today() - timedelta(days=10),             # Pasado reciente
    # ...otros campos...
)

# ❌ PATRÓN INCORRECTO
lote_vencido = Lote(
    # fecha_ingreso no se proporciona → se asigna HOY
    fecha_vencimiento=date.today() - timedelta(days=10),  # Pasado
    # Error: vencimiento < ingreso
)
```

---

## Validación de Fechas: Lógica

La validación **NO** impide crear lotes vencidos. La validación **SÍ** impide crear lotes con fechas **ilógicas**:

| Caso | fecha_ingreso | fecha_vencimiento | Resultado |
|------|---------------|-------------------|-----------|
| ✅ Lote futuro | Hoy | Futuro | Válido |
| ✅ Lote vencido | Pasado remoto | Pasado reciente | Válido |
| ✅ Lote vencido | Pasado | Hoy | Válido |
| ❌ Lote inválido | Hoy | Pasado | ❌ Error |
| ❌ Lote inválido | Futuro | Pasado | ❌ Error |

**Regla:** `fecha_vencimiento` **SIEMPRE** debe ser posterior a `fecha_ingreso` (sin importar si hoy está vencido o no).

---

## Ejecución de Tests

```bash
# Tests del modelo Lote
pytest tests/unit/test_lote_model.py -v

# Tests del modelo Product
pytest tests/unit/test_product_model.py -v

# Todos los tests
pytest tests/unit/ -v
```

**Resultado:** ✅ **27 tests de Lote + 24 tests de Product = 51 tests pasando**

---

## Resumen de Cambios

| Test | Cambio Realizado |
|------|------------------|
| `test_esta_vencido` | ✅ Agregada `fecha_ingreso` explícita (hace 100 días) |
| `test_esta_disponible` | ✅ Agregada `fecha_ingreso` explícita (hace 100 días) |
| `test_lotes_vencidos` | ✅ Agregada `fecha_ingreso` explícita (hace 100 días) |
| `test_estadisticas_por_producto` | ✅ Agregada `fecha_ingreso` explícita (hace 100 días) |

---

## Estado Final

| Aspecto | Estado |
|---------|--------|
| Tests de Lote | ✅ 27/27 pasando |
| Tests de Product | ✅ 24/24 pasando |
| Validación de fechas | ✅ Funcionando correctamente |
| Lotes vencidos en tests | ✅ Creados correctamente |

---

## Lección Aprendida

### Problema

Cuando implementas validaciones automáticas en `__init__`, los tests que crean objetos con estados "especiales" (como lotes vencidos) pueden fallar.

### Solución

En los tests, **proporciona todos los campos necesarios** para que el objeto sea válido en el momento de creación, incluso si representa un estado "especial":

```python
# Para testear lotes vencidos, proporciona fecha_ingreso en el pasado
lote_vencido = Lote(
    fecha_ingreso=datetime.now(timezone.utc) - timedelta(days=100),
    fecha_vencimiento=date.today() - timedelta(days=10),
    # ...
)
```

### Conclusión

La validación es **correcta** y **no debe relajarse**. Los tests deben **adaptarse** para crear objetos válidos.

---

**🎉 TODOS LOS TESTS PASANDO**

El modelo Lote ahora tiene:
- ✅ Validaciones automáticas funcionando correctamente
- ✅ Tests adaptados para crear lotes vencidos válidos
- ✅ 27/27 tests pasando
- ✅ Código robusto y confiable

---

**KATITA-POS** - Sistema POS híbrido para minimarket
Modelo Lote - Tests de Lotes Vencidos Corregidos v1.0.5
