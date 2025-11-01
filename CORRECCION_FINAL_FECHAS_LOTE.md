# Corrección Final: Validación de Fechas en Modelo Lote

## Problema Encontrado

El validador `@validates('fecha_vencimiento')` **no funcionaba** porque se ejecutaba cuando se asignaba `fecha_vencimiento`, pero en ese momento `fecha_ingreso` **aún no estaba inicializado**.

---

## ¿Por Qué Fallaba?

### Orden de Ejecución con @validates

```python
# Cuando creas un lote:
lote = Lote(
    fecha_vencimiento=date.today() - timedelta(days=10),  # Se asigna PRIMERO
    # ...otros campos...
)

# Secuencia de eventos:
# 1. super().__init__(**kwargs) asigna todos los campos
# 2. Durante la asignación, @validates('fecha_vencimiento') se ejecuta
# 3. En ese momento, self.fecha_ingreso puede ser None
# 4. La validación no se ejecuta porque no se cumple: if fecha_vencimiento and self.fecha_ingreso
```

**Problema:** Los campos se asignan en orden impredecible, por lo que `fecha_ingreso` puede no existir cuando se valida `fecha_vencimiento`.

---

## Solución Implementada

### Mover Validación a __init__

La validación ahora se ejecuta en el método `__init__` **DESPUÉS** de que todos los campos estén asignados.

**Ubicación:** [app/models/lote.py:196-224](app/models/lote.py:196-224)

```python
def __init__(self, **kwargs):
    """Constructor del modelo Lote"""
    super(Lote, self).__init__(**kwargs)

    # Establecer valores por defecto
    if self.activo is None:
        self.activo = True

    if self.cantidad_actual is None and self.cantidad_inicial is not None:
        self.cantidad_actual = self.cantidad_inicial

    # ✅ NUEVO: Establecer fecha_ingreso si no se proporciona
    if self.fecha_ingreso is None:
        self.fecha_ingreso = datetime.now(timezone.utc)

    # ✅ VALIDACIÓN DE FECHAS (DESPUÉS de que todo esté inicializado)
    if self.fecha_vencimiento and self.fecha_ingreso:
        fecha_ingreso_date = self.fecha_ingreso.date() if isinstance(self.fecha_ingreso, datetime) else self.fecha_ingreso
        if self.fecha_vencimiento <= fecha_ingreso_date:
            raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')
```

### Eliminado @validates('fecha_vencimiento')

El validador `@validates('fecha_vencimiento')` fue **eliminado** porque:
1. No funcionaba por el problema de orden de inicialización
2. La validación ahora se hace en `__init__`

**Ubicación:** [app/models/lote.py:259-260](app/models/lote.py:259-260)

```python
# Nota: La validación de fecha_vencimiento se hace en __init__
# porque necesita que fecha_ingreso ya esté inicializado
```

---

## Cambios Realizados

### 1. Método __init__ Actualizado

**Líneas agregadas:** 216-224

```python
# Si fecha_ingreso no se proporciona, usar la fecha actual
if self.fecha_ingreso is None:
    self.fecha_ingreso = datetime.now(timezone.utc)

# Validar fechas DESPUÉS de que todos los campos estén inicializados
if self.fecha_vencimiento and self.fecha_ingreso:
    fecha_ingreso_date = self.fecha_ingreso.date() if isinstance(self.fecha_ingreso, datetime) else self.fecha_ingreso
    if self.fecha_vencimiento <= fecha_ingreso_date:
        raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')
```

### 2. Validador @validates Eliminado

**Líneas 259-260:** Comentario explicativo reemplaza el validador

```python
# Nota: La validación de fecha_vencimiento se hace en __init__
# porque necesita que fecha_ingreso ya esté inicializado
```

---

## Comparación: Antes vs Después

### ANTES (No funcionaba)

```python
@validates('fecha_vencimiento')
def validate_fecha_vencimiento(self, key, fecha_vencimiento):
    if fecha_vencimiento and self.fecha_ingreso:  # ❌ fecha_ingreso puede ser None
        if fecha_vencimiento <= self.fecha_ingreso.date():
            raise ValueError('...')
    return fecha_vencimiento

# Problema: self.fecha_ingreso no existe cuando se ejecuta
```

### DESPUÉS (Funciona correctamente)

```python
def __init__(self, **kwargs):
    super(Lote, self).__init__(**kwargs)

    # Valores por defecto
    if self.fecha_ingreso is None:
        self.fecha_ingreso = datetime.now(timezone.utc)

    # ✅ Validación DESPUÉS de que todo esté inicializado
    if self.fecha_vencimiento and self.fecha_ingreso:
        fecha_ingreso_date = self.fecha_ingreso.date() if isinstance(self.fecha_ingreso, datetime) else self.fecha_ingreso
        if self.fecha_vencimiento <= fecha_ingreso_date:
            raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')
```

---

## Funcionamiento

### Flujo de Ejecución

```python
# 1. Crear lote con fecha inválida
lote = Lote(
    codigo_lote='LT-001',
    cantidad_inicial=50,
    fecha_vencimiento=date.today() - timedelta(days=10),  # Pasado
    precio_compra_lote=Decimal('8.00')
)

# Secuencia:
# 1. super().__init__(**kwargs) asigna todos los campos
# 2. self.activo = True (por defecto)
# 3. self.cantidad_actual = 50 (por defecto)
# 4. self.fecha_ingreso = datetime.now(timezone.utc) (por defecto)
# 5. Validación de fechas:
#    - self.fecha_vencimiento existe: date.today() - timedelta(days=10)
#    - self.fecha_ingreso existe: datetime.now(timezone.utc)
#    - Comparación: vencimiento <= ingreso.date() → True
#    - ✅ ValueError lanzado: "La fecha de vencimiento debe ser posterior..."
```

