# -*- coding: utf-8 -*-
"""
Test del endpoint de alertas de lotes
"""
import requests

# URL del endpoint
url = "http://127.0.0.1:5000/api/lotes/alertas"

# Parametros
params = {"dias": 7}

print("="*60)
print("TEST: Endpoint de Alertas de Lotes")
print("="*60)
print(f"\nURL: {url}")
print(f"Parámetros: {params}")
print("\nHaciendo request...")

try:
    # Hacer el request (sin autenticación para verificar el endpoint)
    response = requests.get(url, params=params)

    print(f"\nStatus Code: {response.status_code}")
    print(f"URL final (después de redirects): {response.url}")

    if response.status_code == 200:
        print("\n✅ Endpoint funcionando correctamente")
        data = response.json()
        print(f"\nRespuesta JSON:")
        print(data)
    elif response.status_code == 401:
        print("\n⚠️  Endpoint requiere autenticación (esperado)")
        print("El endpoint existe y está funcionando, solo necesita token JWT")
    elif response.status_code == 403:
        print("\n❌ Error 403 FORBIDDEN")
        print("El endpoint existe pero el acceso está prohibido")
        print(f"URL solicitada: {response.url}")
    elif response.status_code == 404:
        print("\n❌ Error 404 NOT FOUND")
        print("El endpoint NO existe")
    else:
        print(f"\n❌ Error {response.status_code}")
        print(response.text)

except requests.exceptions.ConnectionError:
    print("\n❌ No se pudo conectar al backend")
    print("Asegúrate de que el backend está corriendo en http://127.0.0.1:5000")
except Exception as e:
    print(f"\n❌ Error inesperado: {e}")

print("\n" + "="*60)
