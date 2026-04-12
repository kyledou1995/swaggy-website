'use client';

import Link from 'next/link';
import { Mail, Link2, Globe } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    company: [
      { label: 'About Us', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
    ],
    platform: [
      { label: 'Features', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'API Docs', href: '#' },
    ],
    resources: [
      { label: 'Help Center', href: '#' },
      { label: 'Contact', href: 'mailto:hello@swaggy.co' },
      { label: 'Pricing', href: '#pricing' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Branding */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <span className="text-lg font-bold text-gray-900">swaggy</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Supply chain sourcing for ecommerce brands that don't want to manage it themselves.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Company
            </h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Platform
            </h4>
            <ul className="space-y-3">
              {links.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Resources
            </h4>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
              Legal
            </h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-8">
          {/* Contact & Social */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-gray-600" />
              <a
                href="mailto:hello@swaggy.co"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                hello@swaggy.co
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="LinkedIn"
                className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Link2 size={20} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="p-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Globe size={20} />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-600">
              Copyright {currentYear} Swaggy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
