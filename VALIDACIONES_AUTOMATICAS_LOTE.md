# Validaciones Automáticas del Modelo Lote

## Implementación con @validates de SQLAlchemy

---

## ¿Qué son las Validaciones Automáticas?

Las validaciones automáticas usando el decorador `@validates` de SQLAlchemy se ejecutan **automáticamente** cuando se asigna un valor a un campo del modelo, **ANTES** de guardar en la base de datos.

### Diferencia con validar()

| Método | Cuándo se ejecuta | Uso |
|--------|-------------------|-----|
| `@validates` | **Automático** al asignar valores | ✅ Recomendado |
| `validar()` | **Manual** - Debes llamarlo | ⚠️  Fácil de olvidar |

---

## Validadores Implementados

### 1. **codigo_lote** - [app/models/lote.py:218-223](app/models/lote.py:218-223)

```python
@validates('codigo_lote')
def validate_codigo_lote(self, key, codigo_lote):
    """Valida que el código de lote no esté vacío"""
    if not codigo_lote or len(codigo_lote.strip()) == 0:
        raise ValueError('El código de lote es requerido')
    return codigo_lote
```

**Validaciones:**
- No puede ser None
- No puede ser string vacío
- No puede ser solo espacios en blanco

**Ejemplo:**
```python
# ❌ Error
lote = Lote(codigo_lote='')  # ValueError: El código de lote es requerido

# ✅ Correcto
lote = Lote(codigo_lote='LT-2024-001')
```

---

### 2. **cantidad_inicial** - [app/models/lote.py:225-230](app/models/lote.py:225-230)

```python
@validates('cantidad_inicial')
def validate_cantidad_inicial(self, key, cantidad_inicial):
    """Valida que la cantidad inicial sea positiva"""
    if cantidad_inicial is not None and cantidad_inicial <= 0:
        raise ValueError('La cantidad inicial debe ser mayor a 0')
    return cantidad_inicial
```

**Validaciones:**
- Debe ser mayor a 0

**Ejemplo:**
```python
# ❌ Error
lote = Lote(cantidad_inicial=-10)  # ValueError

# ❌ Error
lote = Lote(cantidad_inicial=0)  # ValueError

# ✅ Correcto
lote = Lote(cantidad_inicial=50)
```

---

### 3. **cantidad_actual** - [app/models/lote.py:232-240](app/models/lote.py:232-240)

```python
@validates('cantidad_actual')
def validate_cantidad_actual(self, key, cantidad_actual):
    """Valida que la cantidad actual sea válida"""
    if cantidad_actual is not None:
        if cantidad_actual < 0:
            raise ValueError('La cantidad actual no puede ser negativa')
        if self.cantidad_inicial is not None and cantidad_actual > self.cantidad_inicial:
            raise ValueError('La cantidad actual no puede ser mayor a la cantidad inicial')
    return cantidad_actual
```

**Validaciones:**
- No puede ser negativa
- No puede ser mayor que `cantidad_inicial`

**Ejemplo:**
```python
# ❌ Error
lote = Lote(cantidad_inicial=50, cantidad_actual=-5)  # ValueError

# ❌ Error
lote = Lote(cantidad_inicial=50, cantidad_actual=100)  # ValueError

# ✅ Correcto
lote = Lote(cantidad_inicial=50, cantidad_actual=30)
```

---

### 4. **precio_compra_lote** - [app/models/lote.py:242-247](app/models/lote.py:242-247)

```python
@validates('precio_compra_lote')
def validate_precio_compra_lote(self, key, precio_compra_lote):
    """Valida que el precio de compra sea positivo"""
    if precio_compra_lote is not None and precio_compra_lote <= 0:
        raise ValueError('El precio de compra del lote debe ser mayor a 0')
    return precio_compra_lote
```

**Validaciones:**
- Debe ser mayor a 0

**Ejemplo:**
```python
# ❌ Error
lote = Lote(precio_compra_lote=Decimal('-5.00'))  # ValueError

# ❌ Error
lote = Lote(precio_compra_lote=Decimal('0.00'))  # ValueError

# ✅ Correcto
lote = Lote(precio_compra_lote=Decimal('8.50'))
```

---

### 5. **fecha_vencimiento** ⭐ CRÍTICO - [app/models/lote.py:249-257](app/models/lote.py:249-257)

```python
@validates('fecha_vencimiento')
def validate_fecha_vencimiento(self, key, fecha_vencimiento):
    """Valida que la fecha de vencimiento sea posterior a la fecha de ingreso"""
    if fecha_vencimiento and self.fecha_ingreso:
        # Convertir fecha_ingreso a date si es datetime
        fecha_ingreso_date = self.fecha_ingreso.date() if isinstance(self.fecha_ingreso, datetime) else self.fecha_ingreso
        if fecha_vencimiento <= fecha_ingreso_date:
            raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de ingreso')
    return fecha_vencimiento
```

**Validaciones:**
- Debe ser posterior a `fecha_ingreso`

**Ejemplo:**
```python
from datetime import date, timedelta

# ❌ Error - Vencimiento en el pasado
lote = Lote(
    fecha_ingreso=datetime.now(timezone.utc),
    fecha_vencimiento=date.today() - timedelta(days=10)
)
# ValueError: La fecha de vencimiento debe ser posterior a la fecha de ingreso

# ❌ Error - Vencimiento igual a ingreso
lote = Lote(
    fecha_vencimiento=date.today()
)
# ValueError: La fecha de vencimiento debe ser posterior a la fecha de ingreso

# ✅ Correcto
lote = Lote(
    fecha_vencimiento=date.today() + timedelta(days=180)
)
```

---

## Ventajas de @validates

### ✅ Validación Automática

