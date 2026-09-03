'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, ArrowDownLeft, CalendarIcon, IndianRupee, DollarSign, Wallet } from 'lucide-react';
import { safeAddTransaction } from '@/lib/safeOps';

const formatIndianNumber = (val: string) => {
  if (!val) return '';
  const parts = val.split('.');
  if (parts[0]) {
    parts[0] = parseInt(parts[0], 10).toLocaleString('en-IN');
  }
  return parts.join('.');
};

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WithdrawalDialog({ open, onOpenChange, onSuccess }: WithdrawalDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [withdrawnBy, setWithdrawnBy] = useState<'Harshil' | 'Dhruvit'>('Harshil');
  const [description, setDescription] = useState('');

  const { accounts } = useTransactionStore();

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isUSD = selectedAccount?.currency === 'USD';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accountId || !amount) return;

    const currency = selectedAccount?.currency || 'INR';

    setLoading(true);
    try {
      await safeAddTransaction({
        type: 'expense',
        accountId,
        amount: parseFloat(amount),
        currency,
        date,
        category: 'Partner Withdrawal',
        description: description.trim() || `Withdrawal by ${withdrawnBy}`,
        addedBy: user.uid,
        addedByName: withdrawnBy,
        withdrawnBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      onOpenChange(false);
      setAmount('');
      setDescription('');
      setAccountId('');
      setWithdrawnBy('Harshil');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error recording withdrawal: ', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card/95 backdrop-blur-2xl border-violet-500/20 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="p-6 pb-4">
          <DialogHeader className="relative z-10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center border border-violet-500/30 shrink-0">
                <ArrowDownLeft className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left">
                  Record Withdrawal
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground/80 text-left mt-0.5">
                  Record money withdrawn by a partner from agency funds.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form id="withdrawal-form" onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Amount and Date Input Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount-withdrawal" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                  Amount ({isUSD ? '$' : '₹'})
                </Label>
                <div className="relative flex items-center justify-center">
                  <div className="absolute left-3 text-muted-foreground font-bold text-lg">
                    {isUSD ? <DollarSign className="w-5 h-5" /> : <IndianRupee className="w-5 h-5" />}
                  </div>
                  <Input
                    id="amount-withdrawal"
                    type="text"
                    inputMode="decimal"
                    required
                    value={formatIndianNumber(amount)}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                        setAmount(raw);
                      }
                    }}
                    placeholder="0.00"
                    className="text-left text-2xl font-bold h-14 rounded-xl bg-background/50 border-border/60 focus-visible:ring-violet-500/30 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="withdrawal-date" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-border/60 focus-visible:ring-violet-500/30 transition-all rounded-xl h-14 px-3",
                          !date && "text-muted-foreground"
                        )}
                      />
                    }
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {date ? format(new Date(date + 'T00:00:00'), "dd MMM yyyy") : "Pick a date"}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-violet-500/20 shadow-xl rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={date ? new Date(date) : undefined}
                      onSelect={(newDate) => {
                        if (newDate) {
                          const tzOffset = newDate.getTimezoneOffset() * 60000;
                          const localISOTime = (new Date(newDate.getTime() - tzOffset)).toISOString().slice(0, -1);
                          setDate(localISOTime.split('T')[0]);
                        }
                      }}
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Partner and Bank Account Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="withdrawnBy" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                  Partner
                </Label>
                <Select required value={withdrawnBy} onValueChange={(val: any) => setWithdrawnBy(val)}>
                  <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-violet-500/30 transition-all rounded-xl h-14">
                    <SelectValue placeholder="Select partner">
                      {(value) => value || 'Select partner'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Harshil">Harshil</SelectItem>
                    <SelectItem value="Dhruvit">Dhruvit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="withdrawal-account" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                  From Account
                </Label>
                <Select required value={accountId} onValueChange={(val) => setAccountId(val || '')}>
                  <SelectTrigger className="bg-background/50 border-border/60 focus-visible:ring-violet-500/30 transition-all rounded-xl h-14">
                    <SelectValue placeholder="Select account">
                      {(value) => {
                        const acc = accounts.find((a) => a.id === value);
                        return acc ? `${acc.name}` : 'Select account';
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency || 'INR'})
                      </SelectItem>
                    ))}
                    {accounts.length === 0 && (
                      <SelectItem value="none" disabled>No accounts</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Note / Description */}
            <div className="space-y-1.5">
              <Label htmlFor="withdrawal-description" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90">
                Note (Optional)
              </Label>
              <Input
                id="withdrawal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Profit distribution / Personal draw"
                className="bg-background/50 border-border/60 focus-visible:ring-violet-500/30 transition-all rounded-xl h-14 text-sm"
              />
            </div>
          </form>
        </div>

        <div className="p-6 pt-4 bg-muted/30 border-t border-border/40 mt-2">
          <Button
            type="submit"
            form="withdrawal-form"
            className="w-full rounded-xl h-12 text-sm font-bold tracking-wide transition-all duration-300 shadow-xl bg-violet-600 hover:bg-violet-500 text-white shadow-violet-900/50 hover:shadow-violet-600/50"
            disabled={loading || !amount || parseFloat(amount) <= 0 || !accountId || accountId === 'none'}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Withdrawal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
