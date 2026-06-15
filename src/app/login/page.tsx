'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Pane - Branding & Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 relative overflow-hidden items-center justify-center border-r border-border/50">
        {/* Abstract Gradient Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#14a800]/20 via-zinc-950 to-zinc-950 opacity-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#14a800]/10 blur-[100px] pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 p-12 max-w-lg">
          <h1 className="text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            Manage your <br/>
            <span className="text-[#14a800]">agency finances</span> <br/>
            with precision.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            The exclusive internal dashboard for Harshil and Dhruvit. Track proposals, monitor connects, and analyze transactions securely in real-time.
          </p>
        </div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 relative bg-card">
        {/* Mobile-only background glow */}
        <div className="lg:hidden absolute top-0 right-0 w-64 h-64 bg-[#14a800]/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="w-full max-w-[440px] space-y-10 relative z-10">
          {/* Mobile-only Header */}
          <div className="flex flex-col lg:hidden mb-8">
            <h1 className="text-3xl font-bold text-foreground">FinTracker</h1>
            <p className="text-muted-foreground mt-2">Secure internal dashboard</p>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Please enter your email and password to log in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-background border-border focus-visible:ring-[#14a800]/50 focus-visible:border-[#14a800]/50 transition-all rounded-xl text-base"
                  placeholder="name@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-background border-border focus-visible:ring-[#14a800]/50 focus-visible:border-[#14a800]/50 transition-all rounded-xl text-base"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-xl h-14 text-base font-bold transition-all shadow-xl bg-[#14a800] hover:bg-[#14a800]/90 text-white shadow-[#14a800]/20 hover:shadow-[#14a800]/40 flex items-center justify-center group" 
              disabled={loading || !email || !password}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Sign In 
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground pt-4">
            Authorized personnel only. Access is heavily monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
