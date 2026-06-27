'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, Landmark, Send, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Landmark },
  { name: 'Transactions', href: '/transactions', icon: ReceiptText },
  { name: 'Proposals', href: '/proposals', icon: Send },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-2xl border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 min-w-[4rem] rounded-xl p-2 transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                isActive ? 'bg-primary/10' : 'bg-transparent'
              }`}>
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
