'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { TransactionActions } from '@/components/features/TransactionActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowDownLeft,
  IndianRupee, 
  Laptop, 
  Briefcase, 
  MessageSquare, 
  Monitor, 
  ArrowLeftRight, 
  Eye, 
  HelpCircle,
  WalletCards,
  Scale,
  CheckCircle2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatAmount } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerWithdrawalsDialog } from '@/components/features/PartnerWithdrawalsDialog';

export default function DashboardPage() {
  const { transactions, allTransactions, accounts, isLoading, currencySettings } = useTransactionStore();
  const [selectedPartnerForWithdrawals, setSelectedPartnerForWithdrawals] = useState<'Harshil' | 'Dhruvit' | null>(null);

  const { stats, usdStats } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let usdIncome = 0;
    let usdExpense = 0;

    let displayIncome = 0;
    let displayExpense = 0;
    let displayUsdIncome = 0;
    let displayUsdExpense = 0;
    
    let totalInitialBalances = 0;
    let totalUSDInitialBalances = 0;

    accounts.forEach(acc => {
      if (acc.currency === 'USD') {
        totalUSDInitialBalances += acc.initialBalance || 0;
      } else {
        totalInitialBalances += acc.initialBalance || 0;
      }
    });

    transactions.forEach(t => {
      const isUSD = t.currency === 'USD' || accounts.find(a => a.id === t.accountId)?.currency === 'USD';
      const isTransfer = t.category === 'Currency Transfer' || t.category === 'Internal Transfer';
      const isWithdrawal = t.category === 'Partner Withdrawal';

      if (isUSD) {
        if (t.type === 'income') {
          usdIncome += t.amount;
          if (!isTransfer) displayUsdIncome += t.amount;
        }
        if (t.type === 'expense') {
          usdExpense += t.amount;
          // Option A: Exclude partner withdrawals from operational business expenses
          if (!isTransfer && !isWithdrawal) displayUsdExpense += t.amount;
        }
      } else {
        if (t.type === 'income') {
          income += t.amount;
          if (!isTransfer) displayIncome += t.amount;
        }
        if (t.type === 'expense') {
          expense += t.amount;
          // Option A: Exclude partner withdrawals from operational business expenses
          if (!isTransfer && !isWithdrawal) displayExpense += t.amount;
        }
      }
    });

    return { 
      stats: {
        income: displayIncome, 
        expense: displayExpense, 
        net: displayIncome - displayExpense,
        totalBalance: totalInitialBalances + income - expense 
      },
      usdStats: {
        income: displayUsdIncome,
        expense: displayUsdExpense,
        net: displayUsdIncome - displayUsdExpense,
        totalBalance: totalUSDInitialBalances + usdIncome - usdExpense
      }
    };
  }, [transactions, accounts]);

  const withdrawalData = useMemo(() => {
    const withdrawalTxs = transactions.filter(t => t.category === 'Partner Withdrawal');

    let harshilINR = 0;
    let harshilUSD = 0;
    let dhruvitINR = 0;
    let dhruvitUSD = 0;

    withdrawalTxs.forEach(t => {
      const isUSD = t.currency === 'USD' || accounts.find(a => a.id === t.accountId)?.currency === 'USD';
      const partner = t.withdrawnBy || t.addedByName || 'Harshil';
      if (partner === 'Harshil') {
        if (isUSD) harshilUSD += t.amount;
        else harshilINR += t.amount;
      } else {
        if (isUSD) dhruvitUSD += t.amount;
        else dhruvitINR += t.amount;
      }
    });

    const rate = currencySettings?.defaultExchangeRate || 85;
    const harshilCombined = harshilINR + (harshilUSD * rate);
    const dhruvitCombined = dhruvitINR + (dhruvitUSD * rate);
    const totalCombined = harshilCombined + dhruvitCombined;
    const diff = Math.abs(harshilCombined - dhruvitCombined);
    const leader = harshilCombined > dhruvitCombined ? 'Harshil' : dhruvitCombined > harshilCombined ? 'Dhruvit' : 'Equal';

    const harshilPct = totalCombined > 0 ? Math.round((harshilCombined / totalCombined) * 100) : 50;
    const dhruvitPct = totalCombined > 0 ? (100 - harshilPct) : 50;

    return {
      harshilINR,
      harshilUSD,
      harshilCombined,
      dhruvitINR,
      dhruvitUSD,
      dhruvitCombined,
      totalCombined,
      diff,
      leader,
      harshilPct,
      dhruvitPct,
      count: withdrawalTxs.length,
    };
  }, [transactions, accounts, currencySettings]);

  const expensesByCategory = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && t.category !== 'Currency Transfer' && t.category !== 'Internal Transfer' && t.category !== 'Partner Withdrawal');
    const grouped = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return [...allTransactions]
      .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
      .slice(0, 5);
  }, [allTransactions]);

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
    } else if (cat.includes('withdraw')) {
      icon = <ArrowDownLeft className={baseClass} />;
    } else if (cat.includes('review')) {
      icon = <Eye className={baseClass} />;
    } else if (cat.includes('other')) {
      icon = <HelpCircle className={baseClass} />;
    }
    
    const bgClass = cat.includes('withdraw')
      ? 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20'
      : type === 'income' 
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
            {isLoading ? (
              <Skeleton className="h-10 w-40 bg-white/20" />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-400">
                    {formatAmount(stats.totalBalance, 'INR')}
                  </span>
                  {usdStats.totalBalance > 0 && (
                    <>
                      <span className="text-white/50 hidden sm:block font-bold text-xl">+</span>
                      <span className="text-2xl font-bold tracking-tight text-white">
                        {formatAmount(usdStats.totalBalance, 'USD')}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm font-medium text-zinc-400 flex items-center gap-1.5 mt-1">
                  <span>~</span>
                  <span className="text-zinc-300">
                    {formatAmount(stats.totalBalance + (usdStats.totalBalance * currencySettings.defaultExchangeRate), 'INR')}
                  </span>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider ml-1">Approx Combined</span>
                </div>
              </div>
            )}
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
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-extrabold tracking-tight text-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>{formatAmount(stats.income, 'INR')}</span>
                {usdStats.income > 0 && (
                  <span className="text-xl sm:text-2xl text-emerald-500">+{formatAmount(usdStats.income, 'USD')}</span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total received deposits</p>
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
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-extrabold tracking-tight text-foreground flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>{formatAmount(stats.expense, 'INR')}</span>
                {usdStats.expense > 0 && (
                  <span className="text-xl sm:text-2xl text-rose-500">+{formatAmount(usdStats.expense, 'USD')}</span>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Operational business spending</p>
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
                    const percentage = ((entry.value / stats.expense) * 100).toFixed(0);
                    const color = COLORS[index % COLORS.length];
                    return (
                      <div key={entry.name} className="flex items-center gap-2 text-xs bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/10">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{entry.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-semibold text-foreground/80">{formatAmount(entry.value, 'INR')}</span> ({percentage}%)
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
                  {recentTransactions.map(t => (
                    <div key={t.id} className={`flex items-center gap-3.5 border-b border-border/40 pb-3.5 last:border-0 last:pb-0 hover:bg-muted/10 p-1.5 -mx-1.5 rounded-xl transition-colors ${t.isDeleted ? 'opacity-60 grayscale' : ''}`}>
                      {getTransactionIcon(t.type, t.category)}
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                          {t.isDeleted && (
                            <span className="inline-flex items-center rounded-full bg-rose-500/10 text-rose-500 px-2 py-0.5 text-[10px] font-bold border border-rose-500/20 whitespace-nowrap">
                              DELETED
                            </span>
                          )}
                          {t.category === 'Partner Withdrawal' ? (
                            <span className="inline-flex items-center rounded-full bg-violet-500/10 text-violet-500 dark:bg-violet-400 px-2 py-0.5 text-[10px] font-semibold border border-violet-500/20 whitespace-nowrap">
                              Withdrawal • {t.withdrawnBy || t.addedByName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 text-[10px] font-semibold border border-primary/20 whitespace-nowrap">
                              {t.category}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[150px] sm:max-w-none">
                            {getAccountName(t.accountId)}
                          </span>
                          {t.addedByName && t.category !== 'Partner Withdrawal' && (
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
                        <span className={`text-sm sm:text-base font-bold tracking-tight ${
                          t.category === 'Partner Withdrawal'
                            ? 'text-violet-500 dark:text-violet-400'
                            : t.type === 'income' 
                              ? 'text-emerald-500' 
                              : 'text-rose-500'
                        }`}>
                          {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency || 'INR')}
                        </span>
                        <span className="text-[11px] text-muted-foreground/80 font-medium mt-0.5 whitespace-nowrap">
                          {t.date}
                        </span>
                      </div>
                    </div>
                  ))}
                  {recentTransactions.length === 0 && (
                    <div className="text-center text-sm py-4 text-muted-foreground">No recent activity.</div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Minimized Partner Withdrawals Summary at Bottom */}
      <Card className="border border-border/80 bg-card/60 shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Summary Title & Total */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 text-violet-500 rounded-xl border border-violet-500/20 shrink-0">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Partner Withdrawals</span>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                    All Time • {withdrawalData.count} {withdrawalData.count === 1 ? 'draw' : 'draws'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg font-extrabold text-foreground">
                    {formatAmount(withdrawalData.totalCombined, 'INR')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({withdrawalData.leader === 'Equal' ? '50/50 Equal' : `${withdrawalData.leader} is +${formatAmount(withdrawalData.diff, 'INR')}`})
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Harshil & Dhruvit Compact Cards with Details Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              {/* Harshil */}
              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-muted/40 border border-border/60 min-w-[200px] flex-1 sm:flex-initial">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 shadow-xs" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">Harshil</span>
                    </div>
                    <div className="text-sm font-extrabold text-foreground mt-0.5">
                      {formatAmount(withdrawalData.harshilCombined, 'INR')}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedPartnerForWithdrawals('Harshil')}
                  className="h-7 px-2.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg cursor-pointer shrink-0"
                >
                  Details
                </Button>
              </div>

              {/* Dhruvit */}
              <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-muted/40 border border-border/60 min-w-[200px] flex-1 sm:flex-initial">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shrink-0 shadow-xs" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">Dhruvit</span>
                    </div>
                    <div className="text-sm font-extrabold text-foreground mt-0.5">
                      {formatAmount(withdrawalData.dhruvitCombined, 'INR')}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedPartnerForWithdrawals('Dhruvit')}
                  className="h-7 px-2.5 text-xs font-bold text-fuchsia-500 hover:text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-lg cursor-pointer shrink-0"
                >
                  Details
                </Button>
              </div>
            </div>
          </div>

          {/* Compact Proportion Bar */}
          {withdrawalData.totalCombined > 0 && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div 
                  className="bg-indigo-500 transition-all duration-300" 
                  style={{ width: `${withdrawalData.harshilPct}%` }}
                />
                <div 
                  className="bg-fuchsia-500 transition-all duration-300" 
                  style={{ width: `${withdrawalData.dhruvitPct}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Withdrawals Details Dialog */}
      <PartnerWithdrawalsDialog
        partner={selectedPartnerForWithdrawals}
        open={!!selectedPartnerForWithdrawals}
        onOpenChange={(open) => !open && setSelectedPartnerForWithdrawals(null)}
      />
    </div>
  );
}