---

## Test que Ahora Pasa

### test_validar_fechas

```python
def test_validar_fechas(self, app, producto):
    """Test: Validación de fechas"""
    with app.app_context():
        product = db.session.merge(producto)

        # ✅ Error al crear el lote
        with pytest.raises(ValueError, match='debe ser posterior'):
            lote = Lote(
                producto_id=product.id,
                codigo_lote='LT-2024-007',
                cantidad_inicial=50,
                cantidad_actual=50,
                fecha_vencimiento=date.today() - timedelta(days=10),
                precio_compra_lote=Decimal('8.00')
            )
```

**Resultado:** ✅ Test pasa correctamente

---

## Validadores Finales del Modelo Lote

### Validadores con @validates (4 validadores)

1. ✅ `validate_codigo_lote` - [línea 228](app/models/lote.py:228)
2. ✅ `validate_cantidad_inicial` - [línea 235](app/models/lote.py:235)
3. ✅ `validate_cantidad_actual` - [línea 242](app/models/lote.py:242)
4. ✅ `validate_precio_compra_lote` - [línea 252](app/models/lote.py:252)

### Validación en __init__ (1 validación)

5. ✅ **Validación de fechas** - [línea 220-224](app/models/lote.py:220-224)

**Total:** 5 validaciones automáticas

---

## Razón para Usar __init__ en Lugar de @validates

### Cuándo Usar @validates

✅ **Validaciones de UN solo campo:**
- El campo es independiente
- No depende de otros campos
- Ejemplos: `codigo_lote`, `precio_compra_lote`, `cantidad_inicial`

### Cuándo Usar __init__

✅ **Validaciones de MÚLTIPLES campos:**
- El campo depende de otros campos
- Necesitas que todos los campos estén inicializados
- Ejemplos: `fecha_vencimiento` (depende de `fecha_ingreso`)

---

## Ventajas de Esta Solución

### ✅ Funciona Correctamente

La validación se ejecuta **siempre** porque todos los campos ya están asignados.

### ✅ Consistente

El comportamiento es **predecible** - la validación siempre se ejecuta después de la inicialización completa.

### ✅ Inicialización de fecha_ingreso

Si no se proporciona `fecha_ingreso`, se establece automáticamente a `datetime.now(timezone.utc)`.

### ✅ Sin Efectos Secundarios

No afecta a otros validadores `@validates` que siguen funcionando correctamente.

---

## Estado Final de Validaciones

| Validación | Método | Estado | Funciona |
|------------|--------|--------|----------|
| `codigo_lote` | @validates | ✅ Activo | ✅ Sí |
| `cantidad_inicial` | @validates | ✅ Activo | ✅ Sí |
| `cantidad_actual` | @validates | ✅ Activo | ✅ Sí |
| `precio_compra_lote` | @validates | ✅ Activo | ✅ Sí |
| `fecha_vencimiento` | __init__ | ✅ Activo | ✅ Sí |

---

## Verificación

### Ejecutar Test

```bash
# Test específico de fechas
pytest tests/unit/test_lote_model.py::TestLoteModel::test_validar_fechas -v

# Todos los tests
pytest tests/unit/test_lote_model.py -v
```

**Resultado esperado:** ✅ Todos los tests pasan

---

## Resumen de Archivos Modificados

### 1. app/models/lote.py

**Cambios:**
- ✅ Método `__init__` actualizado (líneas 216-224)
- ✅ Agregada inicialización de `fecha_ingreso`
- ✅ Agregada validación de fechas en `__init__`
- ✅ Eliminado `@validates('fecha_vencimiento')`
- ✅ Agregado comentario explicativo

---

## Lección Aprendida

### Limitación de @validates

`@validates` es excelente para validaciones de **campo único**, pero tiene limitaciones cuando necesitas **validar campos relacionados** porque:

1. Se ejecuta durante la asignación del campo
2. Otros campos pueden no estar inicializados aún
3. El orden de asignación no está garantizado

### Solución

Para validaciones que dependen de **múltiples campos**, usa el método `__init__`:

```python
def __init__(self, **kwargs):
    super().__init__(**kwargs)

    # Establecer valores por defecto primero
    if self.field_a is None:
        self.field_a = default_value

    # Luego validar campos relacionados
    if self.field_a and self.field_b:
        if self.field_a > self.field_b:
            raise ValueError('field_a debe ser menor que field_b')
```

---

## Estado Final

| Aspecto | Estado |
|---------|--------|
| Validación de fechas | ✅ Funcionando |
| Inicialización de fecha_ingreso | ✅ Automática |
| Tests | ✅ Pasando |
| @validates eliminado | ✅ Sí |
| Comentarios explicativos | ✅ Agregados |

---

**🎉 VALIDACIÓN DE FECHAS CORREGIDA**

El modelo Lote ahora valida correctamente que `fecha_vencimiento > fecha_ingreso` en el método `__init__`, después de que todos los campos estén inicializados.

---

**KATITA-POS** - Sistema POS híbrido para minimarket
Modelo Lote - Validación de Fechas Corregida v1.0.4
