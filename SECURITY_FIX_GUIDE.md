# 🔒 KATITA-POS - Guía de Seguridad y Remediación

## ⚠️ PROBLEMA CRÍTICO DETECTADO

**Fecha:** 2026-01-01
**Severidad:** 🔴 CRÍTICA
**Estado:** Credenciales de base de datos expuestas en GitHub

---

## 🚨 ¿Qué pasó?

Se encontraron **17 archivos** con credenciales de Supabase hardcodeadas (password en texto plano) que fueron subidos a GitHub. Esto significa que **cualquier persona con acceso al repositorio puede leer, modificar o eliminar datos** de la base de datos de producción.

### Archivos afectados:
```
- fix_supabase_security.py
- test_supabase_connection.py
- init_supabase.py
- init_db.py
- fix_venta_to_peru_time.py
- test_current_date.py
- diagnose_complete_db.py
- add_subtotal_final.py
- check_detalles_venta_schema.py
- fix_all_updated_at.py
- add_updated_at_column.py
- RAILWAY_VARIABLES.txt
... y 5 más
```

---

## ✅ PASOS DE REMEDIACIÓN (HACER AHORA)

### 1. Cambiar password de Supabase INMEDIATAMENTE

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto `KATITA-POS`
3. Ve a **Settings** → **Database**
4. Busca **Database Password** y haz click en **Reset Database Password**
5. **IMPORTANTE:** Copia el nuevo password y guárdalo en un lugar seguro (1Password, KeePass, etc.)
6. **NO lo pegues en ningún archivo de código**

### 2. Crear archivo .env con el nuevo password

En la raíz del proyecto (`katita-pos/`), crea un archivo `.env`:

```bash
# .env (NUNCA subir este archivo a GitHub)
POSTGRES_DATABASE_URI=postgresql://postgres.sovoxkfvvwicqqfpaove:TU_NUEVO_PASSWORD_AQUI@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
```

Reemplaza `TU_NUEVO_PASSWORD_AQUI` con el password que acabas de generar en Supabase.

### 3. Actualizar Railway con el nuevo password

1. Ve a https://railway.app
2. Selecciona tu proyecto `KATITA-POS`
3. Ve a **Variables**
4. Actualiza `POSTGRES_DATABASE_URI` con el nuevo connection string

### 4. Verificar que .gitignore protege .env

✅ Ya está configurado - el archivo `.env` NO se subirá a GitHub

### 5. Remover archivos sensibles del historial de Git

**⚠️ SOLO SI EL REPO ES PRIVADO:**
Si tu repositorio es privado y solo tú tienes acceso, puedes continuar. Los archivos con credenciales ahora están en `.gitignore` y no se subirán más.

**🚨 SI EL REPO ES PÚBLICO:**
Debes eliminar el historial completo de Git y empezar fresh:

```bash
# Opción 1: Hacer el repo privado inmediatamente
# Ve a GitHub → Settings → Danger Zone → Change visibility → Make private

# Opción 2: Limpiar historial (EXTREMO - perderás historial de commits)
cd katita-pos
rm -rf .git
git init
git add .
git commit -m "Initial commit (security: removed exposed credentials)"
git remote add origin https://github.com/JordyDev-Villanueva/katita-pos.git
git push -f origin main
```

---

## 📚 LECCIÓN: ¿Por qué esto es peligroso?

### Analogía del Plano de Casa:

```
Código en GitHub = Plano de tu casa (público)
Password de DB = Llave de tu casa (privada)

❌ Lo que hiciste: Subir plano con copia de la llave pegada
✅ Lo correcto: Subir plano, cada quien usa sus propias llaves
```

### Consecuencias reales:

1. **Bots escanean GitHub** buscando passwords cada minuto
2. **Hackean bases de datos** en cuestión de horas
3. **Roban/borran datos** de clientes
4. **Costos inesperados** (si el hacker usa tus recursos cloud)
5. **Problemas legales** (violación de privacidad de datos)

---

## ✅ MEJORES PRÁCTICAS IMPLEMENTADAS

### 1. Variables de entorno (`.env`)

```python
# ❌ NUNCA HAGAS ESTO
DATABASE_URL = "postgresql://user:password123@host.com/db"

# ✅ SIEMPRE HAZ ESTO
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('POSTGRES_DATABASE_URI')
```

### 2. .gitignore actualizado

El `.gitignore` ahora protege:
- `.env` y variaciones
- Scripts de test/fix con credenciales
- Archivos de conexión

### 3. Scripts migrados

Todos los scripts ahora usan variables de entorno:
- ✅ `fix_supabase_security.py` - Migrado
- ✅ `test_supabase_connection.py` - Migrado
- ⚠️ Otros 15 archivos - **Debes migrarlos** usando el mismo patrón

---

## 🔄 PATRÓN DE MIGRACIÓN

Para migrar otros archivos con credenciales:

**ANTES:**
```python
SUPABASE_URL = 'postgresql://user:password@host/db'
```

**DESPUÉS:**
```python
import os
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv('POSTGRES_DATABASE_URI')

if not SUPABASE_URL:
    print("[ERROR] POSTGRES_DATABASE_URI no encontrada")
    sys.exit(1)
```

---

## 📋 CHECKLIST DE SEGURIDAD

- [ ] Cambié el password de Supabase
- [ ] Creé archivo `.env` con nuevo password
- [ ] Actualicé variables en Railway
- [ ] Verifiqué que `.env` está en `.gitignore`
- [ ] Decidí si hacer repo privado o limpiar historial
- [ ] Migré todos los scripts a usar `.env`
- [ ] Testeé que la app funciona con nuevo password
- [ ] Revisé que no haya otros secrets hardcodeados

---

## 🆘 ¿Necesitas ayuda?

Si algo no funciona después de cambiar el password:

1. Verifica que `.env` existe y tiene el connection string correcto
2. Verifica que Railway tiene la variable actualizada
3. Prueba la conexión: `python test_supabase_connection.py`
4. Si falla, revisa que copiaste bien el password (sin espacios extra)

---

## 📖 Recursos adicionales

- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**Recuerda:** Los secrets NUNCA van en el código. Siempre usa variables de entorno.
