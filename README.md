# 🛒 KATITA-POS

**Sistema de Punto de Venta Profesional para Minimarkets**

> Sistema de punto de venta **production-ready** diseñado para minimarkets peruanos. Probado con **300-350 ventas diarias** | Sistema FIFO automático | Reportes PDF profesionales con gráficos

### 🎯 Highlights

- 🚀 **Deployed & Live**: Backend en Railway, Frontend en Vercel - [Ver demo](https://katita-pos.vercel.app)
- 💰 **Payment Methods**: Efectivo, Yape, Plin, Transferencia (métodos peruanos)
- 📊 **Advanced Reports**: Exportación PDF/Excel con gráficos matplotlib y logo corporativo
- 🔄 **FIFO Automation**: Control automático de fechas de vencimiento para reducir mermas
- 🔐 **JWT Auth**: Sistema de autenticación con roles (Admin/Vendedor) y bcrypt
- 📦 **Batch Tracking**: Trazabilidad completa - cada venta sabe de qué lote salió
- ✅ **Production Tested**: Soporta 500+ productos, 1000+ lotes activos, 5+ usuarios concurrentes

[![Python](https://img.shields.io/badge/Python-3.12.3-blue?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green?logo=flask)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646cff?logo=vite)](https://vitejs.dev/)
[![Deploy Backend](https://img.shields.io/badge/Backend-Railway-blueviolet?logo=railway)](https://katita-pos-production.up.railway.app)
[![Database](https://img.shields.io/badge/Database-Supabase-green?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](https://github.com/JordyDev-Villanueva/katita-pos/pulls)

---

## 🎯 Demo en Vivo

**🌐 Aplicación:** [https://katita-pos.vercel.app](https://katita-pos.vercel.app)

**Credenciales de prueba:**
- Usuario: `admin` | Contraseña: `admin123`
- Usuario: `vendedor1` | Contraseña: `vendedor123`

**Backend API:** [https://katita-pos-production.up.railway.app](https://katita-pos-production.up.railway.app)

---

## 📸 Screenshots

### 🔐 Login & Dashboard

<div align="center">

| Login | Dashboard Superior |
|:---:|:---:|
| ![Login](docs/screenshots/01-login.png) | ![Dashboard Top](docs/screenshots/02-dashboard-top.png) |

| Dashboard - Gráficos y Analytics |
|:---:|
| ![Dashboard Bottom](docs/screenshots/03-dashboard-bottom.png) |

</div>

### 🛒 Punto de Venta (POS)

<div align="center">

| Interfaz Principal | Métodos de Pago | Pago en Efectivo |
|:---:|:---:|:---:|
| ![POS](docs/screenshots/04-pos.png) | ![Pago](docs/screenshots/05-pos-pago.png) | ![Efectivo](docs/screenshots/06-pos-efectivo.png) |

</div>

### 📊 Reportes & Analytics

<div align="center">

| Reportes - Sección Superior | Reportes - Gráficos |
|:---:|:---:|
| ![Reportes Top](docs/screenshots/07-reportes.png) | ![Reportes Bottom](docs/screenshots/08-reportes-bottom.png) |

</div>

### 💰 Cuadro de Caja

<div align="center">

| Gestión de Caja | Abrir Turno | Historial |
|:---:|:---:|:---:|
| ![Cuadro Caja](docs/screenshots/09-cuadro-caja.png) | ![Abrir Caja](docs/screenshots/10-cuadro-caja-abrir.png) | ![Historial](docs/screenshots/11-cuadro-caja-historial.png) |

</div>

### 📦 Gestión de Inventario

<div align="center">

| Lotes FIFO | Productos |
|:---:|:---:|
| ![Lotes](docs/screenshots/12-lotes.png) | ![Productos](docs/screenshots/13-productos.png) |

</div>

### 📄 Reportes PDF Profesionales

<div align="center">

| Página 1 - Header con Logo | Página 2 - Gráficos | Página 3 - Detalles |
|:---:|:---:|:---:|
| ![PDF Page 1](docs/screenshots/14-pdf-page1.png) | ![PDF Page 2](docs/screenshots/15-pdf-page2.png) | ![PDF Page 3](docs/screenshots/16-pdf-page3.png) |

</div>

---

## 📋 Características Principales

### 🏪 **Punto de Venta (POS)**
- ✅ Búsqueda inteligente de productos (manual + código de barras)
- ✅ Carrito responsive con modal móvil profesional
- ✅ Métodos de pago peruanos (Efectivo, Yape, Plin, Transferencia)
- ✅ Cálculo automático de cambio
- ✅ Sistema FIFO automático (primero que vence, primero que sale)

### 📦 **Gestión de Inventario**
- ✅ Control de productos con categorías
- ✅ Sistema de lotes con fechas de vencimiento
- ✅ Alertas automáticas de productos próximos a vencer
- ✅ Trazabilidad completa (cada venta sabe de qué lote salió)
- ✅ Actualización automática de stock

### 📊 **Reportes y Analytics**
- ✅ Dashboard con métricas en tiempo real
- ✅ Reportes de ventas con filtros avanzados
- ✅ Exportación a PDF y Excel
- ✅ Gráficos interactivos (Recharts)
- ✅ Top 10 productos más vendidos

### 🔐 **Seguridad**
- ✅ Autenticación JWT
- ✅ Roles (Admin, Vendedor)
- ✅ Passwords hasheados con Bcrypt
- ✅ Protección CORS

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

## 👨‍💻 Autor

**Jordy Villanueva**
- GitHub: [@JordyDev-Villanueva](https://github.com/JordyDev-Villanueva)

---

## 📊 Capacidad del Sistema

**Probado para:**
- ✅ 300-350 ventas diarias
- ✅ 500+ productos en catálogo
- ✅ 1000+ lotes activos
- ✅ 5+ usuarios concurrentes

---

## 🌐 Deployment

Ver [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) para instrucciones completas.

**Stack Recomendado (100% Gratis):**
- Database: Supabase PostgreSQL
- Backend: Railway
- Frontend: Vercel

---

## 🙏 Agradecimientos

Sistema diseñado específicamente para minimarkets peruanos con métodos de pago locales y FIFO automático para reducir mermas.

---

**Hecho con ❤️ para minimarkets peruanos** | **v1.0.0** | **Production Ready** ✅
