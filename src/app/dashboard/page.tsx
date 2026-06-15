'use client';

import { useEffect, useMemo } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { TransactionActions } from '@/components/features/TransactionActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  IndianRupee, 
  Laptop, 
  Briefcase, 
  MessageSquare, 
  Monitor, 
  ArrowLeftRight, 
  Eye, 
  HelpCircle 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { transactions, accounts, isLoading } = useTransactionStore();

  // Calculations
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    let totalInitialBalances = 0;
    accounts.forEach(acc => {
      totalInitialBalances += acc.initialBalance || 0;
    });

    transactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });

    return { 
      income, 
      expense, 
      net: income - expense,
      totalBalance: totalInitialBalances + income - expense 
    };
  }, [transactions, accounts]);

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981'];

  const getAccountName = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? `${acc.name} (${acc.owner})` : 'Unknown Account';
  };

  const getTransactionIcon = (type: string, category: string) => {
    const cat = category.toLowerCase();
    const baseClass = "h-4 w-4 sm:h-4.5 sm:w-4.5";
    
    let icon = type === 'income' ? <ArrowUpRight className={baseClass} /> : <ArrowDownRight className={baseClass} />;
    
    if (cat.includes('subscription') || cat.includes('software')) {
      icon = <Laptop className={baseClass} />;
    } else if (cat.includes('upwork') || cat.includes('connect')) {
      icon = <Briefcase className={baseClass} />;
    } else if (cat.includes('consult')) {
      icon = <MessageSquare className={baseClass} />;
    } else if (cat.includes('office') || cat.includes('equipment')) {
      icon = <Monitor className={baseClass} />;
    } else if (cat.includes('transfer')) {
      icon = <ArrowLeftRight className={baseClass} />;
    } else if (cat.includes('review')) {
      icon = <Eye className={baseClass} />;
    } else if (cat.includes('other')) {
      icon = <HelpCircle className={baseClass} />;
    }
    
    const bgClass = type === 'income' 
      ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20' 
      : 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20';
       
    return (
      <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${bgClass}`}>
        {icon}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <TransactionActions />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Balance Card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-zinc-900 to-black border border-border/80 shadow-md text-white transition-all duration-300 hover:shadow-lg">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">Total Balance</CardTitle>
            <div className="p-1.5 bg-white/10 text-white rounded-lg border border-white/10">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${stats.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isLoading ? <Skeleton className="h-8 w-32 bg-emerald-400/20" /> : `₹${formatCurrency(stats.totalBalance)}`}
            </div>
            <p className="text-[11px] text-zinc-300 mt-1">Consolidated active balance</p>
          </CardContent>
        </Card>

        {/* Total Income Card */}
        <Card className="relative overflow-hidden bg-card border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Total Income</CardTitle>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isLoading ? <Skeleton className="h-8 w-32" /> : `₹${formatCurrency(stats.income)}`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total received deposits</p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card className="relative overflow-hidden bg-card border border-border/80 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Total Expenses</CardTitle>
            <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {isLoading ? <Skeleton className="h-8 w-32" /> : `₹${formatCurrency(stats.expense)}`}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Total recorded spendings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-auto flex flex-col items-center justify-between pb-6">
            {expensesByCategory.length > 0 ? (
              <>
                <div className="relative w-full h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => `₹${formatCurrency(Number(value))}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--card)', color: 'var(--foreground)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* List of categories with values and percentages below the chart */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-border/40">
                  {expensesByCategory.map((entry, index) => {
                    const percentage = (entry.value / stats.expense) * 100;
                    const color = COLORS[index % COLORS.length];
                    return (
                      <div key={entry.name} className="flex items-center gap-2 text-xs bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/10">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{entry.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-semibold text-foreground/80">₹{formatCurrency(entry.value)}</span> ({percentage.toFixed(0)}%)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex w-full h-[200px] items-center justify-center text-muted-foreground">No expenses recorded</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3.5 pb-3.5">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center gap-3.5 border-b border-border/40 pb-3.5 last:border-0 last:pb-0 hover:bg-muted/10 p-1.5 -mx-1.5 rounded-xl transition-colors">
                      {getTransactionIcon(t.type, t.category)}
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          <span className="inline-flex items-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 text-[10px] font-semibold border border-primary/20 whitespace-nowrap">
                            {t.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[150px] sm:max-w-none">
                            {getAccountName(t.accountId)}
                          </span>
                          {t.addedByName && (
                            <>
                              <span className="text-[10px] text-muted-foreground/40">•</span>
                              <span className="text-[10px] text-muted-foreground/60 italic whitespace-nowrap">
                                by {t.addedByName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className={`text-sm sm:text-base font-bold tracking-tight ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'}₹{formatCurrency(t.amount)}
                        </span>
                        <span className="text-[11px] text-muted-foreground/80 font-medium mt-0.5 whitespace-nowrap">
                          {t.date}
                        </span>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center text-sm py-4 text-muted-foreground">No transactions yet.</div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
