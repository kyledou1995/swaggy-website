'use client';

import { useState } from 'react';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500';

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') || '');
    const company = String(data.get('company') || '');
    const email = String(data.get('email') || '');
    const topic = String(data.get('topic') || 'General question');
    const message = String(data.get('message') || '');

    const body = `${message}\n\n—\nName: ${name}\nCompany: ${company}\nEmail: ${email}`;
    const to = topic === 'Existing order' ? 'support@merchin.co' : 'hello@merchin.co';
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(`${topic} — ${company || name}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 p-6 sm:p-8 space-y-5 bg-white">
      <div className="grid sm:grid-cols-2 gap-5">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1.5">Name</span>
          <input name="name" required className={inputClass} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1.5">Company</span>
          <input name="company" className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1.5">Work email</span>
        <input name="email" type="email" required className={inputClass} />
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1.5">What can we help with?</span>
        <select name="topic" className={inputClass} defaultValue="New product / quote">
          <option>New product / quote</option>
          <option>Existing order</option>
          <option>Partnership</option>
          <option>General question</option>
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1.5">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Tell us about the product, quantities, and timeline."
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        className="w-full py-3 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition-colors"
      >
        Send Message
      </button>
      {sent && (
        <p className="text-sm text-gray-600 text-center">
          Your email app should open with your message ready to send. If it didn't, email us at{' '}
          <a href="mailto:hello@merchin.co" className="text-emerald-600 font-medium">hello@merchin.co</a>.
        </p>
      )}
    </form>
  );
}
