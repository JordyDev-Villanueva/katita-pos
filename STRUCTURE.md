# KATITA-POS - Estructura del Proyecto

## Árbol de Directorios

```
katita-pos/
│
├── app/                          # Aplicación principal
│   ├── __init__.py              # Application Factory (crea la app Flask)
│   │
│   ├── blueprints/              # Rutas/Endpoints de la API (módulos)
│   │   ├── __init__.py
│   │   ├── auth.py              # [TODO] Autenticación (login, register)
│   │   ├── products.py          # [TODO] Gestión de productos
│   │   ├── sales.py             # [TODO] Gestión de ventas
│   │   ├── categories.py        # [TODO] Gestión de categorías
│   │   └── users.py             # [TODO] Gestión de usuarios
│   │
│   ├── models/                  # Modelos de base de datos (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── user.py              # [TODO] Modelo de Usuario
│   │   ├── product.py           # [TODO] Modelo de Producto
│   │   ├── sale.py              # [TODO] Modelo de Venta
│   │   ├── category.py          # [TODO] Modelo de Categoría
│   │   └── base.py              # [TODO] Modelo base con campos comunes
│   │
│   ├── services/                # Lógica de negocio
│   │   ├── __init__.py
│   │   ├── auth_service.py      # [TODO] Lógica de autenticación
│   │   ├── product_service.py   # [TODO] Lógica de productos
│   │   ├── sale_service.py      # [TODO] Lógica de ventas
│   │   └── sync_service.py      # [TODO] Sincronización offline/online
│   │
│   └── utils/                   # Utilidades y helpers
│       ├── __init__.py
│       ├── validators.py        # [TODO] Validaciones personalizadas
│       ├── decorators.py        # [TODO] Decoradores (ej: @admin_required)
│       ├── helpers.py           # [TODO] Funciones auxiliares
│       └── responses.py         # [TODO] Formateadores de respuestas JSON
│
├── tests/                       # Tests del proyecto
│   ├── __init__.py
│   ├── conftest.py             # Configuración de pytest y fixtures
│   ├── test_app.py             # Tests de la aplicación principal
│   ├── unit/                   # Tests unitarios
│   │   └── [tests por módulo]
│   └── integration/            # Tests de integración
│       └── [tests de endpoints]
│
├── instance/                    # Datos locales (no versionado en git)
│   └── katita_local.db         # Base de datos SQLite local
│
├── logs/                        # Archivos de log (no versionado en git)
│   └── katita-pos.log          # Log de la aplicación
│
├── venv/                        # Entorno virtual Python (no versionado)
│
├── .env                         # Variables de entorno (no versionado)
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore                   # Archivos ignorados por git
├── commands.md                  # Comandos útiles de desarrollo
├── config.py                    # Configuraciones de entornos
├── README.md                    # Documentación principal
├── requirements.txt             # Dependencias de Python
├── run.py                       # Punto de entrada de la aplicación
├── setup.py                     # Script de configuración inicial
└── STRUCTURE.md                 # Este archivo
```

## Descripción de Componentes

### 📁 `app/` - Aplicación Principal

**`__init__.py`** (Application Factory)
- Crea y configura la aplicación Flask
- Inicializa extensiones (SQLAlchemy, JWT, CORS)
- Registra blueprints y error handlers
- Configura logging
- Patrón: Factory Pattern para permitir múltiples instancias

### 📁 `app/blueprints/` - Rutas de la API

Los **blueprints** son módulos que agrupan rutas relacionadas. Permiten organizar la API de forma modular.

Cada blueprint maneja un recurso específico:
- `auth.py`: Login, registro, refresh tokens
- `products.py`: CRUD de productos
- `sales.py`: Registro de ventas
- `categories.py`: Gestión de categorías
- `users.py`: Administración de usuarios

**Ejemplo de estructura de un blueprint:**
```python
from flask import Blueprint, request, jsonify

products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
def get_products():
    # Lógica aquí
    return jsonify(products)
```

