/**
 * Parsea el string denso de WooCommerce "7-0-us-40-eur-38-col-25-cm"
 * en algo legible: "US 7.0 / EUR 38 / 25 cm"
 *
 * Formato esperado (puede variar según configuración del cliente WP):
 *   {us}-{eur}-{us}-{eur}-{cm}   ej: "7-0-us-40-eur-38-col-25-cm"
 *
 * Estrategia defensiva: si el parseo falla, devuelve el string original limpio.
 */
export function formatSizeOption(raw: string): string {
  if (!raw || typeof raw !== 'string') return raw || '';

  const parts = raw.toLowerCase().split('-');

  // Heurística: encontrar el segmento "us" y tomar lo anterior como talla US,
  // encontrar "eur" y tomar lo anterior como EUR, encontrar "cm" y tomar lo anterior como CM
  const usIdx = parts.indexOf('us');
  const eurIdx = parts.indexOf('eur');
  const cmIdx = parts.indexOf('cm');

  const us = usIdx > 0 ? parts[usIdx - 1] : null;
  const eur = eurIdx > 0 ? parts[eurIdx - 1] : null;
  const cm = cmIdx > 0 ? parts[cmIdx - 1] : null;

  const formatted: string[] = [];
  if (us) formatted.push(`US ${formatNumber(us)}`);
  if (eur) formatted.push(`EUR ${formatNumber(eur)}`);
  if (cm) formatted.push(`${formatNumber(cm)} cm`);

  if (formatted.length === 0) {
    // Fallback: devolver el string original sin guiones feos
    return raw.replace(/-/g, ' ').trim();
  }

  return formatted.join(' / ');
}

function formatNumber(s: string): string {
  // "7" → "7", "7.0" → "7.0", "10" → "10"
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  return n.toString();
}