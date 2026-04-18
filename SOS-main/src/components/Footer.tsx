import Link from 'next/link';
import { ShieldAlert, Heart, ArrowUpRight } from 'lucide-react';

const LINKS = {
  Product: [
    { label: 'Dashboard', href: '/sos' },
    { label: 'Safety Guide', href: '/blogs' },
    { label: 'Messages', href: '/chat' },
    { label: 'Pricing', href: '/plans' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Support', href: '/support' },
    { label: 'Privacy', href: '/privacy-policy' },
  ],
  Emergency: [
    { label: 'Ambulance — 115', href: '#' },
    { label: 'Fire — 16', href: '#' },
    { label: 'Police — 15', href: '#' },
    { label: 'Rescue — 1122', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-gold to-accent-blue flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-text-primary">SOS Emergency</span>
            </div>
            <p className="text-sm text-text-tertiary leading-relaxed max-w-xs">
              AI-powered emergency detection and response. Because every second matters.
            </p>
          </div>

          {Object.entries(LINKS).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}
                      className="group text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {item.label}
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border-default mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
          <p> SOS Emergency. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-accent-coral" /> for safety
          </p>
        </div>
      </div>
    </footer>
  );
}
