# FASE 8: Instalación de Dependencias

## 📦 Dependencias Necesarias

Para la funcionalidad de impresión de tickets, necesitas instalar:

```bash
cd frontend
npm install react-to-print
```

## 🗄️ Migración de Base de Datos

Ejecuta el script de migración en tu base de datos PostgreSQL (Supabase):

1. Ve a Supabase Dashboard > SQL Editor
2. Copia y ejecuta el contenido de: `migrations/004_fase8_devoluciones_ajustes.sql`
3. Verifica que las tablas se crearon correctamente:
   - `devoluciones`
   - `ajustes_inventario`
   - Campo `devuelta` en tabla `ventas`

## 🚀 Despliegue Backend

Después de hacer push de los cambios:

1. El backend se desplegará automáticamente en Railway
2. Verifica que los nuevos endpoints estén disponibles:
   - `POST /api/devoluciones/`
   - `GET /api/devoluciones/`
   - `POST /api/ajustes-inventario/`
   - `GET /api/ajustes-inventario/`

## ✅ Verificación

Una vez instaladas las dependencias y ejecutada la migración:

1. Reinicia el servidor de desarrollo frontend: `npm run dev`
2. Verifica que la impresión funcione en el POS
3. Prueba crear una devolución desde el historial de ventas
4. Prueba crear ajustes de inventario desde el nuevo módulo

---

**Nota**: La impresión funcionará mejor con impresoras térmicas configuradas para papel de 80mm. En navegadores, se usará la función de impresión estándar.
