# Instrucciones para agregar QR de Yape/Plin

## Ubicación del archivo QR

Debes colocar la imagen QR de Yape en la siguiente ubicación:

```
frontend/public/qr-codes/yape-qr.jpg
```

## Pasos:

1. Navega a la carpeta del proyecto:
   ```
   cd frontend/public
   ```

2. Crea la carpeta `qr-codes` si no existe:
   ```
   mkdir qr-codes
   ```

3. Copia tu imagen QR de Yape (la imagen morada que proporcionaste) a esa carpeta con el nombre `yape-qr.jpg`

4. La aplicación automáticamente mostrará el QR en los modales de pago de Yape y Plin

## Notas:

- El mismo QR se usa tanto para Yape como para Plin
- Si la imagen no se encuentra, se mostrará un placeholder con el texto "QR no disponible"
- El formato recomendado es JPG o PNG
- Tamaño recomendado: al menos 500x500 px para buena calidad

## Alternativa (si usas otra imagen):

Si quieres usar un archivo con otro nombre o formato, edita el archivo:
```
frontend/src/components/pos/PaymentModals/YapePlinModal.jsx
```

Busca la línea 49 y cambia la ruta:
```jsx
src="/qr-codes/tu-imagen.png"
```
