'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
    ],
    platform: [
      { label: 'Features', href: '/features' },
      { label: 'Security', href: '/security' },
      { label: 'API Docs', href: '/api-docs' },
    ],
    resources: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact', href: '/contact' },
      { label: 'Pricing', href: '/#pricing' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Branding */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-6">
              <Logo />
            </div>
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
                href="mailto:hello@merchin.co"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                hello@merchin.co
              </a>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 transition-colors">
                Log In
              </Link>
              <Link
                href="/auth/signup"
                className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center sm:text-left">
            <p className="text-xs text-gray-600">
              Copyright {currentYear} Merchin. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
