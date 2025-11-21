import { useState } from 'react';
import { Receipt, Clock, Calendar } from 'lucide-react';
import { formatPeruDate } from '../../utils/timezone';
import { format, subDays } from 'date-fns';

export const RecentSales = ({ ventas, onFilterChange }) => {
  const [filtroActivo, setFiltroActivo] = useState('hoy');
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleFiltroRapido = (e, tipo) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log(`🔵 CLICK EN ${tipo.toUpperCase()}`);
    setFiltroActivo(tipo);
    const hoy = new Date();

    let inicio, fin;

    switch(tipo) {
      case 'hoy':
        inicio = format(hoy, 'yyyy-MM-dd');
        fin = format(hoy, 'yyyy-MM-dd');
        break;
      case 'ayer':
        const ayer = subDays(hoy, 1);
        inicio = format(ayer, 'yyyy-MM-dd');
        fin = format(ayer, 'yyyy-MM-dd');
        break;
      default:
        inicio = format(hoy, 'yyyy-MM-dd');
        fin = format(hoy, 'yyyy-MM-dd');
    }

    setFechaInicio(inicio);
    setFechaFin(fin);

    console.log(`🔵 filtroActivo cambiado a: ${tipo}`);

    if (onFilterChange) {
      onFilterChange(inicio, fin);
    }
  };

  const handleFiltroPersonalizado = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('🔵 CLICK EN FILTRAR');
    setFiltroActivo('personalizado');

    // Validar fechas: si inicio > fin, intercambiar
    let inicio = fechaInicio;
    let fin = fechaFin;

    if (new Date(inicio) > new Date(fin)) {
      [inicio, fin] = [fin, inicio];
      setFechaInicio(inicio);
      setFechaFin(fin);
    }

    console.log('🔵 filtroActivo cambiado a: personalizado');

    if (onFilterChange) {
      onFilterChange(inicio, fin);
    }
  };

  const getMensajeNoVentas = () => {
    if (filtroActivo === 'hoy') return 'No se encontraron ventas para hoy';
    if (filtroActivo === 'ayer') return 'No se encontraron ventas para ayer';
    if (filtroActivo === 'personalizado') return `No se encontraron ventas del ${fechaInicio} al ${fechaFin}`;
    return 'No hay ventas registradas';
  };

  const getMensajePeriodo = () => {
    if (filtroActivo === 'hoy') return ' de hoy';
    if (filtroActivo === 'ayer') return ' de ayer';
    if (filtroActivo === 'personalizado') return ` del ${fechaInicio} al ${fechaFin}`;
    return '';
  };

  const getMetodoPagoBadge = (metodo) => {
    const metodos = {
      efectivo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Efectivo' },
      yape: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Yape' },
      plin: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Plin' },
      transferencia: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Transferencia' },
    };

    const metodoKey = (metodo || 'efectivo').toLowerCase();
    const config = metodos[metodoKey] || metodos.efectivo;

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header con título y contador */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Últimas Ventas</h3>
        </div>
        <span className="text-sm text-gray-500">{ventas.length} ventas</span>
      </div>

      {/* Filtros de fecha - Todo en una línea */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Botones rápidos */}
        <button
          type="button"
          onClick={(e) => handleFiltroRapido(e, 'hoy')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtroActivo === 'hoy'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={(e) => handleFiltroRapido(e, 'ayer')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtroActivo === 'ayer'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ayer
        </button>

        {/* Separador visual */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* Filtro personalizado */}
        <Calendar className="h-4 w-4 text-gray-500" />
        <label className="text-sm font-medium text-gray-700">Desde:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">Hasta:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handleFiltroPersonalizado}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtroActivo === 'personalizado'
              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Filtrar
        </button>
      </div>

      {/* Mensaje de cantidad de ventas */}
      {ventas.length > 0 && (
        <p className="text-sm text-gray-600 mb-3">
          Mostrando {ventas.length} ventas{getMensajePeriodo()}
        </p>
      )}

      {/* Mensaje cuando no hay ventas */}
      {ventas.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-3">
            <Receipt className="h-16 w-16 mx-auto" />
          </div>
          <p className="text-gray-500 font-medium">{getMensajeNoVentas()}</p>
          <p className="text-sm text-gray-400 mt-2">
            Prueba seleccionando otra fecha
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Venta
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.map((venta) => {
              const fechaCompleta = venta.fecha_venta || venta.fecha || venta.created_at;

              return (
                <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                  {/* Número de venta */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        #{venta.id?.toString().padStart(6, '0')}
                      </span>
                    </div>
                  </td>

                  {/* Fecha y hora (en zona horaria de Perú) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {formatPeruDate(fechaCompleta, 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPeruDate(fechaCompleta, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Productos vendidos */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {venta.detalles && venta.detalles.length > 0 ? (
                        <div className="space-y-1 max-w-xs">
                          {venta.detalles.map((detalle, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <span className="truncate">{detalle.producto?.nombre || detalle.producto_nombre || 'Producto'}</span>
                              <span className="text-gray-500 text-xs whitespace-nowrap">x{detalle.cantidad}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin detalles</span>
                      )}
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      S/ {Number(venta.total || 0).toFixed(2)}
                    </span>
                  </td>

                  {/* Método de pago */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getMetodoPagoBadge(venta.metodo_pago)}
                  </td>

                  {/* Vendedor */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {venta.vendedor_nombre ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">
                            {venta.vendedor_nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {venta.vendedor_nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {venta.vendedor_username}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-400">?</span>
                        </div>
                        <span className="text-sm">Sin asignar</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer con total */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total en tabla:</span>
            <span className="text-lg font-bold text-gray-900">
              S/ {ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