### 📁 `app/models/` - Modelos de Base de Datos

Los **modelos** definen la estructura de las tablas usando SQLAlchemy ORM.

Cada modelo representa una tabla:
- `user.py`: Usuarios del sistema
- `product.py`: Productos del inventario
- `sale.py`: Registro de ventas
- `category.py`: Categorías de productos

**Ejemplo de modelo:**
```python
from app import db

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
```

### 📁 `app/services/` - Lógica de Negocio

Los **servicios** contienen la lógica de negocio, separada de las rutas.

Ventajas:
- Reutilización de código
- Fácil testing
- Separación de responsabilidades
- Código más limpio

**Ejemplo:**
```python
class ProductService:
    @staticmethod
    def create_product(data):
        # Validaciones
        # Crear producto
        # Guardar en BD
        return product
```

### 📁 `app/utils/` - Utilidades

Funciones auxiliares que se usan en toda la aplicación:
- `validators.py`: Validación de datos
- `decorators.py`: Decoradores personalizados
- `helpers.py`: Funciones auxiliares
- `responses.py`: Formateo de respuestas

### 📁 `tests/` - Testing

**`conftest.py`**: Configuración global de pytest
- Fixtures compartidos
- Configuración de la app de testing
- Cliente de pruebas

**`unit/`**: Tests unitarios (funciones individuales)
**`integration/`**: Tests de integración (endpoints completos)

### 📄 Archivos de Configuración

**`config.py`**
- Clase `Config`: Configuración base
- `DevelopmentConfig`: Para desarrollo (SQLite)
- `ProductionConfig`: Para producción (PostgreSQL)
- `TestingConfig`: Para testing (SQLite en memoria)

**`.env`**
- Variables de entorno secretas
- Configuración de base de datos
- Claves JWT
- NO se versiona en git

**`requirements.txt`**
- Lista de dependencias de Python
- Instalación: `pip install -r requirements.txt`

**`run.py`**
- Punto de entrada de la aplicación
- Ejecuta el servidor Flask

## Flujo de una Request

```
1. Cliente hace HTTP Request
   ↓
2. Flask recibe la request
   ↓
3. CORS valida el origen
   ↓
4. Blueprint maneja la ruta
   ↓
5. JWT valida el token (si requiere auth)
   ↓
6. Service ejecuta la lógica de negocio
   ↓
7. Model interactúa con la base de datos
   ↓
8. Service procesa los datos
   ↓
9. Blueprint formatea la respuesta
   ↓
10. Flask envía HTTP Response
```

## Próximos Pasos de Desarrollo

1. ✅ Setup inicial del proyecto
2. ⏳ Crear modelos de base de datos
3. ⏳ Implementar autenticación (JWT)
4. ⏳ Crear blueprint de productos
5. ⏳ Crear blueprint de ventas
6. ⏳ Implementar sincronización offline/online
7. ⏳ Desarrollar frontend React
8. ⏳ Integrar con Supabase (PostgreSQL)
9. ⏳ Testing completo
10. ⏳ Deployment

## Convenciones de Código

- **Naming**: snake_case para funciones y variables
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Docstrings**: Formato Google/NumPy
- **Imports**: Ordenados (stdlib, third-party, local)
- **Line length**: Max 100 caracteres
- **Testing**: Nombres de tests empiezan con `test_`

## Arquitectura Offline-First

```
┌─────────────────────────────────────┐
│         Cliente (Frontend)          │
└─────────────┬───────────────────────┘
              │
              ├─ Online ──────────────┐
              │                       │
              ▼                       ▼
┌──────────────────────┐   ┌──────────────────┐
│  Backend API (Flask) │◄─►│  PostgreSQL      │
│  SQLite (Offline)    │   │  (Supabase)      │
└──────────────────────┘   └──────────────────┘
       │                            │
       └────── Sincronización ──────┘
           (cuando hay conexión)
```

---

**KATITA-POS** - Sistema POS híbrido para minimarket
