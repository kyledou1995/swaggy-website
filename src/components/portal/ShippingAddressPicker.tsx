'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { DeliveryAddress } from '@/types';
import type { ShippingAddress } from '@/lib/addresses';

const NEW = '__new__';

const fromSaved = (d: DeliveryAddress): ShippingAddress => ({
  label: d.label,
  address_line1: d.address_line1,
  address_line2: d.address_line2 || null,
  city: d.city,
  state: d.state || null,
  zip_code: d.zip_code || null,
  country: d.country || 'United States',
  delivery_address_id: d.id,
});

const EMPTY: ShippingAddress = { attention: '', address_line1: '', address_line2: '', city: '', state: '', zip_code: '', country: 'United States', phone: '' };

/**
 * Pick one of the organization's saved warehouses, or type a different address.
 * Reports the chosen address (or null while incomplete) via onChange.
 */
export function ShippingAddressPicker({
  onChange,
  onSaveNewChange,
}: {
  onChange: (address: ShippingAddress | null) => void;
  /** Whether a typed address should also be saved to the client's warehouses. */
  onSaveNewChange?: (save: boolean) => void;
}) {
  const [saved, setSaved] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [choice, setChoice] = useState<string>('');
  const [form, setForm] = useState<ShippingAddress>(EMPTY);
  const [saveNew, setSaveNew] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await createClient()
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });
      const list = (data as DeliveryAddress[]) || [];
      setSaved(list);
      setChoice(list.length ? list[0].id : NEW);
      setLoading(false);
    })();
  }, []);

  // Report the current selection upward
  useEffect(() => {
    if (!choice) return onChange(null);
    if (choice === NEW) {
      const ok = form.address_line1.trim() && form.city.trim() && form.country.trim();
      onChange(ok ? { ...form, label: form.label || 'Sample delivery' } : null);
    } else {
      const d = saved.find((s) => s.id === choice);
      onChange(d ? fromSaved(d) : null);
    }
  }, [choice, form, saved]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    onSaveNewChange?.(choice === NEW && saveNew);
  }, [choice, saveNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-base sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  if (loading) return <p className="text-sm text-gray-500">Loading your addresses…</p>;

  return (
    <div className="space-y-2">
      {saved.map((d) => (
        <label
          key={d.id}
          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
            choice === d.id ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <input type="radio" name="sample-address" className="mt-1 accent-green-600" checked={choice === d.id} onChange={() => setChoice(d.id)} />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" /> {d.label}
              {d.is_default && <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-100 rounded px-1.5 py-0.5">Default</span>}
            </p>
            <p className="text-gray-600">
              {[d.address_line1, d.address_line2].filter(Boolean).join(', ')}
              <br />
              {[d.city, [d.state, d.zip_code].filter(Boolean).join(' ')].filter(Boolean).join(', ')}{d.country ? `, ${d.country}` : ''}
            </p>
          </div>
        </label>
      ))}

      <label
        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
          choice === NEW ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
      >
        <input type="radio" name="sample-address" className="mt-1 accent-green-600" checked={choice === NEW} onChange={() => setChoice(NEW)} />
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-gray-400" /> {saved.length ? 'Ship to a different address' : 'Enter a shipping address'}
        </p>
      </label>

      {choice === NEW && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
          <input className={input} placeholder="Attention / recipient name (optional)" value={form.attention || ''} onChange={set('attention')} />
          <input className={input} placeholder="Street address *" value={form.address_line1} onChange={set('address_line1')} autoComplete="address-line1" />
          <input className={input} placeholder="Apt, suite, unit (optional)" value={form.address_line2 || ''} onChange={set('address_line2')} autoComplete="address-line2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input className={`${input} col-span-2 sm:col-span-1`} placeholder="City *" value={form.city} onChange={set('city')} autoComplete="address-level2" />
            <input className={input} placeholder="State" value={form.state || ''} onChange={set('state')} autoComplete="address-level1" />
            <input className={input} placeholder="ZIP" value={form.zip_code || ''} onChange={set('zip_code')} autoComplete="postal-code" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className={input} placeholder="Country *" value={form.country} onChange={set('country')} autoComplete="country-name" />
            <input className={input} placeholder="Phone for the courier (optional)" value={form.phone || ''} onChange={set('phone')} autoComplete="tel" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 pt-1">
            <input type="checkbox" className="accent-green-600" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
            Save this address to my warehouses
          </label>
        </div>
      )}
    </div>
  );
}
