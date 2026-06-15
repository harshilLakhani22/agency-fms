'use client';

import { useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTransactionStore } from '@/store/useTransactionStore';
import { AccountForm } from '@/components/features/AccountForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, CreditCard, Banknote, TrendingUp, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountsPage() {
  const { accounts, setAccounts, transactions, setLoading, isLoading } = useTransactionStore();

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'accounts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setAccounts(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching accounts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setAccounts, setLoading]);

  const accountBalances = useMemo(() => {
    return accounts.map(acc => {
      // Find all transactions for this account
      const accTransactions = transactions.filter(t => t.accountId === acc.id);
      
      let currentBalance = acc.initialBalance;
      accTransactions.forEach(t => {
        if (t.type === 'income') currentBalance += t.amount;
        if (t.type === 'expense') currentBalance -= t.amount;
      });

      return {
        ...acc,
        currentBalance
      };
    });
  }, [accounts, transactions]);

  const totalBalance = useMemo(() => {
    return accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0);
  }, [accountBalances]);

  const statsByType = useMemo(() => {
    let bank = 0;
    let credit = 0;
    let cash = 0;
    accountBalances.forEach(acc => {
      if (acc.type === 'bank') bank += acc.currentBalance;
      if (acc.type === 'credit') credit += acc.currentBalance;
      if (acc.type === 'cash') cash += acc.currentBalance;
    });
    return { bank, credit, cash };
  }, [accountBalances]);

  const getIcon = (type: string) => {
    switch(type) {
      case 'bank': return <Landmark className="h-5 w-5" />;
      case 'credit': return <CreditCard className="h-5 w-5" />;
      case 'cash': return <Banknote className="h-5 w-5" />;
      default: return <Landmark className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bank Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your balances across multiple institutions.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AccountForm />
        </div>
      </div>

      {/* Top Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Net Worth Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-border/80 shadow-md col-span-full md:col-span-1 text-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Total Balance</p>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {isLoading ? <Skeleton className="h-8 w-32 bg-white/20" /> : `₹${formatCurrency(totalBalance)}`}
              </h3>
              <p className="text-[11px] text-zinc-300 mt-1">
                Across {accounts.length} active accounts
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
              Active
            </div>
          </CardContent>
        </Card>

        {/* Bank Type Card */}
        <Card className="bg-card border border-border/80 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Institutions</p>
            <Landmark className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <h4 className="text-2xl font-bold text-foreground">₹{formatCurrency(statsByType.bank)}</h4>}
            <p className="text-[11px] text-muted-foreground mt-1">Cash held in bank accounts</p>
          </CardContent>
        </Card>

        {/* Cash Type Card */}
        <Card className="bg-card border border-border/80 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Physical Cash</p>
            <Banknote className="h-4 w-4 text-emerald-500 shrink-0" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <h4 className="text-2xl font-bold text-foreground">₹{formatCurrency(statsByType.cash)}</h4>}
            <p className="text-[11px] text-muted-foreground mt-1">Liquid on-hand currency</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map(i => (
              <Card key={i} className="relative overflow-hidden bg-card/50 shadow-sm border border-border/50 h-[210px] flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-xl" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-8 w-40" />
                </CardContent>
                <div className="h-10 border-t border-border/40 bg-muted/20 px-6 flex items-center justify-between">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </Card>
            ))}
          </>
        ) : accountBalances.length === 0 ? (
          <div className="text-muted-foreground col-span-full border-2 border-dashed rounded-xl p-12 text-center">
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No accounts found</h3>
            <p className="text-sm">Add a bank account to start tracking your balances.</p>
          </div>
        ) : (
          accountBalances.map(acc => {
            const gradientsByType = {
              bank: [
                'from-[#1e3a8a] via-[#1e40af] to-[#0f172a] border-blue-500/30', // Deep Indigo Blue
                'from-[#0369a1] via-[#0284c7] to-[#0f172a] border-sky-500/30',  // Sky Ocean Blue
                'from-[#1d4ed8] via-[#2563eb] to-[#0f172a] border-blue-600/30', // Electric Royal Blue
              ],
              credit: [
                'from-[#581c87] via-[#6b21a8] to-[#0f172a] border-purple-500/30', // Deep Purple
                'from-[#701a75] via-[#86198f] to-[#0f172a] border-fuchsia-500/30', // Fuchsia/Magenta
                'from-[#4c1d95] via-[#5b21b6] to-[#0f172a] border-violet-600/30',  // Dark Violet
              ],
              cash: [
                'from-[#064e3b] via-[#047857] to-[#0f172a] border-emerald-500/30', // Deep Emerald
                'from-[#0f766e] via-[#0d9488] to-[#0f172a] border-teal-500/30',    // Teal Green
                'from-[#14532d] via-[#166534] to-[#0f172a] border-green-600/30',   // Forest Green
              ],
            };

            const typeList = accounts.filter(a => a.type === acc.type);
            const typeIndex = typeList.findIndex(a => a.id === acc.id);
            const gradients = gradientsByType[acc.type as keyof typeof gradientsByType] || gradientsByType.bank;
            const gradientClass = (gradients[typeIndex % gradients.length] || gradients[0]) + ' text-white';

            // Compute account statistics
            const accTx = transactions.filter(t => t.accountId === acc.id);
            const totalTxCount = accTx.length;
            let totalIncome = 0;
            let totalExpense = 0;
            accTx.forEach(t => {
              if (t.type === 'income') totalIncome += t.amount;
              if (t.type === 'expense') totalExpense += t.amount;
            });

            return (
              <Card 
                key={acc.id} 
                className={`relative overflow-hidden bg-gradient-to-br ${gradientClass} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group border`}
              >
                {/* Decorative Card Shapes */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 blur-sm pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-black/20 rounded-full blur-md pointer-events-none" />

                {/* Card Header */}
                <CardHeader className="pb-2 relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl font-bold tracking-tight text-white">
                          {acc.name}
                        </CardTitle>
                        <Sparkles className="h-3.5 w-3.5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white border border-white/10 shadow-sm">
                          {acc.type}
                        </span>
                        {acc.owner && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/80">
                            • Owned by <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-md border border-white/10 shadow-sm">{acc.owner}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner text-white group-hover:bg-white/20 transition-colors shrink-0">
                      {getIcon(acc.type)}
                    </div>
                  </div>
                </CardHeader>

                {/* Card Content - Balance display */}
                <CardContent className="pt-2 pb-4 relative z-10">
                  <p className="text-[9px] uppercase font-bold tracking-widest text-white/60 mb-0.5">Current Balance</p>
                  <div className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    ₹{formatCurrency(acc.currentBalance)}
                  </div>
                  <div className="text-[11px] text-white/70 mt-1.5 flex justify-between items-center">
                    <span>Initial Deposit: ₹{formatCurrency(acc.initialBalance)}</span>
                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px]">
                      {totalTxCount} {totalTxCount === 1 ? 'Transaction' : 'Transactions'}
                    </span>
                  </div>
                </CardContent>

                {/* Mini Account Income/Expense breakdown */}
                <div className="border-t border-white/10 bg-black/15 px-6 py-3 relative z-10 flex items-center justify-between gap-4 text-[10px] font-semibold text-white/90">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>In: +₹{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span>Out: -₹{formatCurrency(totalExpense)}</span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
