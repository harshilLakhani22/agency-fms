'use client';

import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { BottomNav } from './BottomNav';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useProposalStore } from '@/store/useProposalStore';
import { useSandboxStore } from '@/store/useSandboxStore';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const allowedEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS?.split(',') || [];
  const isAuthorized = user?.email && allowedEmails.includes(user.email);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const subscribeTransactions = useTransactionStore(state => state.subscribe);
  const subscribeProposals = useProposalStore(state => state.subscribe);
  const { isSandbox, toggleSandbox } = useSandboxStore();

  useEffect(() => {
    if (!user || !isAuthorized) return;
    
    const unsubTransactions = subscribeTransactions();
    const unsubProposals = subscribeProposals(user.uid);
    
    return () => {
      unsubTransactions();
      unsubProposals();
    };
  }, [user, isAuthorized, subscribeTransactions, subscribeProposals]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Ignore AbortError / browser network connection aborts to prevent dev console warnings
      const reason = event.reason;
      if (
        reason &&
        (reason.name === 'AbortError' ||
         reason.name === 'TypeError' ||
         reason.message?.includes('aborted') ||
         reason.message?.includes('AbortError') ||
         reason.message?.includes('Failed to fetch') ||
         String(reason).includes('AbortError') ||
         String(reason).includes('Failed to fetch') ||
         String(reason).includes('aborted'))
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't show layout wrapper on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) return null;

  // Render Access Denied layout for unauthorized users
  if (user && !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl p-8 relative z-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto mb-6 border border-rose-500/20 shadow-sm animate-pulse">
            <ShieldAlert className="h-7 w-7" />
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Access Denied</h2>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            This dashboard is private and only accessible to authorized team members. 
            You are currently signed in as:
            <span className="block mt-2 font-semibold text-foreground bg-muted/50 py-1.5 px-3 rounded-lg border border-border/40 truncate text-xs">
              {user.email}
            </span>
          </p>
          
          <button
            onClick={() => signOut(auth)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out & Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <MobileHeader />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-20 pb-20 px-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {isSandbox && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md px-4 py-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-600 dark:text-amber-400">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-xs">
                  <div className="font-bold flex items-center gap-2">
                    <span>Sandbox Safe Mode Active</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    Viewing real production data with <strong>all writes 100% isolated in memory</strong>. Testing will never modify your Firestore database.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={toggleSandbox}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 bg-background/80 hover:bg-background text-foreground transition-all cursor-pointer shadow-sm"
                >
                  Switch to Live Mode
                </button>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
