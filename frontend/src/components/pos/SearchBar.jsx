import { useState, useRef, useEffect } from 'react';
import { Search, Barcode } from 'lucide-react';

export const SearchBar = ({ onProductFound, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  // Auto-focus en el input (para pistola escáner)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSearchTerm('');
    }
  };

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <form onSubmit={handleSearch} className="mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Barcode className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleChange}
          placeholder="Escanea código de barras o busca por nombre..."
          className="block w-full pl-12 pr-12 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          autoFocus
        />

        <button
          type="submit"
          className="absolute inset-y-0 right-0 pr-4 flex items-center"
        >
          <Search className="h-5 w-5 text-gray-400 hover:text-primary-600" />
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        💡 Usa la pistola escáner o escribe manualmente el código/nombre del producto
      </p>
    </form>
  );
};
