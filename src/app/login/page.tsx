'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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
      setError(err.message || 'Authentication failed. Please check your password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden p-4 sm:p-8">
      {/* Premium ambient background effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#14a800]/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14a800]/20 border border-[#14a800]/30 shadow-lg shadow-[#14a800]/10 mb-6">
            <Wallet className="h-8 w-8 text-[#14a800]" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">FinTracker</h1>
          <p className="text-sm text-muted-foreground/80 mt-2">
            Secure internal financial dashboard
          </p>
        </div>

        <Card className="border-[#14a800]/20 shadow-2xl bg-card/95 backdrop-blur-2xl rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#14a800]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          
          <CardHeader className="relative z-10 pt-8 pb-4 px-8">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground/80">
              Select your account and enter your password.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="relative z-10">
            <CardContent className="space-y-5 px-8">
              {error && (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-medium text-destructive text-center">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className={`h-12 border-border/60 ${email === 'harshillakhani2264@gmail.com' ? 'border-[#14a800] bg-[#14a800]/10 text-[#14a800]' : 'hover:bg-muted/50'}`}
                  onClick={() => setEmail('harshillakhani2264@gmail.com')}
                >
                  <User className="w-4 h-4 mr-2" /> Harshil
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`h-12 border-border/60 ${email === 'navadiyadhruvit@gmail.com' ? 'border-[#14a800] bg-[#14a800]/10 text-[#14a800]' : 'hover:bg-muted/50'}`}
                  onClick={() => setEmail('navadiyadhruvit@gmail.com')}
                >
                  <User className="w-4 h-4 mr-2" /> Dhruvit
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  readOnly
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 transition-all rounded-xl text-sm text-muted-foreground"
                  placeholder="Select your account above"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 bg-background/50 border-border/60 focus-visible:ring-[#14a800]/30 transition-all rounded-xl text-sm"
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-5 pb-8 px-8 mt-2">
              <Button 
                type="submit" 
                className="w-full rounded-xl h-14 text-sm font-bold tracking-wide transition-all duration-300 shadow-xl bg-[#14a800] hover:bg-[#14a800]/90 text-white shadow-[#14a800]/30 hover:shadow-[#14a800]/50" 
                disabled={loading || !email}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
