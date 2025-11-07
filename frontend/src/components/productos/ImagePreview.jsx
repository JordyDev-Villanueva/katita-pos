import { useState } from 'react';
import { Image, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../common/Button';

export const ImagePreview = ({ url, onUrlChange }) => {
  const [imageUrl, setImageUrl] = useState(url || '');
  const [imageStatus, setImageStatus] = useState('idle'); // idle, loading, success, error
  const [previewUrl, setPreviewUrl] = useState(url || '');

  const handleTestUrl = () => {
    if (!imageUrl.trim()) {
      setImageStatus('error');
      return;
    }

    setImageStatus('loading');
    const img = new window.Image();

    img.onload = () => {
      setImageStatus('success');
      setPreviewUrl(imageUrl);
      onUrlChange(imageUrl);
    };

    img.onerror = () => {
      setImageStatus('error');
      setPreviewUrl('');
    };

    img.src = imageUrl;
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        URL de Imagen (Opcional)
      </label>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => {
            setImageUrl(e.target.value);
            setImageStatus('idle');
          }}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button
          onClick={handleTestUrl}
          variant="secondary"
          disabled={!imageUrl.trim()}
          loading={imageStatus === 'loading'}
        >
          Probar URL
        </Button>
      </div>

      {/* Mensajes de estado */}
      {imageStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-sm mb-3">
          <AlertCircle className="h-4 w-4" />
          <span>No se pudo cargar la imagen. Verifica la URL.</span>
        </div>
      )}

      {imageStatus === 'success' && (
        <div className="flex items-center gap-2 text-green-600 text-sm mb-3">
          <CheckCircle className="h-4 w-4" />
          <span>Imagen cargada correctamente</span>
        </div>
      )}

      {/* Preview de la imagen */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        {previewUrl && imageStatus === 'success' ? (
          <div className="flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-48 h-48 object-cover rounded-lg shadow-sm"
            />
            <p className="text-xs text-gray-500 mt-2">Preview de la imagen</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <Image className="h-16 w-16 mb-2" />
            <p className="text-sm">Sin imagen</p>
            <p className="text-xs">Ingresa una URL y haz click en "Probar URL"</p>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-2">
        💡 Puedes usar URLs de imágenes desde Google Imágenes, páginas de productos, etc.
      </p>
    </div>
  );
};
