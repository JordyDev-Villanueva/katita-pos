# KATITA-POS

Sistema POS (Point of Sale) híbrido para minimarket con arquitectura offline-first.

## Descripción

KATITA-POS es un sistema de punto de venta diseñado para minimarkets que permite operar sin conexión a internet, sincronizando automáticamente los datos cuando hay conectividad disponible. Utiliza una arquitectura híbrida con SQLite local para operaciones offline y PostgreSQL en la nube (Supabase) para sincronización y respaldo.

## Características Principales

- **Operación Offline-First**: Funciona sin conexión a internet usando SQLite local
- **Sincronización Automática**: Sincroniza datos con PostgreSQL en la nube cuando hay conectividad
- **Gestión de Productos**: Control de inventario y catálogo de productos
- **Ventas y Facturación**: Registro de ventas y generación de comprobantes
- **Autenticación Segura**: Sistema de usuarios con JWT
- **API RESTful**: Backend modular y escalable con Flask

## Stack Tecnológico

### Backend
- **Python**: 3.12.3
- **Framework**: Flask 3.0.0
- **ORM**: SQLAlchemy 2.0.23
- **Base de Datos Local**: SQLite
- **Base de Datos Cloud**: PostgreSQL (Supabase)
- **Autenticación**: JWT (Flask-JWT-Extended)
- **Testing**: Pytest

### Arquitectura
- **Patrón**: Application Factory
- **Estructura**: Modular con Blueprints
- **API**: RESTful
- **Modo**: Offline-first con sincronización

## Requisitos Previos

- Python 3.12.3 o superior
- pip (gestor de paquetes de Python)
- Cuenta en Supabase (para PostgreSQL cloud) - opcional para desarrollo

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/katita-pos.git
cd katita-pos
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/MacOS
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
- `SECRET_KEY`: Clave secreta para Flask
- `JWT_SECRET_KEY`: Clave secreta para JWT
- `DATABASE_MODE`: `local` para SQLite o `cloud` para PostgreSQL
- Configuración de PostgreSQL si usas modo cloud

### 5. Inicializar la base de datos

```bash
python run.py
```

## Estructura del Proyecto

```
katita-pos/
├── app/
│   ├── __init__.py          # Application Factory
│   ├── blueprints/          # Módulos de la API (rutas)
│   ├── models/              # Modelos de base de datos
│   ├── services/            # Lógica de negocio
│   └── utils/               # Utilidades y helpers
├── tests/
│   ├── unit/                # Tests unitarios
│   └── integration/         # Tests de integración
├── instance/                # Datos de SQLite (no versionado)
├── logs/                    # Archivos de log (no versionado)
├── config.py                # Configuraciones de entornos
├── requirements.txt         # Dependencias de Python
├── .env.example             # Ejemplo de variables de entorno
├── .gitignore              # Archivos ignorados por Git
└── README.md               # Este archivo
```

## Uso

### Modo Desarrollo

```bash
# Asegúrate de que .env tenga FLASK_ENV=development
python run.py
```

El servidor estará disponible en `http://localhost:5000`

### Ejecutar Tests

```bash
# Todos los tests
pytest

# Con cobertura
pytest --cov=app tests/

# Tests específicos
pytest tests/unit/
pytest tests/integration/
```

## Endpoints API

### Health Check
```
GET /health
```

### Autenticación (Próximamente)
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Productos (Próximamente)
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

## Configuración de Base de Datos

### Modo Local (SQLite)
```env
DATABASE_MODE=local
```
Los datos se guardan en `instance/katita_local.db`

### Modo Cloud (PostgreSQL)
```env
DATABASE_MODE=cloud
POSTGRES_DATABASE_URI=postgresql://user:password@host:5432/database
```

## Desarrollo

### Convenciones de Código
- Seguir PEP 8
- Usar Black para formateo
- Documentar funciones con docstrings
- Escribir tests para nuevas funcionalidades

### Agregar un Blueprint

1. Crear archivo en `app/blueprints/`
2. Definir el blueprint
3. Registrarlo en `app/__init__.py` en la función `register_blueprints()`

## Contribución

Este es un proyecto portfolio personal. Si tienes sugerencias o encuentras bugs, siéntete libre de abrir un issue.

## Licencia

Proyecto de portfolio personal - Todos los derechos reservados

## Autor

**Tu Nombre**
- Portfolio: [tu-portfolio.com](https://tu-portfolio.com)
- LinkedIn: [tu-linkedin](https://linkedin.com/in/tu-perfil)
- GitHub: [@tu-usuario](https://github.com/tu-usuario)

## Estado del Proyecto

🚧 **En Desarrollo** - Fase: Setup Inicial Backend

---

**KATITA-POS** - Sistema POS híbrido para minimarket
