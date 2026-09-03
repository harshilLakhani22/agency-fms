'use client';

import { useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatAmount } from '@/lib/utils';
import { ArrowDownLeft, WalletCards, ReceiptText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PartnerWithdrawalsDialogProps {
  partner: 'Harshil' | 'Dhruvit' | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerWithdrawalsDialog({ partner, open, onOpenChange }: PartnerWithdrawalsDialogProps) {
  const { transactions, accounts, currencySettings } = useTransactionStore();

  const partnerWithdrawals = useMemo(() => {
    if (!partner) return [];
    return transactions
      .filter(t => {
        if (t.category !== 'Partner Withdrawal') return false;
        const p = t.withdrawnBy || t.addedByName || 'Harshil';
        return p === partner;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || (b.createdAt || 0) - (a.createdAt || 0));
  }, [transactions, partner]);

  const { totalINR, totalUSD, combinedTotal } = useMemo(() => {
    let inr = 0;
    let usd = 0;
    partnerWithdrawals.forEach(t => {
      const isUSD = t.currency === 'USD' || accounts.find(a => a.id === t.accountId)?.currency === 'USD';
      if (isUSD) usd += t.amount;
      else inr += t.amount;
    });
    const rate = currencySettings?.defaultExchangeRate || 85;
    return {
      totalINR: inr,
      totalUSD: usd,
      combinedTotal: inr + (usd * rate)
    };
  }, [partnerWithdrawals, accounts, currencySettings]);

  if (!partner) return null;

  const isHarshil = partner === 'Harshil';
  const themeColor = isHarshil ? 'indigo' : 'fuchsia';

  const getAccountName = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    return acc ? acc.name : 'Unknown Account';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-border/80 bg-card shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <DialogHeader className={`p-5 pb-4 border-b border-border/50 ${isHarshil ? 'bg-indigo-500/5' : 'bg-fuchsia-500/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border shrink-0 ${
              isHarshil 
                ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' 
                : 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20'
            }`}>
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>{partner}&apos;s Withdrawals</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isHarshil 
                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' 
                    : 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20'
                }`}>
                  Partner
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                All-time recorded draws from agency funds
              </DialogDescription>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="mt-4 p-3 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                Total Drawn
              </span>
              <div className="text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
                {formatAmount(combinedTotal, 'INR')}
              </div>
              {totalUSD > 0 && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Includes {formatAmount(totalUSD, 'USD')} ({formatAmount(totalINR, 'INR')} in INR)
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                {partnerWithdrawals.length} {partnerWithdrawals.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Withdrawal List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
          {partnerWithdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <ReceiptText className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium">No withdrawals recorded yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Use the &quot;Withdraw&quot; button on the dashboard to record a new draw.
              </p>
            </div>
          ) : (
            partnerWithdrawals.map(t => (
              <div 
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors group"
              >
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 shrink-0">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {t.description || `Withdrawal by ${partner}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {getAccountName(t.accountId)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 opacity-60" />
                      {t.date ? format(new Date(t.date + 'T00:00:00'), 'dd MMM yyyy') : 'No date'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-violet-500 dark:text-violet-400 tracking-tight">
                    -{formatAmount(t.amount, t.currency || 'INR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/40 bg-muted/20 flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
