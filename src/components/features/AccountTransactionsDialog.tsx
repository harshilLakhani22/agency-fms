'use client';

import { useState, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Account, Transaction } from '@/types';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatAmount } from '@/lib/utils';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight,
  Laptop, 
  Briefcase, 
  MessageSquare, 
  Monitor, 
  Eye, 
  HelpCircle,
  Search,
  Landmark,
  CreditCard,
  Banknote,
  ReceiptText,
  ExternalLink,
  Pencil
} from 'lucide-react';
import { EditTransactionDialog } from '@/components/features/EditTransactionDialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AccountTransactionsDialogProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountTransactionsDialog({ account, open, onOpenChange }: AccountTransactionsDialogProps) {
  const { transactions } = useTransactionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'withdrawal'>('all');

  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return transactions.filter(t => t.accountId === account.id);
  }, [account, transactions]);

  // Calculations for this account
  const { currentBalance, totalIn, totalOut, withdrawalTotal } = useMemo(() => {
    if (!account) return { currentBalance: 0, totalIn: 0, totalOut: 0, withdrawalTotal: 0 };
    let balance = account.initialBalance || 0;
    let inAmt = 0;
    let outAmt = 0;
    let withAmt = 0;

    accountTransactions.forEach(t => {
      if (t.type === 'income') {
        balance += t.amount;
        inAmt += t.amount;
      }
      if (t.type === 'expense') {
        balance -= t.amount;
        outAmt += t.amount;
        if (t.category === 'Partner Withdrawal') {
          withAmt += t.amount;
        }
      }
    });

    return {
      currentBalance: balance,
      totalIn: inAmt,
      totalOut: outAmt,
      withdrawalTotal: withAmt
    };
  }, [account, accountTransactions]);

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return accountTransactions
      .filter(t => {
        // Type filter
        if (typeFilter === 'income' && t.type !== 'income') return false;
        if (typeFilter === 'expense' && (t.type !== 'expense' || t.category === 'Partner Withdrawal')) return false;
        if (typeFilter === 'withdrawal' && t.category !== 'Partner Withdrawal') return false;

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchDesc = t.description?.toLowerCase().includes(query);
          const matchCat = t.category?.toLowerCase().includes(query);
          const matchAddedBy = t.addedByName?.toLowerCase().includes(query);
          const matchWithdrawnBy = t.withdrawnBy?.toLowerCase().includes(query);
          const matchAmount = String(t.amount).includes(query);
          return matchDesc || matchCat || matchAddedBy || matchWithdrawnBy || matchAmount;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.createdAt || 0) - (a.createdAt || 0));
  }, [accountTransactions, typeFilter, searchQuery]);

  if (!account) return null;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Landmark className="h-4 w-4" />;
      case 'credit': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <Banknote className="h-4 w-4" />;
      default: return <Landmark className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (type: string, category: string) => {
    const cat = category.toLowerCase();
    const baseClass = "h-3.5 w-3.5";
    
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
      <div className={`p-2 rounded-xl shrink-0 ${bgClass}`}>
        {icon}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border border-border/80 bg-card shadow-2xl flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                {getAccountIcon(account.type)}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>{account.name}</span>
                  <span className="text-xs uppercase px-2 py-0.5 rounded-md font-bold bg-muted text-muted-foreground border border-border/40">
                    {account.type}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <span>Owned by <strong className="text-foreground">{account.owner}</strong></span>
                  <span>•</span>
                  <span>Currency: <strong className="text-foreground">{account.currency || 'INR'}</strong></span>
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick Balance & Flow Stats Summary */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/40">
            <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">Balance</span>
              <div className="text-base font-extrabold text-foreground mt-0.5 truncate">
                {formatAmount(currentBalance, account.currency || 'INR')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">Total In</span>
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                +{formatAmount(totalIn, account.currency || 'INR')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">Total Out</span>
              <div className="text-base font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                -{formatAmount(totalOut, account.currency || 'INR')}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-border/40 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border/60 rounded-xl outline-none focus:border-primary/80 transition-colors text-foreground"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${typeFilter === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All ({accountTransactions.length})
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${typeFilter === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-muted-foreground hover:text-emerald-500'}`}
            >
              In
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-muted-foreground hover:text-rose-500'}`}
            >
              Out
            </button>
            <button
              onClick={() => setTypeFilter('withdrawal')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${typeFilter === 'withdrawal' ? 'bg-violet-600 text-white shadow-xs' : 'text-muted-foreground hover:text-violet-500'}`}
            >
              Withdrawals
            </button>
          </div>
        </div>

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <ReceiptText className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                {searchQuery ? 'Try adjusting your search or filters' : 'No activity recorded for this account yet'}
              </p>
            </div>
          ) : (
            filteredTransactions.map(t => {
              const isWithdrawal = t.category === 'Partner Withdrawal';
              return (
                <div 
                  key={t.id} 
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors group"
                >
                  {getCategoryIcon(t.type, t.category)}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{t.description}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      {isWithdrawal ? (
                        <span className="inline-flex items-center rounded-full bg-violet-500/10 text-violet-500 dark:bg-violet-400 px-2 py-0.5 text-[10px] font-semibold border border-violet-500/20 whitespace-nowrap">
                          Withdrawal • {t.withdrawnBy || t.addedByName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 text-[10px] font-semibold border border-primary/20 whitespace-nowrap">
                          {t.category}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {t.date}
                      </span>
                      {t.addedByName && !isWithdrawal && (
                        <span className="text-[10px] text-muted-foreground/70 italic">
                          by {t.addedByName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-bold tracking-tight ${
                        isWithdrawal 
                          ? 'text-violet-500 dark:text-violet-400' 
                          : t.type === 'income' 
                            ? 'text-emerald-500' 
                            : 'text-rose-500'
                      }`}>
                        {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount, t.currency || account.currency || 'INR')}
                      </span>
                    </div>

                    <EditTransactionDialog
                      transaction={t}
                      trigger={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit transaction"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing <strong>{filteredTransactions.length}</strong> of <strong>{accountTransactions.length}</strong> entries</span>
          <Link
            href={`/transactions`}
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <span>All Transactions</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
