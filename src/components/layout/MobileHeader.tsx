import { Wallet, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export function MobileHeader() {
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
      
      <div className="flex items-center gap-3">
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
