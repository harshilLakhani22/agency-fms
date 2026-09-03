'use client';

import { Wallet, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useSandboxStore } from '@/store/useSandboxStore';

export function MobileHeader() {
  const { isSandbox, toggleSandbox } = useSandboxStore();

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-16 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Wallet className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight">FinTracker</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSandbox}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
            isSandbox 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
          }`}
          title="Click to toggle sandbox mode"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isSandbox ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          {isSandbox ? 'Sandbox' : 'Live'}
        </button>
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
