'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Vente', icon: '💵' },
  { href: '/dashboard/ventes', label: 'Historique', icon: '📋' },
  { href: '/dashboard/credits', label: 'Ardoise', icon: '🤝' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line flex safe-bottom">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium ${
              active ? 'text-gold-dark' : 'text-ink/40'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
