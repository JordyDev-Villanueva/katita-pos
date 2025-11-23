# 🚀 Guía de Deployment - KATITA POS

**Sistema listo para producción con 300-350 ventas diarias**

---

## 📋 Checklist Pre-Deployment

- [x] Backend auditado (0 bugs críticos)
- [x] Frontend responsive probado
- [x] Sistema FIFO verificado
- [x] SECRET_KEY generada
- [x] Configuración de producción lista

---

## 🎯 Stack de Deployment (100% Gratuito)

| Servicio | Uso | Costo Mensual |
|----------|-----|---------------|
| **Supabase** | PostgreSQL Database | $0 (500 MB) |
| **Railway** | Backend API (Flask) | $0 (500 horas) |
| **Vercel** | Frontend (React) | $0 (ilimitado) |
| **TOTAL** | - | **$0/mes** |

---

## 1️⃣ SUPABASE - Base de Datos PostgreSQL

### Paso 1: Crear Proyecto

1. Ir a [supabase.com](https://supabase.com)
2. Click en "Start your project"
3. Crear cuenta (GitHub login recomendado)
4. Click "New Project"
   - **Name:** katita-pos
   - **Database Password:** (generar segura, GUARDARLA)
   - **Region:** South America (Brazil) - más cercano a Perú
   - **Plan:** Free (500 MB)

### Paso 2: Obtener Credenciales

1. En Dashboard > Settings > Database
2. Copiar:
   - **Host:** `xxx.supabase.co`
   - **Port:** `5432`
   - **Database name:** `postgres`
   - **User:** `postgres`
   - **Password:** (la que generaste)

3. **Connection String completa:**
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

### Paso 3: Crear Tablas

1. En Dashboard > SQL Editor
2. Pegar este SQL:

```sql
-- IMPORTANTE: Railway ejecutará esto automáticamente al hacer el primer deploy
-- Pero puedes ejecutarlo manualmente si quieres verificar

-- Flask-Migrate (Alembic) creará las tablas automáticamente
-- Solo asegúrate de que la conexión funcione
SELECT 1;
```

✅ **Listo - Supabase configurado**

---

## 2️⃣ RAILWAY - Backend API

### Paso 1: Preparar Repositorio

1. Asegúrate de tener todo en Git:
   ```bash
   git add .
   git commit -m "feat: Sistema listo para producción"
   git push origin master
   ```

### Paso 2: Crear Proyecto en Railway

1. Ir a [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Seleccionar "Deploy from GitHub repo"
4. Autorizar GitHub
5. Seleccionar repositorio `katita-pos`
6. Railway detectará automáticamente:
   - ✅ `requirements.txt` (instalará dependencias)
   - ✅ `run.py` (punto de entrada)

### Paso 3: Configurar Variables de Entorno

En Railway Dashboard > Variables, agregar:

```bash
# Flask
FLASK_ENV=production
FLASK_APP=run.py
SECRET_KEY=80116b75ddd9a72928414d9e8d8350b69c2aa076bf2b81febdd5a869f7822a2c
DEBUG=False

# Database (copiar desde Supabase)
DATABASE_MODE=cloud
POSTGRES_DATABASE_URI=postgresql://postgres:TU_PASSWORD@TU_HOST.supabase.co:5432/postgres

# JWT
JWT_SECRET_KEY=f8e9a1c7b2d4e6f8a9c0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2
JWT_ACCESS_TOKEN_EXPIRES=3600

# CORS (agregar dominio de Vercel después)
CORS_ORIGINS=https://katita-pos.vercel.app

# Logging
LOG_LEVEL=INFO
LOG_FILE=/tmp/katita-pos.log

# Timezone
TIMEZONE=America/Lima
```

### Paso 4: Deploy

1. Railway hará deploy automático
2. Esperar ~2-3 minutos
3. Obtener URL: `https://katita-pos-production.up.railway.app`

### Paso 5: Inicializar Base de Datos

**IMPORTANTE:** Railway ejecutará automáticamente `db.create_all()` en el primer request.

Para verificar:
```bash
curl https://tu-app.up.railway.app/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "service": "KATITA-POS API",
  "database_mode": "cloud",
  "version": "1.0.0"
}
```

✅ **Backend desplegado**

---

## 3️⃣ VERCEL - Frontend React

### Paso 1: Configurar Backend URL

1. Editar `frontend/src/api/axios.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL ||
                     'https://katita-pos-production.up.railway.app/api';
```

2. Crear `frontend/.env.production`:

```bash
VITE_API_URL=https://tu-app.up.railway.app/api
```

3. Commit:
```bash
git add frontend
git commit -m "feat: Configurar API URL de producción"
git push
```

### Paso 2: Deploy en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Click "Add New..." > Project
3. Import Git Repository
4. Seleccionar `katita-pos`
5. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

6. Agregar Environment Variables:
   - `VITE_API_URL` = `https://tu-app.up.railway.app/api`

7. Click "Deploy"

### Paso 3: Verificar

1. Vercel te dará URL: `https://katita-pos.vercel.app`
2. Abrir en navegador
3. Probar login

✅ **Frontend desplegado**

---

## 4️⃣ CONECTAR TODO

### Paso 1: Actualizar CORS en Railway

En Railway > Variables, actualizar:

```bash
CORS_ORIGINS=https://katita-pos.vercel.app,https://katita-pos-*.vercel.app
```

### Paso 2: Crear Usuario Admin

**Opción A - Desde Railway Shell:**
```bash
# En Railway > Shell
python
>>> from app import create_app, db
>>> from app.models.user import User
>>> app = create_app()
>>> with app.app_context():
...     admin = User(
...         username='admin',
...         email='admin@katita.com',
...         nombre_completo='Administrador',
...         rol='admin',
...         activo=True
...     )
...     admin.set_password('tu_password_seguro')
...     db.session.add(admin)
...     db.session.commit()
...     print(f"Usuario creado: {admin.username}")
```

**Opción B - Endpoint temporal:**

Crear archivo `create_admin.py` en raíz:

```python
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Verificar si ya existe admin
    existing = User.query.filter_by(username='admin').first()
    if existing:
        print("Admin ya existe")
    else:
        admin = User(
            username='admin',
            email='admin@katita.com',
            nombre_completo='Administrador',
            rol='admin',
            activo=True
        )
        admin.set_password('Admin123!')  # CAMBIAR ESTO
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin creado exitosamente")
```

Ejecutar:
```bash
# Localmente conectado a Supabase
python create_admin.py
```

---

## 5️⃣ VERIFICACIÓN FINAL

### ✅ Checklist de Pruebas

1. **Backend Health Check:**
   ```bash
   curl https://tu-app.up.railway.app/health
   ```
   Respuesta esperada: `{"status": "healthy"}`

2. **Frontend cargando:**
   - Abrir `https://katita-pos.vercel.app`
   - Debe mostrar página de login

3. **Login funcionando:**
   - Usuario: `admin`
   - Password: (el que configuraste)
   - Debe redirigir a Dashboard

4. **Crear producto de prueba:**
   - Ir a Productos > Agregar Producto
   - Crear "Coca Cola 500ml"
   - Precio compra: 2.50
   - Precio venta: 3.50

5. **Crear lote de prueba:**
   - Ir a Lotes > Nuevo Lote
   - Producto: Coca Cola
   - Cantidad: 24
   - Fecha vencimiento: (3 meses adelante)

6. **Hacer venta de prueba:**
   - Ir a Punto de Venta
   - Buscar "coca"
   - Agregar al carrito
   - Procesar venta (efectivo)

7. **Ver reportes:**
   - Dashboard debe mostrar la venta
   - Reportes debe mostrar estadísticas

---

## 6️⃣ MONITOREO

### Railway (Backend)

- **Logs:** Railway Dashboard > Deployments > Logs
- **Métricas:** Railway muestra uso de memoria/CPU
- **Alertas:** Railway enviará email si hay errores

### Supabase (Database)

- **Dashboard:** Muestra uso de storage
- **Alertas:** Email cuando llegues a 80% (400 MB)

### Vercel (Frontend)

- **Analytics:** Vercel Dashboard > Analytics
- **Errores:** Vercel muestra errores de build

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot connect to database"

**Causa:** POSTGRES_DATABASE_URI incorrecta

**Solución:**
1. Verificar credenciales en Supabase
2. Verificar que Railway tiene la variable correcta
3. Formato debe ser exacto:
   ```
   postgresql://postgres:PASSWORD@HOST:5432/postgres
   ```

### Error: "CORS policy blocked"

**Causa:** CORS_ORIGINS no incluye dominio de Vercel

**Solución:**
1. En Railway > Variables
2. Agregar: `CORS_ORIGINS=https://tu-app.vercel.app`
3. Redeploy

### Error: "JWT token invalid"

**Causa:** JWT_SECRET_KEY diferente entre deploys

**Solución:**
1. Usar la misma SECRET_KEY en Railway
2. Logout y login nuevamente

---

## 📊 COSTOS ESTIMADOS

### Primer Año (300-350 ventas/día)

| Mes | Supabase | Railway | Vercel | Total |
|-----|----------|---------|--------|-------|
| 1-12 | $0 | $0 | $0 | **$0** |

### Cuando Crezcas (1000+ ventas/día)

| Mes | Supabase | Railway | Vercel | Total |
|-----|----------|---------|--------|-------|
| 13+ | $25 | $5 | $0 | **$30** |

---

## 🎉 ¡FELICIDADES!

Tu sistema KATITA-POS está desplegado y funcionando en producción.

**Próximos pasos:**
1. Cambiar password de admin
2. Crear usuarios vendedores
3. Cargar productos reales
4. Capacitar a tus padres

**Soporte:**
- Logs de Railway para debugging
- Supabase Dashboard para ver datos
- Vercel Analytics para tráfico

---

**Última actualización:** Noviembre 2025
**Versión del sistema:** 1.0.0
**Status:** ✅ Production Ready
