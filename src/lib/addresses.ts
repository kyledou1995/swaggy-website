/** Shipping address used for physical samples (saved on the order). */
export interface ShippingAddress {
  label?: string | null;
  attention?: string | null;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  zip_code?: string | null;
  country: string;
  phone?: string | null;
  /** Saved warehouse it came from, if any. */
  delivery_address_id?: string | null;
}

export function formatAddress(a: ShippingAddress | null | undefined, opts: { multiline?: boolean } = {}): string {
  if (!a) return '';
  const cityLine = [a.city, [a.state, a.zip_code].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const parts = [a.attention ? `Attn: ${a.attention}` : null, a.address_line1, a.address_line2, cityLine, a.country, a.phone ? `Phone: ${a.phone}` : null]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.join(opts.multiline ? '\n' : ', ');
}

export function isCompleteAddress(a: ShippingAddress | null | undefined): a is ShippingAddress {
  return !!a && !!a.address_line1?.trim() && !!a.city?.trim() && !!a.country?.trim();
}
