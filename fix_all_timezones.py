"""
Script para reemplazar timezone.utc por PERU_TZ en todos los modelos
"""
import os
import re

models_dir = "app/models"

# Archivos a procesar
files_to_fix = [
    "lote.py",
    "movimiento_stock.py",
    "product.py",
    "sync_queue.py",
    "user.py"
]

for filename in files_to_fix:
    filepath = os.path.join(models_dir, filename)

    if not os.path.exists(filepath):
        print(f"[!] No existe: {filepath}")
        continue

    print(f"\n[*] Procesando: {filename}")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Asegurar imports
    if 'from datetime import datetime, timezone' in content and 'timedelta' not in content:
        content = content.replace(
            'from datetime import datetime, timezone',
            'from datetime import datetime, timezone, timedelta'
        )
        print("  [+] Agregado import timedelta")

    # 2. Agregar PERU_TZ si no existe
    if 'PERU_TZ' not in content:
        # Buscar donde termina los imports
        import_section_end = content.find('\n\nclass ')
        if import_section_end == -1:
            import_section_end = content.find('\n\n\nclass ')

        if import_section_end != -1:
            peru_tz_def = "\n# Zona horaria de Perú (UTC-5)\nPERU_TZ = timezone(timedelta(hours=-5))\n"
            content = content[:import_section_end] + peru_tz_def + content[import_section_end:]
            print("  [+] Agregada definicion PERU_TZ")

    # 3. Reemplazar datetime.now(timezone.utc) por datetime.now(PERU_TZ)
    replacements = content.count('datetime.now(timezone.utc)')
    content = content.replace('datetime.now(timezone.utc)', 'datetime.now(PERU_TZ)')
    if replacements > 0:
        print(f"  [+] Reemplazados {replacements} usos de datetime.now(timezone.utc)")

    # Guardar solo si hubo cambios
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  [OK] Archivo actualizado")
    else:
        print(f"  [SKIP] Sin cambios")

print("\n[OK] Proceso completado!")
