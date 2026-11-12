/** Shipment tracking helpers (carrier detection + public tracking links). */

export const CARRIERS = ['UPS', 'FedEx', 'USPS', 'DHL', 'Other'] as const;
export type Carrier = (typeof CARRIERS)[number];

/** Best guess at the carrier from the tracking number format. */
export function detectCarrier(num: string): Carrier {
  const n = num.replace(/\s+/g, '').toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(n)) return 'UPS';
  if (/^(94|93|92|95)\d{20}$/.test(n) || /^[A-Z]{2}\d{9}US$/.test(n)) return 'USPS';
  if (/^\d{12}$|^\d{15}$|^\d{20}$/.test(n)) return 'FedEx';
  if (/^\d{10}$/.test(n) || /^JD\d{18}$/.test(n)) return 'DHL';
  return 'Other';
}

export function trackingUrl(num: string, carrier?: string | null): string {
  const n = encodeURIComponent(num.replace(/\s+/g, ''));
  switch ((carrier || detectCarrier(num)).toUpperCase()) {
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${n}`;
    case 'FEDEX':
      return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
    case 'USPS':
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${n}`;
    case 'DHL':
      return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`;
    default:
      return `https://t.17track.net/en#nums=${n}`;
  }
}
