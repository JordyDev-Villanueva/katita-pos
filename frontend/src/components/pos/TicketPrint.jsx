import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Componente de Ticket para Impresión Térmica
 *
 * Genera un ticket de 80mm de ancho listo para imprimir en impresoras térmicas.
 * Incluye: Logo, datos del negocio, productos, totales, método de pago.
 */
export const TicketPrint = ({ venta, onPrintComplete }) => {
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ticket-${venta.numero_venta}`,
    onAfterPrint: () => {
      if (onPrintComplete) {
        onPrintComplete();
      }
    }
  });

  // Formatear fecha
  const fechaFormateada = venta.fecha ?
    format(new Date(venta.fecha), "dd/MM/yyyy HH:mm", { locale: es }) :
    '';

  return (
    <div className="space-y-3">
      {/* Vista Previa del Ticket */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
        <h3 className="text-center text-sm font-semibold text-gray-700 mb-3">Vista Previa del Ticket</h3>
        <div ref={componentRef} className="mx-auto bg-white shadow-md" style={{ maxWidth: '100%', width: '350px' }}>
          <style>
            {`
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                .ticket-container {
                  width: 80mm !important;
                  max-width: 80mm !important;
                  font-size: 9px !important;
                  padding: 4mm !important;
                  box-sizing: border-box;
                }
                .ticket-logo {
                  font-size: 14px !important;
                }
                .ticket-business-name {
                  font-size: 11px !important;
                }
                .ticket-info {
                  font-size: 8px !important;
                }
                .ticket-item {
                  font-size: 9px !important;
                }
                .ticket-item-detail {
                  font-size: 8px !important;
                }
                .ticket-total {
                  font-size: 11px !important;
                }
                .ticket-footer {
                  font-size: 7px !important;
                }
              }

              @media screen {
                .ticket-container {
                  width: 100%;
                  max-width: 350px;
                  font-size: 12px;
                  padding: 20px;
                }
                .ticket-logo {
                  font-size: 18px;
                }
                .ticket-business-name {
                  font-size: 14px;
                }
                .ticket-info {
                  font-size: 10px;
                }
                .ticket-item {
                  font-size: 11px;
                }
                .ticket-item-detail {
                  font-size: 10px;
                }
                .ticket-total {
                  font-size: 13px;
                }
                .ticket-footer {
                  font-size: 9px;
                }
              }

              .ticket-container {
                font-family: 'Courier New', monospace;
                background: white;
                color: black;
                box-sizing: border-box;
              }

              .ticket-header {
                text-align: center;
                border-bottom: 2px dashed #000;
                padding-bottom: 8px;
                margin-bottom: 8px;
              }

              .ticket-logo {
                font-weight: bold;
                margin-bottom: 4px;
              }

              .ticket-business-name {
                font-weight: bold;
                margin-bottom: 3px;
              }

              .ticket-info {
                line-height: 1.4;
              }

              .ticket-section {
                margin: 8px 0;
                padding: 4px 0;
                border-bottom: 1px dashed #000;
              }

              .ticket-item {
                display: flex;
                justify-content: space-between;
                margin: 3px 0;
                gap: 8px;
              }

              .ticket-item span:first-child {
                flex-shrink: 0;
              }

              .ticket-item span:last-child {
                text-align: right;
                word-break: break-word;
              }

              .ticket-item-detail {
                color: #444;
                margin-left: 8px;
                margin-top: 2px;
              }

              .ticket-total {
                font-weight: bold;
                margin-top: 8px;
              }

              .ticket-footer {
                text-align: center;
                margin-top: 8px;
                line-height: 1.5;
              }

              .ticket-divider {
                border-bottom: 2px solid #000;
                margin: 8px 0;
              }

              .ticket-product-name {
                word-break: break-word;
                display: block;
                margin-bottom: 2px;
              }
            `}
          </style>

          <div className="ticket-container">
            {/* Header - Logo y Datos del Negocio */}
            <div className="ticket-header">
              <div className="ticket-logo">KATITA POS</div>
              <div className="ticket-business-name">Minimarket Katita</div>
              <div className="ticket-info">
                Guadalupito, Perú<br />
                RUC: 20123456789<br />
                Telf: (044) 123-4567
              </div>
            </div>

            {/* Información de la Venta */}
            <div className="ticket-section">
              <div className="ticket-item">
                <span>N° Venta:</span>
                <strong>{venta.numero_venta}</strong>
              </div>
              <div className="ticket-item">
                <span>Fecha:</span>
                <span>{fechaFormateada}</span>
              </div>
              <div className="ticket-item">
                <span>Vendedor:</span>
                <span>{venta.vendedor_nombre || 'N/A'}</span>
              </div>
              {venta.cliente_nombre && (
                <div className="ticket-item">
                  <span>Cliente:</span>
                  <span>{venta.cliente_nombre}</span>
                </div>
              )}
              {venta.cliente_dni && (
                <div className="ticket-item">
                  <span>DNI:</span>
                  <span>{venta.cliente_dni}</span>
                </div>
              )}
            </div>

            {/* Lista de Productos */}
            <div className="ticket-section">
              <strong style={{ fontSize: '10px', display: 'block', marginBottom: '6px' }}>PRODUCTOS</strong>
              <div>
                {venta.detalles && venta.detalles.map((detalle, index) => (
                  <div key={index} style={{ marginBottom: '6px' }}>
                    <div className="ticket-product-name" style={{ fontSize: '10px', fontWeight: '500' }}>
                      {detalle.producto_nombre}
                    </div>
                    <div className="ticket-item-detail">
                      {detalle.cantidad} x S/ {Number(detalle.precio_unitario).toFixed(2)} = S/ {Number(detalle.subtotal).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="ticket-section">
              <div className="ticket-item">
                <span>Subtotal:</span>
                <span>S/ {Number(venta.subtotal || 0).toFixed(2)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className="ticket-item">
                  <span>Descuento:</span>
                  <span>-S/ {Number(venta.descuento).toFixed(2)}</span>
                </div>
              )}
              <div className="ticket-divider"></div>
              <div className="ticket-item ticket-total">
                <span>TOTAL:</span>
                <span>S/ {Number(venta.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Método de Pago */}
            <div className="ticket-section">
              <strong style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>FORMA DE PAGO</strong>
              <div className="ticket-item">
                <span>Método:</span>
                <strong style={{ textTransform: 'uppercase' }}>
                  {venta.metodo_pago}
                </strong>
              </div>
              {venta.metodo_pago === 'efectivo' && (
                <>
                  <div className="ticket-item">
                    <span>Recibido:</span>
                    <span>S/ {Number(venta.monto_recibido || 0).toFixed(2)}</span>
                  </div>
                  <div className="ticket-item">
                    <span>Cambio:</span>
                    <span>S/ {Number(venta.cambio || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="ticket-footer">
              <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                ¡Gracias por su compra!
              </div>
              <div style={{ fontSize: '9px', color: '#666', lineHeight: '1.6' }}>
                Este documento no es válido como comprobante de pago<br />
                Para factura electrónica solicítela al momento de la compra
              </div>
              <div style={{ marginTop: '8px', fontSize: '9px', fontWeight: '500' }}>
                Powered by KATITA POS v1.0
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de Imprimir */}
      <div className="flex justify-center">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-lg text-sm"
        >
          <Printer className="w-4 h-4" />
          Imprimir Ticket
        </button>
      </div>
    </div>
  );
};