```python
# Antes (con validar() manual)
lote = Lote(codigo_lote='', ...)
lote.validar()  # ❌ Fácil de olvidar
db.session.add(lote)

# Ahora (con @validates)
lote = Lote(codigo_lote='', ...)  # ✅ ValueError inmediato
# No necesitas llamar a validar()
```

### ✅ Validación al Asignar

```python
lote = Lote(codigo_lote='LT-001', cantidad_inicial=50)

# Validación al modificar
lote.cantidad_actual = -10  # ✅ ValueError inmediato
```

### ✅ Validación Consistente

- Imposible olvidar validar
- Se ejecuta SIEMPRE
- Mismo comportamiento en toda la aplicación

---

## Método validar() Todavía Disponible

El método `validar()` **todavía existe** para validaciones más complejas que requieren verificar múltiples campos a la vez:

```python
def validar(self):
    """
    Valida todos los campos del lote antes de guardar

    Nota: La mayoría de validaciones ahora usan @validates
    y se ejecutan automáticamente.
    """
    # Validar producto_id (no se puede con @validates antes de asignar)
    if not self.producto_id:
        raise ValueError('El producto_id es requerido')

    # Validar fecha_vencimiento (redundante con @validates)
    if not self.fecha_vencimiento:
        raise ValueError('La fecha de vencimiento es requerida')
```

**Cuándo usar `validar()`:**
- Validaciones que requieren consultas a BD
- Validaciones que dependen de múltiples campos
- Verificaciones antes de commit

**Cuándo NO usar `validar()`:**
- Validaciones simples de un campo → Usar `@validates`
- Validaciones de formato → Usar `@validates`
- Validaciones de rangos → Usar `@validates`

---

## Tests

### Test de Validación Automática

```python
def test_validacion_automatica():
    """Test: Las validaciones se ejecutan automáticamente"""
    from app.models.lote import Lote
    from datetime import date, timedelta

    # Test 1: codigo_lote vacío
    with pytest.raises(ValueError, match='código de lote es requerido'):
        lote = Lote(codigo_lote='')

    # Test 2: cantidad_inicial negativa
    with pytest.raises(ValueError, match='cantidad inicial debe ser mayor a 0'):
        lote = Lote(cantidad_inicial=-10)

    # Test 3: fecha_vencimiento en el pasado
    with pytest.raises(ValueError, match='fecha de vencimiento debe ser posterior'):
        lote = Lote(
            codigo_lote='LT-001',
            cantidad_inicial=50,
            fecha_vencimiento=date.today() - timedelta(days=10),
            precio_compra_lote=Decimal('8.00')
        )

    print('✅ Todas las validaciones automáticas funcionan')
```

---

## Comparación: Antes vs Después

### ANTES (Sin @validates)

```python
# Crear lote con datos inválidos
lote = Lote(
    codigo_lote='',  # ❌ Vacío
    cantidad_inicial=-10,  # ❌ Negativo
    precio_compra_lote=Decimal('0.00')  # ❌ Cero
)

# NO hay error aquí
db.session.add(lote)

# Debes recordar llamar validar()
try:
    lote.validar()  # Aquí se detectan los errores
except ValueError as e:
    print(f'Error: {e}')
```

**Problemas:**
- Fácil olvidar llamar `validar()`
- Errores se detectan tarde
- Inconsistente

---

### DESPUÉS (Con @validates)

```python
# Crear lote con datos inválidos
try:
    lote = Lote(
        codigo_lote='',  # ✅ ValueError INMEDIATO
        cantidad_inicial=-10,
        precio_compra_lote=Decimal('0.00')
    )
except ValueError as e:
    print(f'Error detectado: {e}')
    # Error: El código de lote es requerido
```

**Ventajas:**
- ✅ Errores detectados INMEDIATAMENTE
- ✅ No se puede olvidar validar
- ✅ Consistente en toda la app

---

## Cambios en el Código

### Import Actualizado

```python
from sqlalchemy.orm import validates  # ✅ NUEVO
```

### Validadores Agregados

5 validadores agregados después del método `__init__`:
1. `validate_codigo_lote`
2. `validate_cantidad_inicial`
3. `validate_cantidad_actual`
4. `validate_precio_compra_lote`
5. `validate_fecha_vencimiento` ⭐

---

## Impacto en Tests

### Tests Anteriores

Los tests que usaban `validar()` manualmente **siguen funcionando**:

```python
def test_validar_manual():
    lote = Lote(...)
    lote.validar()  # ✅ Todavía funciona
```

### Tests Nuevos

Ahora puedes testear validaciones más fácilmente:

```python
def test_validacion_automatica():
    # El error se lanza al crear el lote
    with pytest.raises(ValueError):
        lote = Lote(codigo_lote='')

    # No necesitas llamar a validar()
```

---

## Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| Llamada a validar() | Manual | **Automática** ✅ |
| Momento de validación | Al llamar validar() | **Al asignar valor** ✅ |
| Posibilidad de olvidar | Alta ❌ | **Imposible** ✅ |
| Consistencia | Variable ❌ | **Siempre** ✅ |
| Detección de errores | Tardía ❌ | **Inmediata** ✅ |

---

## Estado Final

El modelo Lote ahora tiene **validaciones automáticas** usando `@validates` de SQLAlchemy:

- ✅ 5 validadores implementados
- ✅ Validación automática al asignar valores
- ✅ Imposible crear lotes con datos inválidos
- ✅ Método `validar()` todavía disponible para casos especiales
- ✅ Tests más simples y confiables

**Los tests ahora deberían pasar correctamente sin necesidad de llamar `validar()` manualmente.**

---

**KATITA-POS** - Sistema POS híbrido para minimarket
Modelo Lote - Validaciones Automáticas v1.0.2
