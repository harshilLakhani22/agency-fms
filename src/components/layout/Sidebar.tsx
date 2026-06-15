'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, LogOut, Wallet, Landmark, Send } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { ThemeToggle } from '@/components/theme-toggle';
const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Landmark },
  { name: 'Transactions', href: '/transactions', icon: ReceiptText },
  { name: 'Proposals', href: '/proposals', icon: Send },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card px-4 py-6 shrink-0">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">FinTracker</span>
      </div>
      
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 flex items-center gap-2 border-t border-border/40">
        <button
          onClick={handleLogout}
          className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-500 transition-all hover:bg-rose-500/15"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
        <ThemeToggle />
      </div>
    </div>
  );
}
