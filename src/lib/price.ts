/**
 * Formato monetario (soles, es-PE).
 * Centraliza el formato de precios para toda la UI (catálogo, carrito, checkout).
 */
const priceFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  currencyDisplay: 'narrowSymbol', // muestra "S/"
});

export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
