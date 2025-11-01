# KATITA-POS - Comandos Útiles

Referencia rápida de comandos para el desarrollo del proyecto.

## Setup Inicial

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows (cmd)
venv\Scripts\activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Linux/MacOS
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar setup automático
python setup.py
```

## Ejecución

```bash
# Ejecutar servidor de desarrollo
python run.py

# Ejecutar con variables de entorno específicas
FLASK_ENV=development python run.py

# Ejecutar en modo producción (no recomendado para desarrollo)
FLASK_ENV=production python run.py
```

## Base de Datos

```bash
# Inicializar base de datos (se crea automáticamente al ejecutar)
python run.py

# Crear migraciones (cuando uses Alembic)
flask db init
flask db migrate -m "Mensaje de la migración"
flask db upgrade

# Rollback de migraciones
flask db downgrade
```

## Testing

```bash
# Ejecutar todos los tests
pytest

# Ejecutar tests con verbose
pytest -v

# Ejecutar tests específicos
pytest tests/test_app.py
pytest tests/unit/
pytest tests/integration/

# Ejecutar con cobertura
pytest --cov=app tests/

# Generar reporte HTML de cobertura
pytest --cov=app --cov-report=html tests/
# Ver en: htmlcov/index.html

# Ejecutar tests en watch mode (necesita pytest-watch)
ptw
```

## Code Quality

```bash
# Formatear código con Black
black app/ tests/

# Verificar sin modificar
black --check app/ tests/

# Linting con Flake8
flake8 app/ tests/

# Auto-formatear con autopep8
autopep8 --in-place --recursive app/ tests/
```

## Dependencias

```bash
# Instalar nueva dependencia
pip install nombre-paquete

# Actualizar requirements.txt
pip freeze > requirements.txt

# Instalar desde requirements.txt
pip install -r requirements.txt

# Actualizar todas las dependencias
pip install --upgrade -r requirements.txt
```

## Git

```bash
# Inicializar repositorio
git init

# Agregar archivos
git add .

# Commit
git commit -m "Mensaje del commit"

# Push
git push origin main

# Ver estado
git status

# Ver historial
git log --oneline
```

## Entorno Virtual

```bash
# Desactivar entorno virtual
deactivate

# Eliminar entorno virtual
# Windows
rmdir /s venv

# Linux/MacOS
rm -rf venv

# Recrear entorno virtual
python -m venv venv
```

## Producción (Gunicorn)

```bash
# Ejecutar con Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"

# Con logs
gunicorn -w 4 -b 0.0.0.0:5000 --access-logfile logs/access.log --error-logfile logs/error.log "app:create_app()"

# Con auto-reload (desarrollo)
gunicorn -w 4 -b 0.0.0.0:5000 --reload "app:create_app()"
```

## Utilidades

```bash
# Ver versión de Python
python --version

# Ver paquetes instalados
pip list

# Ver paquetes desactualizados
pip list --outdated

# Limpiar archivos __pycache__
# Windows
for /d /r . %d in (__pycache__) do @if exist "%d" rd /s /q "%d"

# Linux/MacOS
find . -type d -name __pycache__ -exec rm -rf {} +

# Limpiar archivos .pyc
# Windows
del /s /q *.pyc

# Linux/MacOS
find . -type f -name "*.pyc" -delete
```

## Variables de Entorno

```bash
# Ver variables de entorno
# Windows
set FLASK_ENV

# Linux/MacOS
echo $FLASK_ENV

# Establecer variables de entorno
# Windows (cmd)
set FLASK_ENV=development

# Windows (PowerShell)
$env:FLASK_ENV="development"

# Linux/MacOS
export FLASK_ENV=development
```

## Docker (Futuro)

```bash
# Construir imagen
docker build -t katita-pos .

# Ejecutar contenedor
docker run -p 5000:5000 katita-pos

# Docker Compose
docker-compose up
docker-compose down
```
